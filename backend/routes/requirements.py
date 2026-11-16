import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth
import ai_service

router = APIRouter(prefix="/api/requirements", tags=["Requirements"])

@router.get("/ai-status")
def get_ai_status():
    """Diagnostic endpoint to check if Ollama is running and models are ready."""
    return ai_service.check_ollama_status()

@router.post("/analyze", response_model=schemas.RequirementResponse)
def analyze_project_requirements(
    req_in: schemas.RequirementAnalyzeRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze raw project description using Ollama.
    Validates output with Pydantic and saves requirement record to database.
    """
    if req_in.project_id:
        project = (
            db.query(models.Project)
            .filter(models.Project.id == req_in.project_id, models.Project.user_id == current_user.id)
            .first()
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        project_name = project.name
    else:
        project_name = req_in.project_name or "New Project"

    # Call AI Service
    try:
        ai_output = ai_service.analyze_requirements(req_in.raw_input, project_name=project_name)
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

    # If project_id provided, store in database
    if req_in.project_id:
        # Check if project already has a requirement record
        req_record = (
            db.query(models.Requirement)
            .filter(models.Requirement.project_id == req_in.project_id)
            .first()
        )
        if not req_record:
            req_record = models.Requirement(
                project_id=req_in.project_id,
                raw_input=req_in.raw_input,
                problem_statement=ai_output.problem_statement,
                objectives=json.dumps(ai_output.objectives),
                target_users=json.dumps(ai_output.target_users),
                functional_requirements=json.dumps(ai_output.functional_requirements)
            )
            db.add(req_record)
        else:
            req_record.raw_input = req_in.raw_input
            req_record.problem_statement = ai_output.problem_statement
            req_record.objectives = json.dumps(ai_output.objectives)
            req_record.target_users = json.dumps(ai_output.target_users)
            req_record.functional_requirements = json.dumps(ai_output.functional_requirements)
        
        db.commit()
        db.refresh(req_record)
        
        return schemas.RequirementResponse(
            id=req_record.id,
            project_id=req_record.project_id,
            raw_input=req_record.raw_input,
            problem_statement=req_record.problem_statement,
            objectives=ai_output.objectives,
            target_users=ai_output.target_users,
            functional_requirements=ai_output.functional_requirements,
            created_at=req_record.created_at
        )
    else:
        # Transient analysis without saving to project yet
        return schemas.RequirementResponse(
            id=0,
            project_id=0,
            raw_input=req_in.raw_input,
            problem_statement=ai_output.problem_statement,
            objectives=ai_output.objectives,
            target_users=ai_output.target_users,
            functional_requirements=ai_output.functional_requirements,
            created_at=models.datetime.datetime.utcnow()
        )

@router.get("/project/{project_id}", response_model=Optional[schemas.RequirementResponse])
def get_project_requirements(
    project_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve saved requirement analysis for a given project."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    req = db.query(models.Requirement).filter(models.Requirement.project_id == project_id).first()
    if not req:
        return None

    return schemas.RequirementResponse(
        id=req.id,
        project_id=req.project_id,
        raw_input=req.raw_input,
        problem_statement=req.problem_statement,
        objectives=json.loads(req.objectives) if req.objectives else [],
        target_users=json.loads(req.target_users) if req.target_users else [],
        functional_requirements=json.loads(req.functional_requirements) if req.functional_requirements else [],
        created_at=req.created_at
    )
