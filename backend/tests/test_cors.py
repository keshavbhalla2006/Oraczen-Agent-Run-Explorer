def test_cors_allows_both_local_frontend_origins(client):
    for origin in ("http://localhost:3000", "http://127.0.0.1:3000"):
        r = client.get("/api/health", headers={"Origin": origin})
        assert r.headers["access-control-allow-origin"] == origin


def test_cors_does_not_allow_other_origins(client):
    r = client.get("/api/health", headers={"Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in r.headers