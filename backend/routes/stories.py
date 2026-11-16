import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
import models
import schemas
import auth
import ai_service

router = APIRouter(prefix="/api/stories", tags=["Stories & Mapping"])

def _format_story_response(story: models.UserStory) -> schemas.UserStoryResponse:
    ac_list = []
    if story.acceptance_criteria:
        try:
            ac_list = json.loads(story.acceptance_criteria)
        except Exception:
            ac_list = [story.acceptance_criteria]
    return schemas.UserStoryResponse(
        id=story.id,
        project_id=story.project_id,
        task_id=story.task_id,
        sprint_id=story.sprint_id,
        title=story.title,
        role=story.role,
        action=story.action,
        benefit=story.benefit,
        acceptance_criteria=ac_list,
        story_points=story.story_points or 3,
        priority=story.priority or "MEDIUM",
        status=story.status or "BACKLOG",
        release_tag=story.release_tag or "MVP Release",
        order_index=story.order_index or 0,
        created_at=story.created_at
    )

@router.post("/generate", response_model=schemas.StoryMapData)
def generate_stories_with_ai(
    req: schemas.GenerateStoriesRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate complete Agile User Story Map (Epics, Activities, Tasks, Stories)
    using Ollama, and save all generated entities directly to the database.
    """
    project = (
        db.query(models.Project)
        .filter(models.Project.id == req.project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # Get requirement text either from payload or from stored project requirement
    req_text = req.requirement_text
    if not req_text:
        saved_req = db.query(models.Requirement).filter(models.Requirement.project_id == project.id).first()
        if saved_req:
            req_text = f"Problem: {saved_req.problem_statement}\nFunctional Requirements: {saved_req.functional_requirements}"
        else:
            req_text = project.description or project.name

    if not req_text or len(req_text.strip()) < 5:
        raise HTTPException(status_code=400, detail="Please provide project requirements or description to generate stories.")

    try:
        story_map_ai = ai_service.generate_user_story_map(project.name, req_text)
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

    # Persist the generated tree into database
    for epic_idx, epic_data in enumerate(story_map_ai.epics):
        db_epic = models.Epic(
            project_id=project.id,
            title=epic_data.epic_title,
            description=epic_data.description,
            order_index=epic_idx
        )
        db.add(db_epic)
        db.flush()

        for act_idx, act_data in enumerate(epic_data.activities):
            db_activity = models.UserActivity(
                project_id=project.id,
                epic_id=db_epic.id,
                title=act_data.activity_title,
                order_index=act_idx
            )
            db.add(db_activity)
            db.flush()

            for task_idx, task_data in enumerate(act_data.tasks):
                db_task = models.UserTask(
                    project_id=project.id,
                    activity_id=db_activity.id,
                    title=task_data.task_title,
                    order_index=task_idx
                )
                db.add(db_task)
                db.flush()

                for story_idx, story_data in enumerate(task_data.stories):
                    db_story = models.UserStory(
                        project_id=project.id,
                        task_id=db_task.id,
                        title=story_data.title,
                        role=story_data.role,
                        action=story_data.action,
                        benefit=story_data.benefit,
                        acceptance_criteria=json.dumps(story_data.acceptance_criteria),
                        story_points=story_data.story_points,
                        priority=story_data.priority,
                        status="BACKLOG",
                        release_tag=story_data.release_tag,
                        order_index=story_idx
                    )
                    db.add(db_story)

    db.commit()
    return get_story_map(project.id, current_user, db)

@router.get("/project/{project_id}/map", response_model=schemas.StoryMapData)
def get_story_map(
    project_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full hierarchical story map for visual board display."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    epics = (
        db.query(models.Epic)
        .filter(models.Epic.project_id == project_id)
        .order_by(models.Epic.order_index)
        .all()
    )

    epic_responses = []
    for epic in epics:
        act_responses = []
        activities = (
            db.query(models.UserActivity)
            .filter(models.UserActivity.epic_id == epic.id)
            .order_by(models.UserActivity.order_index)
            .all()
        )
        for act in activities:
            task_responses = []
            tasks = (
                db.query(models.UserTask)
                .filter(models.UserTask.activity_id == act.id)
                .order_by(models.UserTask.order_index)
                .all()
            )
            for t in tasks:
                stories = (
                    db.query(models.UserStory)
                    .filter(models.UserStory.task_id == t.id)
                    .order_by(models.UserStory.order_index)
                    .all()
                )
                formatted_stories = [_format_story_response(s) for s in stories]
                task_responses.append(schemas.UserTaskResponse(
                    id=t.id,
                    project_id=t.project_id,
                    activity_id=t.activity_id,
                    title=t.title,
                    order_index=t.order_index,
                    stories=formatted_stories
                ))
            act_responses.append(schemas.UserActivityResponse(
                id=act.id,
                project_id=act.project_id,
                epic_id=act.epic_id,
                title=act.title,
                order_index=act.order_index,
                tasks=task_responses
            ))
        epic_responses.append(schemas.EpicResponse(
            id=epic.id,
            project_id=epic.project_id,
            title=epic.title,
            description=epic.description,
            order_index=epic.order_index,
            created_at=epic.created_at,
            activities=act_responses
        ))

    # Stories with no task assigned (unassigned backlog)
    unassigned = (
        db.query(models.UserStory)
        .filter(models.UserStory.project_id == project_id, models.UserStory.task_id == None)
        .order_by(models.UserStory.order_index)
        .all()
    )
    unassigned_formatted = [_format_story_response(s) for s in unassigned]

    return schemas.StoryMapData(
        epics=epic_responses,
        unassigned_stories=unassigned_formatted
    )

@router.get("/project/{project_id}", response_model=List[schemas.UserStoryResponse])
def list_project_stories(
    project_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """List all stories in a project."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    stories = (
        db.query(models.UserStory)
        .filter(models.UserStory.project_id == project_id)
        .order_by(models.UserStory.order_index)
        .all()
    )
    return [_format_story_response(s) for s in stories]

