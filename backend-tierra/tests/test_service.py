import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import requests
from pydantic import ValidationError
import analog_service as service
from main import SearchRequest, search, toolkit_config


class ScientificSearchTests(unittest.TestCase):
    def setUp(self):
        self.targets = service.build_default_targets()
        self.weights = service.build_default_weights()

    def test_identical_and_extreme_values(self):
        self.assertEqual(service.score_similarity(self.targets, self.targets, self.weights), 100)
        extreme = {k: 1e9 for k in service.PARAMETERS}
        self.assertEqual(service.score_similarity(extreme, self.targets, self.weights), 0)

    def test_weighted_formula(self):
        values = dict(self.targets)
        values['T2M'] += 75  # Half of the documented 150 °C normalization span.
        weights = dict.fromkeys(service.PARAMETERS, 1)
        weights['T2M'] = 10
        self.assertAlmostEqual(service.score_similarity(values, self.targets, weights), (1 - 5 / 15) * 100)

    def test_reject_invalid_inputs(self):
        for changes in ({'weights': {'T2M': 5}}, {'min_similarity': 101}, {'targets': {**self.targets, 'T2M': float('nan')}}, {'weights': {**self.weights, 'T2M': 0}}):
            with self.assertRaises(ValidationError):
                SearchRequest(**changes)

    def test_demo_sorted_filtered_and_labelled(self):
        result = search(SearchRequest(mode='demo', min_similarity=0))
        self.assertEqual(len(result['results']), 7)
        scores = [r['similarity'] for r in result['results']]
        self.assertEqual(scores, sorted(scores, reverse=True))
        self.assertTrue(all(r['demo'] for r in result['results']))
        self.assertEqual(search(SearchRequest(mode='demo', min_similarity=100))['results'], [])

    def test_missing_values_never_become_zero(self):
        data = {'properties': {'parameter': {k: {'ANN': -999} for k in service.PARAMETERS}}}
        with self.assertRaises(ValueError):
            service.parse_power_values(data)

    def test_annual_mean_not_double_counted(self):
        data = {'properties': {'parameter': {k: {'ANN': 12, 'JAN': 24} for k in service.PARAMETERS}}}
        self.assertTrue(all(v == 12 for v in service.parse_power_values(data).values()))

    def test_persistent_cache_and_stale_fallback(self):
        data = {'properties': {'parameter': {k: {'ANN': 12} for k in service.PARAMETERS}}}
        with tempfile.TemporaryDirectory() as directory, patch.object(service, 'CACHE_PATH', Path(directory) / 'cache.sqlite3'), patch.object(service, '_power_request', return_value=data) as fetch:
            service.fetch_power_point(0, 0)
            self.assertIn('caché', service.fetch_power_point(0, 0)['source'])
            self.assertEqual(fetch.call_count, 1)
            with patch.object(service, 'CACHE_TTL', -1):
                fetch.side_effect = requests.ConnectionError()
                self.assertTrue(service.fetch_power_point(0, 0)['stale'])

    def test_live_failure_marked_demo(self):
        with patch.object(service, 'fetch_power_point', side_effect=requests.ConnectionError()):
            result = service.search_regions(self.targets, self.weights, 0)
            self.assertEqual(result['demo_count'], 7)
            self.assertTrue(all('warning' in r for r in result['results']))

    def test_toolkit_does_not_claim_availability(self):
        with patch.dict('os.environ', {}, clear=True):
            self.assertEqual(toolkit_config()['status'], 'unconfigured')


if __name__ == '__main__':
    unittest.main()
