import io
import base64
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def generate_test_image_base64(color="blue", text="Site Evidence Test") -> str:
    img = Image.new("RGB", (640, 480), color=color)
    draw = ImageDraw.Draw(img)
    draw.text((50, 50), text, fill="white")
    # Draw some construction shapes to simulate texture
    draw.rectangle([100, 150, 400, 350], outline="yellow", width=4)
    draw.polygon([(200, 100), (100, 250), (300, 250)], outline="orange", width=3)
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

def run_tests():
    print("=== STARTING SITEPROOF AI E2E INTEGRATION TESTS ===")
    
    # 1. Health Check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] 1. Health check passed:", res.json())

    # 2. Init Admin & Org
    admin_email = f"admin_{int(io.BytesIO().seek(0) or 1001)}@gorakhpur.gov.in"
    res = client.post("/api/admin/init", json={
        "orgName": "Gorakhpur Infrastructure Dept",
        "adminEmail": "admin@gorakhpur.gov.in",
        "adminPassword": "Password123!",
        "adminName": "Chief Project Admin"
    })
    if res.status_code == 400 and "already initialized" in res.text:
        print("[OK] 2. Organization already initialized")
    else:
        assert res.status_code == 200, f"Admin init failed: {res.text}"
        print("[OK] 2. Admin & Org Initialized:", res.json())

    # 3. Login as Admin
    res = client.post("/api/auth/login", json={
        "email": "admin@gorakhpur.gov.in",
        "password": "Password123!"
    })
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_token = res.json()["accessToken"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[OK] 3. Admin Login Successful. Token acquired.")

    # 4. Create Building Project
    res = client.post("/api/v1/projects", json={
        "name": "Gorakhpur AIIMS Hospital Block",
        "description": "Multi-storey building construction site",
        "projectType": "BUILDING",
        "status": "ACTIVE",
        "latitude": 26.7606,
        "longitude": 83.3732,
        "address": "AIIMS Campus, Gorakhpur",
        "geofenceRadiusMeters": 150,
        "minimumImages": 5,
        "maximumImages": 20
    }, headers=admin_headers)
    assert res.status_code == 201, f"Project creation failed: {res.text}"
    building_project_id = res.json()["projectId"]
    print(f"[OK] 4. Building Project Created: ID {building_project_id}")

    # 5. Create Road Project
    res = client.post("/api/v1/projects", json={
        "name": "NH-28 Bypass Road Expansion",
        "description": "6-lane bituminous highway construction",
        "projectType": "ROAD",
        "status": "ACTIVE",
        "latitude": 26.7500,
        "longitude": 83.3600,
        "address": "NH-28 Bypass, Gorakhpur",
        "geofenceRadiusMeters": 200,
        "minimumImages": 5,
        "maximumImages": 20
    }, headers=admin_headers)
    assert res.status_code == 201, f"Road Project creation failed: {res.text}"
    road_project_id = res.json()["projectId"]
    print(f"[OK] 5. Road Project Created: ID {road_project_id}")

    # 6. Create Field Engineer
    eng_email = "engineer.rajesh@gorakhpur.gov.in"
    res = client.post("/api/v1/engineers", json={
        "name": "Rajesh Kumar",
        "email": eng_email,
        "phone": "+91 9876543210",
        "employeeId": "ENG-786",
        "designation": "Assistant Site Engineer"
    }, headers=admin_headers)
    
    if res.status_code == 400 and "already exists" in res.text:
        # If exists, we can activate/login directly
        activation_token = None
        print(f"[OK] 6. Engineer {eng_email} already exists")
    else:
        assert res.status_code == 201, f"Engineer creation failed: {res.text}"
        activation_token = res.json()["activationToken"]
        print(f"[OK] 6. Engineer Created. Activation Token: {activation_token}")

    # 7. Activate Engineer Account if token present
    if activation_token:
        res = client.post("/api/auth/activate", json={
            "token": activation_token,
            "password": "EngineerPass123!"
        })
        assert res.status_code == 200, f"Activation failed: {res.text}"
        print("[OK] 7. Engineer Account Activated")

    # 8. Login as Engineer
    res = client.post("/api/auth/login", json={
        "email": eng_email,
        "password": "EngineerPass123!"
    })
    assert res.status_code == 200, f"Engineer login failed: {res.text}"
    eng_token = res.json()["accessToken"]
    eng_headers = {"Authorization": f"Bearer {eng_token}"}
    print("[OK] 8. Engineer Login Successful.")

    # 9. Assign Engineer to Building Project
    eng_id = res.json()["user"]["id"]
    res = client.post(f"/api/v1/projects/{building_project_id}/assign-engineer", json={
        "engineerId": eng_id
    }, headers=admin_headers)
    assert res.status_code == 200, f"Assign engineer failed: {res.text}"
    print("[OK] 9. Engineer assigned to Building Project.")

    # 10. Submit Valid Evidence (Inside Geofence)
    test_img = generate_test_image_base64(color="navy", text="Active Work Area - Foundation")
    res = client.post("/api/v1/evidence", json={
        "projectId": building_project_id,
        "evidenceCategory": "ACTIVE_WORK_AREA",
        "imageBase64": test_img,
        "latitude": 26.76065, # Inside 150m geofence
        "longitude": 83.37322,
        "gpsAccuracy": 12.0
    }, headers=eng_headers)
    assert res.status_code == 201, f"Evidence submission failed: {res.text}"
    evidence_data = res.json()["evidence"]
    print("[OK] 10. Evidence Submitted & Analyzed by AI:")
    print("    - Location Verified:", evidence_data["locationVerified"])
    print("    - Trust Score:", evidence_data["trustScore"], f"({evidence_data['trustStatus']})")
    print("    - Predicted Stage:", evidence_data["predictedStage"])
    print("    - Detected Objects:", evidence_data["detectedObjects"])
    print("    - Quality Score:", evidence_data["qualityScore"])
    assert evidence_data["locationVerified"] == True
    assert evidence_data["trustScore"] >= 80

    # 11. Submit Duplicate Evidence to Trigger Anomaly
    res = client.post("/api/v1/evidence", json={
        "projectId": building_project_id,
        "evidenceCategory": "ACTIVE_WORK_AREA",
        "imageBase64": test_img, # EXACT SAME IMAGE
        "latitude": 26.76065,
        "longitude": 83.37322,
        "gpsAccuracy": 12.0
    }, headers=eng_headers)
    assert res.status_code == 201, f"Duplicate evidence submission failed: {res.text}"
    dup_evidence = res.json()["evidence"]
    print("[OK] 11. Duplicate Evidence Submitted:")
    print("    - Trust Score:", dup_evidence["trustScore"], f"({dup_evidence['trustStatus']})")
    assert dup_evidence["trustStatus"] in ["NEEDS REVIEW", "SUSPICIOUS"]

    # 12. Check Suspicious Events Hub (Admin)
    res = client.get("/api/v1/suspicious", headers=admin_headers)
    assert res.status_code == 200, f"Get suspicious failed: {res.text}"
    events = res.json()["suspiciousEvents"]
    assert len(events) > 0, "No suspicious events recorded"
    first_event = events[0]
    print(f"[OK] 12. Suspicious Event Recorded: ID {first_event['id']} ({first_event['issueType']})")

    # 13. Admin Requests Recapture on Suspicious Item
    res = client.post(f"/api/v1/suspicious/{first_event['id']}/action", json={
        "action": "RECAPTURE_REQUESTED",
        "recaptureReason": "Duplicate image detected. Please recapture live photo of active foundation block."
    }, headers=admin_headers)
    assert res.status_code == 200, f"Resolve suspicious failed: {res.text}"
    print("[OK] 13. Admin Requested Recapture with reason.")

    # 14. Verify Engineer Dashboard reflects the Recapture Request
    res = client.get("/api/v1/engineer/dashboard", headers=eng_headers)
    assert res.status_code == 200, f"Engineer dashboard failed: {res.text}"
    recaptures = res.json()["recaptureRequests"]
    assert len(recaptures) > 0, "Recapture request not found on engineer dashboard"
    print("[OK] 14. Engineer Dashboard received Recapture Alert:", recaptures[0]["reason"])

    # 15. Verify Daily Site Reports
    res = client.get("/api/v1/reports/daily", headers=admin_headers)
    assert res.status_code == 200, f"Daily reports failed: {res.text}"
    reports = res.json()["reports"]
    assert len(reports) > 0, "No daily report generated"
    print(f"[OK] 15. Daily Report generated: Project '{reports[0]['projectName']}', Stage: '{reports[0]['aiPredictedStage']}', Trust: {reports[0]['trustScore']}/100")

    # 16. Verify Admin Dashboard Stats
    res = client.get("/api/v1/dashboard/stats", headers=admin_headers)
    assert res.status_code == 200, f"Dashboard stats failed: {res.text}"
    stats = res.json()
    print("[OK] 16. Admin Dashboard Consolidated Stats:", stats)

    print("\n=======================================================")
    print("ALL 16 END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
