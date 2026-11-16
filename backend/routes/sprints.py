import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth
import ai_service
try:
    from routes.stories import _format_story_response
except (ImportError, ModuleNotFoundError):
    try:
        from .stories import _format_story_response
    except Exception:
        from stories import _format_story_response

router = APIRouter(prefix="/api/sprints", tags=["Sprint Planning"])

@router.post("", response_model=schemas.SprintResponse, status_code=status.HTTP_201_CREATED)
def create_sprint(
    sprint_in: schemas.SprintCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new sprint."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == sprint_in.project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    sprint = models.Sprint(
        project_id=sprint_in.project_id,
        name=sprint_in.name,
        goal=sprint_in.goal,
        capacity_points=sprint_in.capacity_points,
        status="PLANNED",
        start_date=sprint_in.start_date,
        end_date=sprint_in.end_date
    )
    db.add(sprint)
    db.commit()
    db.refresh(sprint)

    return schemas.SprintResponse(
        id=sprint.id,
        project_id=sprint.project_id,
        name=sprint.name,
        goal=sprint.goal,
        capacity_points=sprint.capacity_points,
        status=sprint.status,
        start_date=sprint.start_date,
        end_date=sprint.end_date,
        created_at=sprint.created_at,
        stories=[],
        total_assigned_points=0
    )

@router.get("/project/{project_id}", response_model=List[schemas.SprintResponse])
def get_project_sprints(
    project_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """List all sprints for a project with their assigned stories."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    sprints = (
        db.query(models.Sprint)
        .filter(models.Sprint.project_id == project_id)
        .order_by(models.Sprint.created_at.asc())
        .all()
    )

    results = []
    for sp in sprints:
        stories = (
            db.query(models.UserStory)
            .filter(models.UserStory.sprint_id == sp.id)
            .order_by(models.UserStory.order_index)
            .all()
        )
        formatted_stories = [_format_story_response(s) for s in stories]
        assigned_pts = sum(s.story_points for s in formatted_stories)

        results.append(schemas.SprintResponse(
            id=sp.id,
            project_id=sp.project_id,
            name=sp.name,
            goal=sp.goal,
            capacity_points=sp.capacity_points,
            status=sp.status,
            start_date=sp.start_date,
            end_date=sp.end_date,
            created_at=sp.created_at,
            stories=formatted_stories,
            total_assigned_points=assigned_pts
        ))
    return results

@router.put("/{sprint_id}", response_model=schemas.SprintResponse)
def update_sprint(
    sprint_id: int,
    sprint_in: schemas.SprintUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update sprint metadata or status."""
    sprint = (
        db.query(models.Sprint)
        .join(models.Project)
        .filter(models.Sprint.id == sprint_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found.")

    if sprint_in.name is not None:
        sprint.name = sprint_in.name
    if sprint_in.goal is not None:
        sprint.goal = sprint_in.goal
    if sprint_in.capacity_points is not None:
        sprint.capacity_points = sprint_in.capacity_points
    if sprint_in.status is not None:
        sprint.status = sprint_in.status
    if sprint_in.start_date is not None:
        sprint.start_date = sprint_in.start_date
    if sprint_in.end_date is not None:
        sprint.end_date = sprint_in.end_date

    db.commit()
    db.refresh(sprint)

    stories = db.query(models.UserStory).filter(models.UserStory.sprint_id == sprint.id).all()
    formatted = [_format_story_response(s) for s in stories]
    return schemas.SprintResponse(
        id=sprint.id,
        project_id=sprint.project_id,
        name=sprint.name,
        goal=sprint.goal,
        capacity_points=sprint.capacity_points,
        status=sprint.status,
        start_date=sprint.start_date,
        end_date=sprint.end_date,
        created_at=sprint.created_at,
        stories=formatted,
        total_assigned_points=sum(s.story_points for s in formatted)
    )

@router.delete("/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sprint(
    sprint_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete sprint and reset its stories back to unassigned backlog."""
    sprint = (
        db.query(models.Sprint)
        .join(models.Project)
        .filter(models.Sprint.id == sprint_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found.")

    # Unassign stories
    db.query(models.UserStory).filter(models.UserStory.sprint_id == sprint_id).update({"sprint_id": None})
    db.delete(sprint)
    db.commit()
    return None

@router.post("/assign-story")
def assign_story_to_sprint(
    story_id: int,
    sprint_id: int, # Pass 0 or -1 to unassign
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Assign or unassign a story to/from a sprint."""
    story = (
        db.query(models.UserStory)
        .join(models.Project)
        .filter(models.UserStory.id == story_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not story:
        raise HTTPException(status_code=404, detail="Story not found.")

    if sprint_id > 0:
        sprint = db.query(models.Sprint).filter(models.Sprint.id == sprint_id, models.Sprint.project_id == story.project_id).first()
        if not sprint:
            raise HTTPException(status_code=404, detail="Sprint not found in this project.")
        story.sprint_id = sprint_id
    else:
        story.sprint_id = None

    db.commit()
    db.refresh(story)
    return {"message": "Story sprint assignment updated.", "story_id": story.id, "sprint_id": story.sprint_id}

@router.post("/ai-plan", response_model=schemas.AISprintPlanResponse)
def ai_sprint_planner(
    plan_req: schemas.AISprintPlanRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate an intelligent AI-assisted sprint plan based on backlog story points,
    priorities, and team velocity. Does not claim to be guaranteed optimal.
    """
    project = (
        db.query(models.Project)
        .filter(models.Project.id == plan_req.project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    stories = db.query(models.UserStory).filter(models.UserStory.project_id == plan_req.project_id).all()
    if not stories:
        raise HTTPException(status_code=400, detail="No user stories found in this project to plan into sprints.")

    story_payload = [
        {
            "id": s.id,
            "title": s.title,
            "points": s.story_points or 3,
            "priority": s.priority or "MEDIUM",
            "release": s.release_tag
        }
        for s in stories
    ]

    try:
        plan = ai_service.plan_sprints_with_ai(
            stories=story_payload,
            velocity_per_sprint=plan_req.team_velocity_per_sprint,
            sprint_count=plan_req.sprint_count
        )
        return plan
    except ai_service.AIUnavailableError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI Service Unavailable: {str(e)}"
        )
    except ai_service.AIValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Output Validation Error: {str(e)}"
        )
