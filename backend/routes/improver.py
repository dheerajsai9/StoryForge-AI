import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth
import ai_service

router = APIRouter(prefix="/api/improver", tags=["AI Story Improver"])

@router.post("/analyze", response_model=schemas.StoryImprovementResponse)
def analyze_and_improve_story(
    req: schemas.StoryImprovementRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run AI Story Improver:
    - Calculates clarity score (1-100)
    - Checks INVEST criteria
    - Refines Title, Role, Action, and Benefit
    - Generates enhanced Gherkin Acceptance Criteria
    - Identifies missing requirements and edge cases
    """
    try:
        result = ai_service.improve_user_story(
            title=req.title,
            role=req.role,
            action=req.action,
            benefit=req.benefit,
            acceptance_criteria=req.acceptance_criteria
        )
        return result
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

@router.post("/apply/{story_id}", response_model=schemas.UserStoryResponse)
def apply_improvements_to_story(
    story_id: int,
    improved: schemas.StoryImprovementResponse,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Apply the AI-generated improvements directly to the existing story record."""
    story = (
        db.query(models.UserStory)
        .join(models.Project)
        .filter(models.UserStory.id == story_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not story:
        raise HTTPException(status_code=404, detail="Story not found.")

    story.title = improved.improved_title
    story.role = improved.improved_role
    story.action = improved.improved_action
    story.benefit = improved.improved_benefit
    story.acceptance_criteria = json.dumps(improved.improved_acceptance_criteria)

    db.commit()
    db.refresh(story)

    return schemas.UserStoryResponse(
        id=story.id,
        project_id=story.project_id,
        task_id=story.task_id,
        sprint_id=story.sprint_id,
        title=story.title,
        role=story.role,
        action=story.action,
        benefit=story.benefit,
        acceptance_criteria=improved.improved_acceptance_criteria,
        story_points=story.story_points,
        priority=story.priority,
        status=story.status,
        release_tag=story.release_tag,
        order_index=story.order_index,
        created_at=story.created_at
    )
