from typing import List, Optional
from pydantic import BaseModel, Field
import datetime

# ================= AUTH SCHEMAS =================
class UserCreate(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", description="Valid email address")
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)

class UserLogin(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", description="Valid email address")
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


# ================= PROJECT SCHEMAS =================
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = ""
    target_audience: Optional[str] = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_audience: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    target_audience: Optional[str] = None
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class ProjectStats(BaseModel):
    total_epics: int = 0
    total_stories: int = 0
    completed_stories: int = 0
    pending_stories: int = 0
    in_progress_stories: int = 0
    total_story_points: int = 0
    completed_story_points: int = 0
    total_sprints: int = 0
    active_sprints: int = 0


# ================= REQUIREMENT SCHEMAS =================
class RequirementAnalyzeRequest(BaseModel):
    project_id: Optional[int] = None
    project_name: Optional[str] = ""
    raw_input: str = Field(..., min_length=10)

class RequirementAnalysisOutput(BaseModel):
    problem_statement: str
    objectives: List[str]
    target_users: List[str]
    functional_requirements: List[str]

class RequirementResponse(BaseModel):
    id: int
    project_id: int
    raw_input: str
    problem_statement: Optional[str]
    objectives: List[str]
    target_users: List[str]
    functional_requirements: List[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ================= STORY MAPPING SCHEMAS =================
class AcceptanceCriterionCreate(BaseModel):
    description: str

class AcceptanceCriterionResponse(BaseModel):
    id: int
    story_id: int
    description: str
    is_passed: bool

    class Config:
        from_attributes = True

class UserStoryCreate(BaseModel):
    project_id: int
    task_id: Optional[int] = None
    sprint_id: Optional[int] = None
    title: str
    role: str = "User"
    action: str
    benefit: str
    acceptance_criteria: List[str] = []
    story_points: int = 3
    priority: str = "MEDIUM" # LOW, MEDIUM, HIGH, CRITICAL
    status: str = "BACKLOG"  # BACKLOG, IN_PROGRESS, REVIEW, DONE
    release_tag: str = "MVP Release"
    order_index: int = 0

class UserStoryUpdate(BaseModel):
    task_id: Optional[int] = None
    sprint_id: Optional[int] = None
    title: Optional[str] = None
    role: Optional[str] = None
    action: Optional[str] = None
    benefit: Optional[str] = None
    acceptance_criteria: Optional[List[str]] = None
    story_points: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    release_tag: Optional[str] = None
    order_index: Optional[int] = None

class UserStoryResponse(BaseModel):
    id: int
    project_id: int
    task_id: Optional[int] = None
    sprint_id: Optional[int] = None
    title: str
    role: str
    action: str
    benefit: str
    acceptance_criteria: List[str] = []
    story_points: int
    priority: str
    status: str
    release_tag: str
    order_index: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class UserTaskCreate(BaseModel):
    project_id: int
    activity_id: int
    title: str
    order_index: int = 0

class UserTaskResponse(BaseModel):
    id: int
    project_id: int
    activity_id: int
    title: str
    order_index: int
    stories: List[UserStoryResponse] = []

    class Config:
        from_attributes = True

class UserActivityCreate(BaseModel):
    project_id: int
    epic_id: Optional[int] = None
    title: str
    order_index: int = 0

class UserActivityResponse(BaseModel):
    id: int
    project_id: int
    epic_id: Optional[int] = None
    title: str
    order_index: int
    tasks: List[UserTaskResponse] = []

    class Config:
        from_attributes = True

class EpicCreate(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = ""
    order_index: int = 0

class EpicResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str]
    order_index: int
    created_at: datetime.datetime
    activities: List[UserActivityResponse] = []

    class Config:
        from_attributes = True

class StoryMapData(BaseModel):
    epics: List[EpicResponse] = []
    unassigned_stories: List[UserStoryResponse] = []


# ================= AI GENERATION SCHEMAS =================
class StoryGenItem(BaseModel):
    title: str
    role: str
    action: str
    benefit: str
    acceptance_criteria: List[str]
    story_points: int
    priority: str
    release_tag: str

class TaskGenItem(BaseModel):
    task_title: str
    stories: List[StoryGenItem]

class ActivityGenItem(BaseModel):
    activity_title: str
    tasks: List[TaskGenItem]

class EpicGenItem(BaseModel):
    epic_title: str
    description: str
    activities: List[ActivityGenItem]

class AIGeneratedStoryMap(BaseModel):
    epics: List[EpicGenItem]

class GenerateStoriesRequest(BaseModel):
    project_id: int
    requirement_text: Optional[str] = None


# ================= AI STORY IMPROVER SCHEMAS =================
class StoryImprovementRequest(BaseModel):
    story_id: Optional[int] = None
    title: str
    role: str
    action: str
    benefit: str
    acceptance_criteria: List[str] = []

class StoryImprovementResponse(BaseModel):
    clarity_score: int # 1 to 100
    invest_check: dict # { "independent": bool, "negotiable": bool, "valuable": bool, "estimable": bool, "small": bool, "testable": bool }
    improved_title: str
    improved_role: str
    improved_action: str
    improved_benefit: str
    improved_acceptance_criteria: List[str]
    missing_requirements: List[str]
    suggested_edge_cases: List[str]
    critique_summary: str


# ================= SPRINT SCHEMAS =================
class SprintCreate(BaseModel):
    project_id: int
    name: str
    goal: Optional[str] = ""
    capacity_points: int = 20
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    capacity_points: Optional[int] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class SprintResponse(BaseModel):
    id: int
    project_id: int
    name: str
    goal: Optional[str]
    capacity_points: int
    status: str
    start_date: Optional[str]
    end_date: Optional[str]
    created_at: datetime.datetime
    stories: List[UserStoryResponse] = []
    total_assigned_points: int = 0

    class Config:
        from_attributes = True

class AISprintPlanRequest(BaseModel):
    project_id: int
    team_velocity_per_sprint: int = 20
    sprint_count: int = 3

class AISprintSuggestionItem(BaseModel):
    sprint_name: str
    sprint_goal: str
    story_ids: List[int]

class AISprintPlanResponse(BaseModel):
    sprints: List[AISprintSuggestionItem]
    rationale: str
