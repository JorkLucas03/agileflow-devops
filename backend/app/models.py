from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject: Mapped[str] = mapped_column(String(120), nullable=False)
    exam_date: Mapped[date] = mapped_column(Date, nullable=False)
    hours_per_day: Mapped[float] = mapped_column(Float, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)
    focus: Mapped[str] = mapped_column(String(60), nullable=False)
    topics_input: Mapped[str] = mapped_column(String(600), nullable=False)
    coverage: Mapped[int] = mapped_column(Integer, nullable=False)
    daily_plan: Mapped[list[dict]] = mapped_column(JSON, nullable=False)
    days_until_exam: Mapped[int] = mapped_column(Integer, nullable=False)
    pace: Mapped[str] = mapped_column(String(20), nullable=False)
    topics: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    total_hours: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
