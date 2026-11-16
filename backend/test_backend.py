import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from database import engine, Base

client = TestClient(app)

def run_tests():
    print("========================================")
    print("STORYFORGE AI — SENIOR TEST SUITE")
    print("========================================")

    # 1. Health check
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("✅ 1. Health check OK")

    # 2. Registration
    test_email = "tester@storyforge.ai"
    reg_payload = {
        "email": test_email,
        "password": "Password123!",
        "full_name": "Senior QA Tester"
    }
    # Clean up user if already exists from earlier test
    from database import SessionLocal
    import models
    db = SessionLocal()
    existing = db.query(models.User).filter(models.User.email == test_email).first()
    if existing:
        db.delete(existing)
        db.commit()
    db.close()

    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201, f"Register failed: {res.text}"
    token_data = res.json()
    access_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    print("✅ 2. User registration OK")

    # 3. Login
    login_payload = {
        "email": test_email,
        "password": "Password123!"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    print("✅ 3. User login OK")

    # 4. Get Current User profile
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200, f"Get current user failed: {res.text}"
    assert res.json()["email"] == test_email
    print("✅ 4. Profile retrieval OK")

    # 5. Create Project
    proj_payload = {
        "name": "E-Commerce Microservices",
        "description": "An end-to-end multi-vendor e-commerce platform.",
        "target_audience": "Online Merchants and Retail Shoppers"
    }
    res = client.post("/api/projects", json=proj_payload, headers=headers)
    assert res.status_code == 201, f"Create project failed: {res.text}"
    project = res.json()
    proj_id = project["id"]
    print(f"✅ 5. Project creation OK (ID: {proj_id})")

    # 6. Check AI status
    res = client.get("/api/requirements/ai-status")
    assert res.status_code == 200, f"AI status check failed: {res.text}"
    ai_status = res.json()
    print(f"✅ 6. AI Status endpoint OK (Ollama Available: {ai_status.get('available')})")

    # 7. Create Story Hierarchy (Epic -> Activity -> Task -> Story)
    epic_res = client.post("/api/stories/epics", json={
        "project_id": proj_id,
        "title": "Checkout & Payments"
    }, headers=headers)
    assert epic_res.status_code == 201
    epic_id = epic_res.json()["id"]

    act_res = client.post("/api/stories/activities", json={
        "project_id": proj_id,
        "epic_id": epic_id,
        "title": "Payment Processing"
    }, headers=headers)
    assert act_res.status_code == 201
    act_id = act_res.json()["id"]

    task_res = client.post("/api/stories/tasks", json={
        "project_id": proj_id,
        "activity_id": act_id,
        "title": "Stripe Card Flow"
    }, headers=headers)
    assert task_res.status_code == 201
    task_id = task_res.json()["id"]

    story_res = client.post("/api/stories", json={
        "project_id": proj_id,
        "task_id": task_id,
        "title": "Pay with Credit Card",
        "role": "Customer",
        "action": "enter valid Visa card details",
        "benefit": "my order is paid instantly",
        "story_points": 5,
        "priority": "HIGH",
        "status": "IN_PROGRESS",
        "acceptance_criteria": ["Given card details are valid, order succeeds."]
    }, headers=headers)
    assert story_res.status_code == 201
    story_id = story_res.json()["id"]
    print(f"✅ 7. Story hierarchy and user story created OK (Story ID: {story_id})")

    # 8. Retrieve Story Map
    res = client.get(f"/api/stories/project/{proj_id}/map", headers=headers)
    assert res.status_code == 200
    map_data = res.json()
    assert len(map_data["epics"]) == 1
    assert map_data["epics"][0]["title"] == "Checkout & Payments"
    print("✅ 8. Story map retrieval OK")

    # 9. Create Sprint and Assign Story
    sprint_res = client.post("/api/sprints", json={
        "project_id": proj_id,
        "name": "Sprint 1: Core Payments",
        "goal": "Deliver Stripe checkout integration",
        "capacity_points": 20
    }, headers=headers)
    assert sprint_res.status_code == 201
    sprint_id = sprint_res.json()["id"]

    assign_res = client.post(f"/api/sprints/assign-story?story_id={story_id}&sprint_id={sprint_id}", headers=headers)
    assert assign_res.status_code == 200
    print(f"✅ 9. Sprint creation and story assignment OK (Sprint ID: {sprint_id})")

    # 10. Check Project Stats
    res = client.get(f"/api/projects/{proj_id}/stats", headers=headers)
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_stories"] == 1
    assert stats["total_story_points"] == 5
    assert stats["total_sprints"] == 1
    print("✅ 10. Project statistics calculation OK")

    # 11. Test Export Endpoints
    # CSV Story Map
    csv_map = client.get(f"/api/export/project/{proj_id}/story-map/csv", headers=headers)
    assert csv_map.status_code == 200
    assert "Checkout & Payments" in csv_map.text
    print("✅ 11. CSV Story Map Export OK")

    # CSV Sprints
    csv_sprints = client.get(f"/api/export/project/{proj_id}/sprints/csv", headers=headers)
    assert csv_sprints.status_code == 200
    assert "Sprint 1: Core Payments" in csv_sprints.text
    print("✅ 12. CSV Sprints Export OK")

    # JSON Backup
    json_export = client.get(f"/api/export/project/{proj_id}/json", headers=headers)
    assert json_export.status_code == 200
    assert json_export.json()["project"]["name"] == "E-Commerce Microservices"
    print("✅ 13. JSON Project Backup Export OK")

    print("========================================")
    print("ALL 13 BACKEND TEST CASES PASSED PERFECTLY!")
    print("========================================")

if __name__ == "__main__":
    run_tests()
