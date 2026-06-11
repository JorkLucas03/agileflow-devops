from datetime import date
from math import ceil

DIFFICULTY_WEIGHT = {
    "Baja": 0.85,
    "Media": 1,
    "Alta": 1.25,
}


def split_topics(value: str) -> list[str]:
    return [topic.strip() for topic in value.split(",") if topic.strip()][:8]


def get_days_until(exam_date: date, today: date | None = None) -> int:
    current = today or date.today()
    return max(1, ceil((exam_date - current).days))


def build_study_plan(
    *,
    subject: str,
    exam_date: date,
    hours_per_day: float,
    difficulty: str,
    topics_input: str,
    today: date | None = None,
) -> dict:
    topics = split_topics(topics_input)
    days_until_exam = get_days_until(exam_date, today)
    total_hours = days_until_exam * hours_per_day
    required_hours = max(6, len(topics) * 3.5 * DIFFICULTY_WEIGHT[difficulty])
    coverage = min(100, round((total_hours / required_hours) * 100))
    pace = "Comodo" if coverage >= 90 else "Constante" if coverage >= 62 else "Intenso"
    sessions = min(5, max(3, len(topics)))

    daily_plan = []
    for index in range(sessions):
        day_number = index + 1
        topic = topics[index % len(topics)] if topics else subject
        is_final_session = day_number == sessions
        daily_plan.append(
            {
                "label": "Cierre" if is_final_session else f"Sesion {day_number}",
                "title": "Simulacro final" if is_final_session else topic,
                "time": (
                    f"{hours_per_day:g} h"
                    if is_final_session
                    else f"{max(1, hours_per_day - 0.5):g} h"
                ),
                "tasks": (
                    [
                        "Resolver un simulacro",
                        "Corregir errores",
                        "Preparar hoja de formulas o resumen",
                    ]
                    if is_final_session
                    else [
                        "Repasar conceptos clave",
                        "Resolver ejercicios",
                        "Anotar dudas para la siguiente sesion",
                    ]
                ),
            }
        )

    return {
        "coverage": coverage,
        "dailyPlan": daily_plan,
        "daysUntilExam": days_until_exam,
        "pace": pace,
        "topics": topics,
        "totalHours": total_hours,
    }
