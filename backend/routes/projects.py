from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
import models
import schemas
import auth

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.post("", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: schemas.ProjectCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new Agile project."""
    project = models.Project(
        user_id=current_user.id,
        name=project_in.name,
        description=project_in.description,
        target_audience=project_in.target_audience
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("", response_model=List[schemas.ProjectResponse])
def list_projects(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """List all projects belonging to the logged-in user."""
    projects = (
        db.query(models.Project)
        .filter(models.Project.user_id == current_user.id)
        .order_by(models.Project.created_at.desc())
        .all()
    )
    return projects

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(
    project_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get project details."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    return project

@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(
    project_id: int,
    project_in: schemas.ProjectUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update project name, description or audience."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    if project_in.name is not None:
        project.name = project_in.name
    if project_in.description is not None:
        project.description = project_in.description
    if project_in.target_audience is not None:
        project.target_audience = project_in.target_audience

    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a project and all associated stories, epics, and sprints."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    db.delete(project)
    db.commit()
    return None

@router.get("/{project_id}/stats", response_model=schemas.ProjectStats)
def get_project_stats(
    project_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get project statistics for metrics cards and charts."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    stories = db.query(models.UserStory).filter(models.UserStory.project_id == project_id).all()
    epics_count = db.query(models.Epic).filter(models.Epic.project_id == project_id).count()
    sprints = db.query(models.Sprint).filter(models.Sprint.project_id == project_id).all()

    total_stories = len(stories)
    completed_stories = sum(1 for s in stories if s.status.upper() == "DONE")
    in_progress = sum(1 for s in stories if s.status.upper() in ["IN_PROGRESS", "REVIEW"])
    pending_stories = total_stories - completed_stories

    total_points = sum(s.story_points or 0 for s in stories)
    completed_points = sum(s.story_points or 0 for s in stories if s.status.upper() == "DONE")

    total_sprints = len(sprints)
    active_sprints = sum(1 for sp in sprints if sp.status.upper() == "ACTIVE")

    return schemas.ProjectStats(
        total_epics=epics_count,
        total_stories=total_stories,
        completed_stories=completed_stories,
        pending_stories=pending_stories,
        in_progress_stories=in_progress,
        total_story_points=total_points,
        completed_story_points=completed_points,
        total_sprints=total_sprints,
        active_sprints=active_sprints
    )
