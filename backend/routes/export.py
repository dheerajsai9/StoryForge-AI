import io
import csv
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from database import get_db
import models
import auth

router = APIRouter(prefix="/api/export", tags=["Data Export"])

@router.get("/project/{project_id}/story-map/csv")
def export_story_map_csv(
    project_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Export project story map (Epics, Activities, Tasks, Stories) as CSV."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Story ID",
        "Epic",
        "User Activity",
        "User Task",
        "Story Title",
        "User Role",
        "Action (I want)",
        "Benefit (So that)",
        "Story Points",
        "Priority",
        "Status",
        "Release Tag",
        "Sprint",
        "Acceptance Criteria"
    ])

    stories = db.query(models.UserStory).filter(models.UserStory.project_id == project_id).all()
    for s in stories:
        task_title = s.task.title if s.task else "Unassigned"
        activity_title = s.task.activity.title if (s.task and s.task.activity) else "Unassigned"
        epic_title = s.task.activity.epic.title if (s.task and s.task.activity and s.task.activity.epic) else "Unassigned"
        sprint_name = s.sprint.name if s.sprint else "Backlog"

        ac_text = ""
        if s.acceptance_criteria:
            try:
                ac_list = json.loads(s.acceptance_criteria)
                ac_text = " | ".join(ac_list) if isinstance(ac_list, list) else s.acceptance_criteria
            except Exception:
                ac_text = s.acceptance_criteria

        writer.writerow([
            s.id,
            epic_title,
            activity_title,
            task_title,
            s.title,
            s.role,
            s.action,
            s.benefit,
            s.story_points,
            s.priority,
            s.status,
            s.release_tag,
            sprint_name,
            ac_text
        ])

    csv_data = output.getvalue()
    filename = f"{project.name.replace(' ', '_').lower()}_story_map_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/project/{project_id}/sprints/csv")
def export_sprint_plan_csv(
    project_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Export project sprint plans with assigned stories and capacities as CSV."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Sprint ID",
        "Sprint Name",
        "Sprint Goal",
        "Capacity Points",
        "Status",
        "Story ID",
        "Story Title",
        "Role",
        "Story Points",
        "Priority",
        "Status"
    ])

    sprints = db.query(models.Sprint).filter(models.Sprint.project_id == project_id).all()
    for sp in sprints:
        assigned_stories = db.query(models.UserStory).filter(models.UserStory.sprint_id == sp.id).all()
        if not assigned_stories:
            writer.writerow([sp.id, sp.name, sp.goal, sp.capacity_points, sp.status, "", "No stories assigned", "", "", "", ""])
        else:
            for s in assigned_stories:
                writer.writerow([
                    sp.id,
                    sp.name,
                    sp.goal,
                    sp.capacity_points,
                    sp.status,
                    s.id,
                    s.title,
                    s.role,
                    s.story_points,
                    s.priority,
                    s.status
                ])

    csv_data = output.getvalue()
    filename = f"{project.name.replace(' ', '_').lower()}_sprints_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/project/{project_id}/json")
def export_project_json(
    project_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Export comprehensive project data as structured JSON."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # Requirements
    req = db.query(models.Requirement).filter(models.Requirement.project_id == project_id).first()
    req_data = None
    if req:
        req_data = {
            "problem_statement": req.problem_statement,
            "objectives": json.loads(req.objectives) if req.objectives else [],
            "target_users": json.loads(req.target_users) if req.target_users else [],
            "functional_requirements": json.loads(req.functional_requirements) if req.functional_requirements else []
        }

    # Sprints
    sprints = db.query(models.Sprint).filter(models.Sprint.project_id == project_id).all()
    sprints_data = [
        {
            "id": sp.id,
            "name": sp.name,
            "goal": sp.goal,
            "capacity_points": sp.capacity_points,
            "status": sp.status,
            "start_date": sp.start_date,
            "end_date": sp.end_date
        }
        for sp in sprints
    ]

    # Stories
    stories = db.query(models.UserStory).filter(models.UserStory.project_id == project_id).all()
    stories_data = [
        {
            "id": s.id,
            "task_id": s.task_id,
            "sprint_id": s.sprint_id,
            "title": s.title,
            "role": s.role,
            "action": s.action,
            "benefit": s.benefit,
            "acceptance_criteria": json.loads(s.acceptance_criteria) if s.acceptance_criteria else [],
            "story_points": s.story_points,
            "priority": s.priority,
            "status": s.status,
            "release_tag": s.release_tag
        }
        for s in stories
    ]

    # Epics, activities, tasks hierarchy
    epics = db.query(models.Epic).filter(models.Epic.project_id == project_id).all()
    epics_data = []
    for e in epics:
        act_data = []
        for a in e.activities:
            task_data = []
            for t in a.tasks:
                task_data.append({
                    "id": t.id,
                    "title": t.title,
                    "order_index": t.order_index
                })
            act_data.append({
                "id": a.id,
                "title": a.title,
                "order_index": a.order_index,
                "tasks": task_data
            })
        epics_data.append({
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "activities": act_data
        })

    payload = {
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "target_audience": project.target_audience,
            "created_at": str(project.created_at)
        },
        "requirements": req_data,
        "epics": epics_data,
        "sprints": sprints_data,
        "stories": stories_data,
        "exported_at": str(datetime.utcnow())
    }

    json_str = json.dumps(payload, indent=2)
    filename = f"{project.name.replace(' ', '_').lower()}_backup_{datetime.utcnow().strftime('%Y%m%d')}.json"
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
