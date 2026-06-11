from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .content import DIFFICULTY_OPTIONS, FOCUS_OPTIONS


class DailyPlanItem(BaseModel):
    label: str
    title: str
    time: str
    tasks: list[str]


class StudyPlanPayload(BaseModel):
    subject: Annotated[str, Field(min_length=1, max_length=120)]
    examDate: date
    hoursPerDay: Annotated[float, Field(ge=1, le=8)]
    difficulty: str
    focus: str
    topics: Annotated[str, Field(max_length=600)] = ""

    @field_validator("subject")
    @classmethod
    def clean_subject(cls, value: str) -> str:
        return value.strip()

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, value: str) -> str:
        if value not in DIFFICULTY_OPTIONS:
            raise ValueError("difficulty must be one of: " + ", ".join(DIFFICULTY_OPTIONS))
        return value

    @field_validator("focus")
    @classmethod
    def validate_focus(cls, value: str) -> str:
        if value not in FOCUS_OPTIONS:
            raise ValueError("focus must be one of: " + ", ".join(FOCUS_OPTIONS))
        return value


class StudyPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject: str
    examDate: date
    hoursPerDay: float
    difficulty: str
    focus: str
    topicsInput: str
    coverage: int
    dailyPlan: list[DailyPlanItem]
    daysUntilExam: int
    pace: str
    topics: list[str]
    totalHours: float
    createdAt: datetime
    updatedAt: datetime


class ContentResponse(BaseModel):
    appInfo: dict
    defaultTopics: list[str]
    difficultyOptions: list[str]
    focusOptions: list[str]
    checklistItems: list[dict]
    studyMethods: list[dict]
