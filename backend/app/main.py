import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .content import get_content
from .database import create_db_and_tables, get_session
from .models import StudyPlan
from .planner import build_study_plan
from .schemas import ContentResponse, StudyPlanPayload, StudyPlanResponse


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db_and_tables()
    yield


def get_cors_origins() -> list[str]:
    origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


app = FastAPI(title="StudyFlow API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_response(plan: StudyPlan) -> StudyPlanResponse:
    return StudyPlanResponse(
        id=plan.id,
        subject=plan.subject,
        examDate=plan.exam_date,
        hoursPerDay=plan.hours_per_day,
        difficulty=plan.difficulty,
        focus=plan.focus,
        topicsInput=plan.topics_input,
        coverage=plan.coverage,
        dailyPlan=plan.daily_plan,
        daysUntilExam=plan.days_until_exam,
        pace=plan.pace,
        topics=plan.topics,
        totalHours=plan.total_hours,
        createdAt=plan.created_at,
        updatedAt=plan.updated_at,
    )


def apply_payload(plan: StudyPlan, payload: StudyPlanPayload) -> StudyPlan:
    calculated = build_study_plan(
        subject=payload.subject,
        exam_date=payload.examDate,
        hours_per_day=payload.hoursPerDay,
        difficulty=payload.difficulty,
        topics_input=payload.topics,
    )
    plan.subject = payload.subject
    plan.exam_date = payload.examDate
    plan.hours_per_day = payload.hoursPerDay
    plan.difficulty = payload.difficulty
    plan.focus = payload.focus
    plan.topics_input = payload.topics
    plan.coverage = calculated["coverage"]
    plan.daily_plan = calculated["dailyPlan"]
    plan.days_until_exam = calculated["daysUntilExam"]
    plan.pace = calculated["pace"]
    plan.topics = calculated["topics"]
    plan.total_hours = calculated["totalHours"]
    return plan


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def root() -> dict[str, str | list[str]]:
    return {
        "name": "StudyFlow API",
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
        "endpoints": [
            "/api/content",
            "/api/study-plans",
        ],
    }


@app.get("/api/content", response_model=ContentResponse)
def read_content() -> dict:
    return get_content()


@app.post(
    "/api/study-plans",
    response_model=StudyPlanResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_study_plan(
    payload: StudyPlanPayload,
    session: Session = Depends(get_session),
) -> StudyPlanResponse:
    plan = apply_payload(StudyPlan(), payload)
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return to_response(plan)


@app.get("/api/study-plans", response_model=list[StudyPlanResponse])
def list_study_plans(session: Session = Depends(get_session)) -> list[StudyPlanResponse]:
    plans = session.scalars(select(StudyPlan).order_by(StudyPlan.updated_at.desc())).all()
    return [to_response(plan) for plan in plans]


@app.get("/api/study-plans/{plan_id}", response_model=StudyPlanResponse)
def get_study_plan(
    plan_id: int,
    session: Session = Depends(get_session),
) -> StudyPlanResponse:
    plan = session.get(StudyPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Study plan not found")
    return to_response(plan)


@app.put("/api/study-plans/{plan_id}", response_model=StudyPlanResponse)
def update_study_plan(
    plan_id: int,
    payload: StudyPlanPayload,
    session: Session = Depends(get_session),
) -> StudyPlanResponse:
    plan = session.get(StudyPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Study plan not found")
    apply_payload(plan, payload)
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return to_response(plan)


@app.delete("/api/study-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_plan(plan_id: int, session: Session = Depends(get_session)) -> None:
    plan = session.get(StudyPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Study plan not found")
    session.delete(plan)
    session.commit()
