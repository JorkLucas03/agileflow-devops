import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.database import Base, get_session
from app.main import app


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        pool_pre_ping=True,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_session() -> Generator[Session, None, None]:
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def plan_payload(**overrides):
    payload = {
        "subject": "Matematicas",
        "examDate": "2026-06-24",
        "hoursPerDay": 2,
        "difficulty": "Media",
        "focus": "Examen parcial",
        "topics": "Limites, Derivadas, Integrales",
    }
    payload.update(overrides)
    return payload


def test_health(client: TestClient):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_shows_api_info(client: TestClient):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["name"] == "StudyFlow API"
    assert response.json()["docs"] == "/docs"


def test_content_endpoint(client: TestClient):
    response = client.get("/api/content")

    assert response.status_code == 200
    assert response.json()["appInfo"]["name"] == "StudyFlow"


def test_crud_study_plan(client: TestClient):
    create_response = client.post("/api/study-plans", json=plan_payload())

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"] == 1
    assert created["dailyPlan"][0]["title"] == "Limites"

    list_response = client.get("/api/study-plans")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    get_response = client.get("/api/study-plans/1")
    assert get_response.status_code == 200
    assert get_response.json()["subject"] == "Matematicas"

    update_response = client.put(
        "/api/study-plans/1",
        json=plan_payload(subject="Programacion", topics="Funciones, Arrays, APIs"),
    )
    assert update_response.status_code == 200
    assert update_response.json()["subject"] == "Programacion"
    assert update_response.json()["dailyPlan"][0]["title"] == "Funciones"

    delete_response = client.delete("/api/study-plans/1")
    assert delete_response.status_code == 204
    assert client.get("/api/study-plans/1").status_code == 404


def test_validates_payload(client: TestClient):
    response = client.post(
        "/api/study-plans",
        json=plan_payload(hoursPerDay=12, difficulty="Imposible"),
    )

    assert response.status_code == 422
