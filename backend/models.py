import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
)
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_audience = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    requirements = relationship("Requirement", back_populates="project", cascade="all, delete-orphan")
    epics = relationship("Epic", back_populates="project", cascade="all, delete-orphan")
    activities = relationship("UserActivity", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("UserTask", back_populates="project", cascade="all, delete-orphan")
    stories = relationship("UserStory", back_populates="project", cascade="all, delete-orphan")
    sprints = relationship("Sprint", back_populates="project", cascade="all, delete-orphan")


class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    raw_input = Column(Text, nullable=False)
    problem_statement = Column(Text, nullable=True)
    objectives = Column(Text, nullable=True)               # JSON-encoded list of strings
    target_users = Column(Text, nullable=True)             # JSON-encoded list of strings
    functional_requirements = Column(Text, nullable=True)  # JSON-encoded list of strings
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="requirements")


class Epic(Base):
    __tablename__ = "epics"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="epics")
    activities = relationship("UserActivity", back_populates="epic", cascade="all, delete-orphan")


class UserActivity(Base):
    __tablename__ = "user_activities"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    epic_id = Column(Integer, ForeignKey("epics.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    order_index = Column(Integer, default=0)

    project = relationship("Project", back_populates="activities")
    epic = relationship("Epic", back_populates="activities")
    tasks = relationship("UserTask", back_populates="activity", cascade="all, delete-orphan")


class UserTask(Base):
    __tablename__ = "user_tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    activity_id = Column(Integer, ForeignKey("user_activities.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    order_index = Column(Integer, default=0)

    project = relationship("Project", back_populates="tasks")
    activity = relationship("UserActivity", back_populates="tasks")
    stories = relationship("UserStory", back_populates="task")


class UserStory(Base):
    __tablename__ = "user_stories"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(Integer, ForeignKey("user_tasks.id", ondelete="SET NULL"), nullable=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False, default="User")           # As a [role]
    action = Column(Text, nullable=False)                                 # I want [action]
    benefit = Column(Text, nullable=False)                                # So that [benefit]
    acceptance_criteria = Column(Text, nullable=True)                     # JSON-encoded list of strings
    story_points = Column(Integer, default=3)
    priority = Column(String(50), default="MEDIUM")                       # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="BACKLOG")                        # BACKLOG, IN_PROGRESS, REVIEW, DONE
    release_tag = Column(String(100), default="MVP Release")
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="stories")
    task = relationship("UserTask", back_populates="stories")
    sprint = relationship("Sprint", back_populates="stories")
    criteria = relationship("AcceptanceCriterion", back_populates="story", cascade="all, delete-orphan")


class AcceptanceCriterion(Base):
    __tablename__ = "acceptance_criteria"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("user_stories.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    is_passed = Column(Boolean, default=False)

    story = relationship("UserStory", back_populates="criteria")


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    goal = Column(Text, nullable=True)
    capacity_points = Column(Integer, default=20)
    status = Column(String(50), default="PLANNED")  # PLANNED, ACTIVE, COMPLETED
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="sprints")
    stories = relationship("UserStory", back_populates="sprint")
