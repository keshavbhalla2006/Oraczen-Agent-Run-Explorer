from app.explain import build_explanation
from tests.helpers import make_run


def test_explain_streams_a_deterministic_explanation(client):
    first = client.post("/api/runs/run_2/explain")
    second = client.post("/api/runs/run_2/explain")
    assert first.status_code == 200
    assert first.headers["content-type"].startswith("text/plain")
    assert first.text == second.text
    assert "run_2" in first.text
    assert "failed with a Boom: it broke" in first.text
    assert "step 1 ('only_step'" in first.text


def test_explain_unknown_run_is_404_not_an_empty_stream(client):
    assert client.post("/api/runs/nope/explain").status_code == 404


def test_explanation_does_not_invent_a_step_when_error_index_is_out_of_range():
    run = make_run("r", status="failed").model_copy(update={"steps": []})
    text = build_explanation(run)
    assert "No steps were recorded" in text
    assert "cannot be confirmed" in text