@router.post("", response_model=schemas.UserStoryResponse, status_code=status.HTTP_201_CREATED)
def create_story(
    story_in: schemas.UserStoryCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Manually add a new user story."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == story_in.project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    story = models.UserStory(
        project_id=story_in.project_id,
        task_id=story_in.task_id,
        sprint_id=story_in.sprint_id,
        title=story_in.title,
        role=story_in.role,
        action=story_in.action,
        benefit=story_in.benefit,
        acceptance_criteria=json.dumps(story_in.acceptance_criteria),
        story_points=story_in.story_points,
        priority=story_in.priority,
        status=story_in.status,
        release_tag=story_in.release_tag,
        order_index=story_in.order_index
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    return _format_story_response(story)

@router.put("/{story_id}", response_model=schemas.UserStoryResponse)
def update_story(
    story_id: int,
    story_in: schemas.UserStoryUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing user story."""
    story = (
        db.query(models.UserStory)
        .join(models.Project)
        .filter(models.UserStory.id == story_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not story:
        raise HTTPException(status_code=404, detail="Story not found.")

    if story_in.title is not None:
        story.title = story_in.title
    if story_in.role is not None:
        story.role = story_in.role
    if story_in.action is not None:
        story.action = story_in.action
    if story_in.benefit is not None:
        story.benefit = story_in.benefit
    if story_in.acceptance_criteria is not None:
        story.acceptance_criteria = json.dumps(story_in.acceptance_criteria)
    if story_in.story_points is not None:
        story.story_points = story_in.story_points
    if story_in.priority is not None:
        story.priority = story_in.priority
    if story_in.status is not None:
        story.status = story_in.status
    if story_in.release_tag is not None:
        story.release_tag = story_in.release_tag
    if story_in.task_id is not None:
        story.task_id = story_in.task_id
    if story_in.sprint_id is not None:
        story.sprint_id = story_in.sprint_id if story_in.sprint_id > 0 else None
    if story_in.order_index is not None:
        story.order_index = story_in.order_index

    db.commit()
    db.refresh(story)
    return _format_story_response(story)

@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_story(
    story_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user story."""
    story = (
        db.query(models.UserStory)
        .join(models.Project)
        .filter(models.UserStory.id == story_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not story:
        raise HTTPException(status_code=404, detail="Story not found.")

    db.delete(story)
    db.commit()
    return None

@router.post("/epics", response_model=schemas.EpicResponse, status_code=status.HTTP_201_CREATED)
def create_epic(
    epic_in: schemas.EpicCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Manually add an Epic to the project story map."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == epic_in.project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    epic = models.Epic(
        project_id=epic_in.project_id,
        title=epic_in.title,
        description=epic_in.description,
        order_index=epic_in.order_index
    )
    db.add(epic)
    db.commit()
    db.refresh(epic)
    return schemas.EpicResponse(
        id=epic.id,
        project_id=epic.project_id,
        title=epic.title,
        description=epic.description,
        order_index=epic.order_index,
        created_at=epic.created_at,
        activities=[]
    )

@router.post("/activities", response_model=schemas.UserActivityResponse, status_code=status.HTTP_201_CREATED)
def create_activity(
    act_in: schemas.UserActivityCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Manually add a User Activity."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == act_in.project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    act = models.UserActivity(
        project_id=act_in.project_id,
        epic_id=act_in.epic_id,
        title=act_in.title,
        order_index=act_in.order_index
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    return schemas.UserActivityResponse(
        id=act.id,
        project_id=act.project_id,
        epic_id=act.epic_id,
        title=act.title,
        order_index=act.order_index,
        tasks=[]
    )

@router.post("/tasks", response_model=schemas.UserTaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: schemas.UserTaskCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Manually add a User Task."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == task_in.project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    task = models.UserTask(
        project_id=task_in.project_id,
        activity_id=task_in.activity_id,
        title=task_in.title,
        order_index=task_in.order_index
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return schemas.UserTaskResponse(
        id=task.id,
        project_id=task.project_id,
        activity_id=task.activity_id,
        title=task.title,
        order_index=task.order_index,
        stories=[]
    )
