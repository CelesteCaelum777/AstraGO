import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, Mock

import requests
from pydantic import ValidationError
from fastapi import HTTPException
import analog_service as climate
import elevation_service as terrain
from main import SearchRequest, search


class ElevationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        cache = patch.object(climate, 'CACHE_PATH', Path(self.temp.name) / 'elevation.sqlite3')
        cache.start()
        self.addCleanup(cache.stop)

    def response(self, values):
        result = Mock()
        result.json.return_value = {'elevation': values}
        return result

    def test_grid_order_and_single_batch(self):
        with patch.object(terrain.requests, 'get', return_value=self.response(list(range(49)))) as get:
            grid = terrain.terrain_grid(-23.5, -69.9)
        self.assertEqual(get.call_count, 1)
        query = get.call_args.kwargs['params']
        latitudes = list(map(float, query['latitude'].split(',')))
        longitudes = list(map(float, query['longitude'].split(',')))
        self.assertEqual(len(latitudes), 49)
        self.assertEqual(latitudes[24], -23.5)
        self.assertEqual(longitudes[24], -69.9)
        self.assertEqual(grid['z'][3][3], 24)
        self.assertEqual(grid['z'][6][0], 42)
        self.assertEqual(grid['longitudes'][0], -69.96)
        self.assertEqual(grid['latitudes'][-1], -23.44)

    def test_cache_and_negative_physical_elevation(self):
        with patch.object(terrain.requests, 'get', return_value=self.response([-100])) as get:
            self.assertEqual(terrain.fetch_elevations([(0, 0)])['elevation'], [-100])
            terrain.fetch_elevations([(0, 0)])
            self.assertEqual(get.call_count, 1)

    def test_partial_cache_still_fetches_full_grid(self):
        with patch.object(terrain.requests, 'get', return_value=self.response([2500])):
            terrain.fetch_elevations([(-23.5, -69.9)])
        with patch.object(terrain.requests, 'get', return_value=self.response([2500] * 49)) as get:
            terrain.terrain_grid(-23.5, -69.9)
        self.assertEqual(len(get.call_args.kwargs['params']['latitude'].split(',')), 49)

    def test_invalid_response_does_not_fabricate_altitudes(self):
        for values in ([None], [True], [float('nan')], [], [1, 2]):
            with patch.object(terrain.requests, 'get', return_value=self.response(values)):
                with self.assertRaises(ValueError):
                    terrain.fetch_elevations([(0, 0)])

    def test_outage_uses_labelled_stale_cache(self):
        with patch.object(terrain.requests, 'get', return_value=self.response([2500])):
            terrain.fetch_elevations([(0, 0)])
        with patch.object(terrain, 'TTL', -1), patch.object(terrain.requests, 'get', side_effect=requests.ConnectionError()):
            self.assertTrue(terrain.fetch_elevations([(0, 0)])['stale'])
            with self.assertRaises(requests.ConnectionError):
                terrain.fetch_elevations([(1, 1)])

    def test_seven_variable_score_matches_formula(self):
        targets = {**climate.build_default_targets(), 'ELEVATION': 2500}
        weights = {**climate.build_default_weights(), 'ELEVATION': 6}
        altitudes = [2500, 0, 6000, 10000, -100, 1000, 3500]
        with patch.object(terrain, 'fetch_elevations', return_value={'elevation': altitudes, 'source': 'Open-Meteo', 'stale': False}):
            result = terrain.search_with_elevation(targets, weights, 0, 'demo')
        original = climate.search_regions(targets, weights, 0, 'demo')['results']
        by_id = {row['id']: row for row in result['results']}
        for row, height in zip(original, altitudes):
            numerator = sum(weights[key] * min(1, abs(row['values'][key] - targets[key]) / (climate.RANGE_LIMITS[key][1] - climate.RANGE_LIMITS[key][0])) for key in climate.PARAMETERS)
            numerator += 6 * min(1, abs(height - 2500) / 6000)
            expected = round(100 * (1 - numerator / sum(weights.values())), 2)
            self.assertEqual(by_id[row['id']]['similarity'], expected)
            self.assertEqual(by_id[row['id']]['values']['ELEVATION'], height)

    def test_filter_applied_after_combined_score(self):
        targets = {**climate.build_default_targets(), 'ELEVATION': 2500}
        weights = {key: 1 for key in climate.PARAMETERS} | {'ELEVATION': 10}
        with patch.object(terrain, 'fetch_elevations', return_value={'elevation': [2500]*7, 'source': 'Open-Meteo', 'stale': False}):
            result = terrain.search_with_elevation(targets, weights, 85, 'demo')
        self.assertTrue(result['results'])
        self.assertTrue(all(row['similarity'] >= 85 for row in result['results']))
        self.assertTrue(any(row['climate_similarity'] < 85 for row in result['results']))

    def test_extended_validation_and_legacy_compatibility(self):
        self.assertEqual(len(SearchRequest().targets), 6)
        targets = {**climate.build_default_targets(), 'ELEVATION': 2500}
        weights = {**climate.build_default_weights(), 'ELEVATION': 6}
        self.assertEqual(len(SearchRequest(targets=targets, weights=weights).targets), 7)
        for bad_targets, bad_weights in ((targets, climate.build_default_weights()), ({**targets, 'ELEVATION': 6001}, weights), (targets, {**weights, 'ELEVATION': 0})):
            with self.assertRaises(ValidationError):
                SearchRequest(targets=bad_targets, weights=bad_weights)

    def test_api_returns_explicit_upstream_error(self):
        request = SearchRequest(targets={**climate.build_default_targets(), 'ELEVATION': 2500}, weights={**climate.build_default_weights(), 'ELEVATION': 6}, mode='demo')
        with patch('main.search_with_elevation', side_effect=requests.ConnectionError()):
            with self.assertRaises(HTTPException) as error:
                search(request)
        self.assertEqual(error.exception.status_code, 502)

    def test_polar_and_antimeridian_coordinates_remain_valid(self):
        with patch.object(terrain.requests, 'get', return_value=self.response([0]*49)) as get:
            grid = terrain.terrain_grid(90, 180)
        self.assertEqual(len(grid['z']), 7)
        query = get.call_args.kwargs['params']
        self.assertTrue(all(-90 <= float(v) <= 90 for v in query['latitude'].split(',')))
        self.assertTrue(all(-180 <= float(v) <= 180 for v in query['longitude'].split(',')))


if __name__ == '__main__':
    unittest.main()
