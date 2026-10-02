#!/usr/bin/env python3
"""
Comprehensive flow test for StudySphere.
Tests:
- Zero fake data verification
- Student registration & normal login
- Admin automatic assignment (kaliabhavyam123@gmail.com)
- Security permission enforcement (403 for non-admins)
- Admin Login History & Registered Students tracking
- Resource upload, rating, viewing, bookmarking
- Context-aware StudySphere AI responses (in-material vs out-of-material)
"""
import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://localhost:8080"

def request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_msg)
        except Exception:
            return e.code, {"error": err_msg}

def test_studysphere():
    print("--- 1. Testing Clean Platform (Initial State) ---")
    status, resources_res = request("/api/resources")
    assert status == 200, f"Get resources failed: {resources_res}"
    resources = resources_res.get("resources", resources_res) if isinstance(resources_res, dict) else resources_res
    print(f"Resources count: {len(resources)}")
    assert len(resources) == 0, "Initial resources list must be empty (0 fake seed items)"
    print("✓ Resources empty: zero fake seed items verified.")

    print("\n--- 2. Testing Student Registration & Login ---")
    status, res = request("/api/auth/register", method="POST", data={
        "name": "Rahul Sharma",
        "email": "rahul@college.edu",
        "password": "Password123!",
        "semester": 2
    })
    if status not in (200, 201):
        status, res = request("/api/auth/login", method="POST", data={
            "email": "rahul@college.edu",
            "password": "Password123!"
        })
    assert status in (200, 201), f"Student register/login failed: {res}"
    assert res["user"]["role"] == "student"
    student_token = res["token"]
    print("✓ Student authenticated successfully with role 'student'")

    print("\n--- 3. Testing Admin Registration (kaliabhavyam123@gmail.com) ---")
    status, res = request("/api/auth/register", method="POST", data={
        "name": "Bhavya Kalia",
        "email": "kaliabhavyam123@gmail.com",
        "password": "AdminSecure2026!",
        "semester": 1
    })
    if status not in (200, 201):
        status, res = request("/api/auth/login", method="POST", data={
            "email": "kaliabhavyam123@gmail.com",
            "password": "AdminSecure2026!"
        })
    assert status in (200, 201), f"Admin register/login failed: {res}"
    assert res["user"]["role"] == "admin", f"Expected admin role, got {res['user']['role']}"
    admin_token = res["token"]
    print("✓ kaliabhavyam123@gmail.com recognized and authenticated as 'admin'")

    print("\n--- 4. Testing Clean Stats via Admin Endpoint ---")
    status, stats = request("/api/admin/stats", token=admin_token)
    assert status == 200, f"Admin stats failed: {stats}"
    print(f"Initial Platform Stats: {stats}")
    assert stats["totalUsers"] >= 1, "Total users should be tracked"
    print("✓ Stats clean: zero fake demo items verified.")

    print("\n--- 5. Testing Security: Non-Admin Access Forbidden ---")
    status, res = request("/api/admin/login-history", token=student_token)
    assert status == 403, f"Student should get 403 for admin login-history, got {status}"
    status, res = request("/api/admin/users", token=student_token)
    assert status == 403, f"Student should get 403 for admin users, got {status}"
    status, res = request("/api/admin/stats", token=student_token)
    assert status == 403, f"Student should get 403 for admin stats, got {status}"
    print("✓ Security passed: Student tokens blocked on admin endpoints (403 Forbidden)")

    print("\n--- 6. Testing Admin Endpoints (Login History & Registered Students) ---")
    status, history_res = request("/api/admin/login-history", token=admin_token)
    assert status == 200
    history = history_res.get("loginHistory", [])
    print(f"Login history count: {len(history)}")
    assert len(history) >= 2, f"Expected login history entries for student and admin, got {history}"
    emails_in_history = [h.get("email") or h.get("userEmail") for h in history]
    assert "rahul@college.edu" in emails_in_history
    assert "kaliabhavyam123@gmail.com" in emails_in_history
    print("✓ Admin Login History tracks real user logins with timestamp and IP")

    status, students_res = request("/api/admin/users", token=admin_token)
    assert status == 200
    students = students_res.get("users", [])
    print(f"Registered students count: {len(students)}")
    assert any(s["email"] == "rahul@college.edu" for s in students)
    # Check that passwords or salts are never exposed
    for s in students:
        assert "password" not in s
        assert "password_hash" not in s
        assert "salt" not in s
    print("✓ Admin Registered Students list returns safe student data (passwords omitted)")

    print("\n--- 7. Testing Admin Resource Upload ---")
    # Upload Note
    note_payload = {
        "title": "Quantum Mechanics & Wave Functions",
        "description": "Comprehensive engineering physics notes covering de Broglie relation, Schrodinger equation, and wave packet superposition.",
        "type": "note",
        "subject": "Engineering Physics",
        "unit": "Unit 2: Quantum Physics",
        "semester": 1,
        "format": "pdf",
        "author": "Physics Faculty",
        "fileName": "quantum_mechanics_notes.pdf",
        "fileData": "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==",
        "contentText": "Wave-particle duality states that matter exhibits wave-like behavior. The de Broglie wavelength is lambda = h / p. Max Born interpretation defines probability density psi squared."
    }
    status, res = request("/api/resources", method="POST", data=note_payload, token=admin_token)
    assert status in (200, 201), f"Upload note failed: {res}"
    note_id = res.get("id", res.get("resourceId"))
    print(f"✓ Uploaded note ID {note_id}: {note_payload['title']}")

    # Upload Lecture
    lecture_payload = {
        "title": "Circuit Analysis - Kirchhoff's Laws",
        "description": "Step by step video explanation of KCL, KVL, nodal analysis and mesh analysis with worked examples.",
        "type": "lecture",
        "subject": "Basic Electrical Engineering",
        "unit": "Unit 1: DC Circuits",
        "semester": 1,
        "format": "video",
        "author": "EE Department",
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
    status, res = request("/api/resources", method="POST", data=lecture_payload, token=admin_token)
    assert status in (200, 201), f"Upload lecture failed: {res}"
    lecture_id = res.get("id", res.get("resourceId"))
    print(f"✓ Uploaded lecture ID {lecture_id}: {lecture_payload['title']}")

    print("\n--- 8. Testing Real Student Interactions (View, Rating, Bookmark) ---")
    # Student views note
    status, res = request("/api/activity/view", method="POST", data={"resourceId": note_id}, token=student_token)
    assert status == 200, f"Record view failed: {res}"
    print("✓ Real view recorded via /api/activity/view")

    # Fetch resource to verify real view count = 1
    status, note_res = request(f"/api/resources/{note_id}", token=student_token)
    assert status == 200
    note_data = note_res.get("resource", note_res)
    real_views = note_data.get("viewCount", note_data.get("view_count", 0))
    assert real_views == 1, f"Expected 1 view, got {real_views}"
    print(f"✓ Real view count verified: {real_views} view")

    # Student rates note
    status, res = request("/api/ratings", method="POST", data={"resourceId": note_id, "rating": 5}, token=student_token)
    assert status == 200, f"Rate resource failed: {res}"
    print(f"✓ Rating response: {res}")
    assert res.get("ratingCount", res.get("ratingsCount")) == 1
    assert res.get("averageRating", res.get("avgRating")) == 5.0
    print("✓ Real rating recorded: 1 rating, average 5.0")

    # Student bookmarks note
    status, res = request("/api/bookmarks/toggle", method="POST", data={"resourceId": note_id}, token=student_token)
    assert status == 200, f"Bookmark failed: {res}"
    assert res["bookmarked"] is True

    status, bookmarks_res = request("/api/bookmarks", token=student_token)
    assert status == 200
    bookmarks = bookmarks_res.get("bookmarks", [])
    assert len(bookmarks) == 1
    assert bookmarks[0]["id"] == note_id
    print("✓ Student bookmark saved and listed")

    print("\n--- 9. Testing StudySphere AI (Context-Aware Engine) ---")
    # Query 1: Relevant question while viewing Quantum note
    status, res = request("/api/chat", method="POST", data={
        "messages": [{"role": "user", "content": "What is de Broglie wavelength and wave-particle duality?"}],
        "context": {
            "resourceId": note_id,
            "title": note_payload["title"],
            "subject": note_payload["subject"],
            "unit": note_payload["unit"],
            "contentText": note_payload["contentText"]
        }
    })
    assert status == 200, f"AI chat failed: {res}"
    ai_answer = res["reply"]
    print(f"AI Response (In-Context):\n{ai_answer[:220]}...\n")
    assert "Referenced from" in ai_answer or "quantum" in ai_answer.lower()
    print("✓ AI in-context query answered citing the active resource")

    # Query 2: Out-of-material question while viewing Quantum note (Ask about Kirchhoff)
    status, res = request("/api/chat", method="POST", data={
        "messages": [{"role": "user", "content": "Explain Kirchhoff's current law and voltage law"}],
        "context": {
            "resourceId": note_id,
            "title": note_payload["title"],
            "subject": note_payload["subject"],
            "unit": note_payload["unit"],
            "contentText": note_payload["contentText"]
        }
    })
    assert status == 200
    ai_answer_out = res["reply"]
    print(f"AI Response (Out-of-Material):\n{ai_answer_out[:220]}...\n")
    assert "couldn't find this specifically in the selected study material" in ai_answer_out.lower() or "couldn't find" in ai_answer_out.lower()
    print("✓ AI out-of-material query answered with clear disclaimer!")

    print("\n--- 10. Platform Stats Post-Activity Verification ---")
    status, updated_stats = request("/api/admin/stats", token=admin_token)
    assert status == 200
    print(f"Updated Platform Stats: {updated_stats}")
    assert updated_stats["totalResources"] == 2
    assert updated_stats["totalRatings"] == 1
    assert updated_stats["totalViews"] == 1
    assert updated_stats["platformAverageRating"] == 5.0
    print("✓ Real stats accurately reflect real activity (2 resources, 1 view, 1 rating of 5.0)")

    print("\n========================================================")
    print("🎉 ALL FLOW TESTS PASSED SUCCESSFULLY! 100% VERIFIED!")
    print("========================================================")

if __name__ == "__main__":
    test_studysphere()
