from datetime import date, timedelta

from app.planner import build_study_plan, get_days_until, split_topics


def test_split_topics_limits_and_cleans_values():
    topics = split_topics(" A, B, , C, D, E, F, G, H, I ")

    assert topics == ["A", "B", "C", "D", "E", "F", "G", "H"]


def test_get_days_until_never_returns_less_than_one():
    today = date(2026, 6, 10)

    assert get_days_until(today - timedelta(days=3), today) == 1
    assert get_days_until(today, today) == 1


def test_build_study_plan_changes_pace_by_difficulty():
    exam_date = date(2026, 6, 11)
    today = date(2026, 6, 10)

    low = build_study_plan(
        subject="Matematicas",
        exam_date=exam_date,
        hours_per_day=3,
        difficulty="Baja",
        topics_input="Limites, Derivadas, Integrales, Series, Matrices",
        today=today,
    )
    high = build_study_plan(
        subject="Matematicas",
        exam_date=exam_date,
        hours_per_day=3,
        difficulty="Alta",
        topics_input="Limites, Derivadas, Integrales, Series, Matrices",
        today=today,
    )

    assert low["coverage"] > high["coverage"]
    assert high["pace"] == "Intenso"


def test_build_study_plan_uses_subject_when_topics_are_empty():
    plan = build_study_plan(
        subject="Programacion",
        exam_date=date(2026, 6, 20),
        hours_per_day=2,
        difficulty="Media",
        topics_input="",
        today=date(2026, 6, 10),
    )

    assert plan["dailyPlan"][0]["title"] == "Programacion"
    assert plan["dailyPlan"][-1]["title"] == "Simulacro final"
