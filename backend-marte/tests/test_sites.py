def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_create_and_get_site(client):
    payload = {
        "name": "Desierto de Atacama",
        "country": "Chile",
        "latitude": -23.5,
        "longitude": -68.2,
        "radius_km": 10,
        "biome": "Desierto hiperárido"
    }
    created = client.post("/api/v1/sites", json=payload)
    assert created.status_code == 201
    site_id = created.json()["id"]

    fetched = client.get(f"/api/v1/sites/{site_id}")
    assert fetched.status_code == 200
    assert fetched.json()["name"] == payload["name"]

def test_filter_sites(client):
    client.post("/api/v1/sites", json={
        "name": "Atacama", "latitude": -23.5, "longitude": -68.2
    })
    client.post("/api/v1/sites", json={
        "name": "McMurdo", "latitude": -77.5, "longitude": 163.0
    })
    response = client.get("/api/v1/sites", params={"q": "Atacama"})
    assert response.status_code == 200
    assert len(response.json()) == 1

def test_reject_invalid_coordinates(client):
    response = client.post("/api/v1/sites", json={
        "name": "Lugar inválido", "latitude": 120, "longitude": 0
    })
    assert response.status_code == 422

def test_delete_site(client):
    created = client.post("/api/v1/sites", json={
        "name": "Sitio temporal", "latitude": 0, "longitude": 0
    })
    site_id = created.json()["id"]
    deleted = client.delete(f"/api/v1/sites/{site_id}")
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/sites/{site_id}").status_code == 404
