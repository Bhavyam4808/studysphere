#!/usr/bin/env python3
"""
StudySphere - Backend Server & REST API
========================================
Built for College Hackathon.
Clean architecture with:
  - SQLite database management (real tables, ZERO fake seed data)
  - Secure PBKDF2 password hashing & signed token authorization
  - Real Login History logging for every authentication event
  - Admin Role enforcement for kaliabhavyam123@gmail.com
  - Real 1-5 star ratings (1 per user per resource, dynamic recalculation)
  - Real view counting (increments only on actual user access)
  - PDF text extraction & searchable content storage
  - Context-Aware StudySphere AI (prioritizes uploaded material, supports follow-ups)
"""

import os
import sys
import json
import time
import uuid
import hmac
import hashlib
import sqlite3
import re
import urllib.request
import urllib.error
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# -----------------------------------------------------------------------------
# ENVIRONMENT VARIABLES LOADER (.env)
# -----------------------------------------------------------------------------
def load_dotenv():
    """Load key-value pairs from .env file into os.environ if not already set."""
    env_file = os.path.join(BASE_DIR, ".env")
    if os.path.exists(env_file):
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k and k not in os.environ:
                            os.environ[k] = v
        except Exception as e:
            print(f"[Dotenv Notice: Could not read .env file: {e}]")

load_dotenv()

# Configuration
PORT = int(os.environ.get("PORT", 8080))
DB_PATH = os.path.join(BASE_DIR, "studysphere.db")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
SECRET_KEY = os.environ.get("SESSION_SECRET", "studysphere-hackathon-secure-salt-2026")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
ADMIN_EMAIL = "kaliabhavyam123@gmail.com"

os.makedirs(UPLOAD_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# PASSWORD & TOKEN SECURITY HELPERS
# -----------------------------------------------------------------------------
def hash_password(password, salt=None):
    """Secure password hashing using PBKDF2 HMAC-SHA256 with random 16-byte salt."""
    if salt is None:
        salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return hashed, salt

def verify_password(password, stored_hash, salt):
    """Verify user password against stored PBKDF2 hash using constant-time comparison."""
    hashed, _ = hash_password(password, salt)
    return hmac.compare_digest(hashed, stored_hash)

def generate_token(user_id, role):
    """Generate a tamper-proof session token."""
    timestamp = str(int(time.time()))
    payload = f"{user_id}:{role}:{timestamp}"
    signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{signature}"

def verify_token(token):
    """Verify session token integrity and return user details."""
    if not token:
        return None
    try:
        parts = token.split(":")
        if len(parts) != 4:
            return None
        user_id, role, timestamp, signature = parts
        payload = f"{user_id}:{role}:{timestamp}"
        expected_sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        # Token valid for 7 days
        if int(time.time()) - int(timestamp) > 7 * 86400:
            return None
        return {"id": user_id, "role": role}
    except Exception:
        return None

# -----------------------------------------------------------------------------
# PDF TEXT EXTRACTION (FOR CONTEXT-AWARE AI)
# -----------------------------------------------------------------------------
def extract_text_from_pdf_bytes(pdf_bytes):
    """
    Extracts readable ASCII/UTF text from PDF streams without external dependencies.
    Used to index uploaded notes for the StudySphere AI contextual tutor.
    """
    text_pieces = []
    # Find all stream blocks
    streams = re.findall(rb'stream[\r\n]+(.*?)[\r\n]+endstream', pdf_bytes, re.DOTALL)
    for stream in streams:
        # Search for (text) Tj strings
        matches = re.findall(rb'\((.*?)\)\s*Tj', stream)
        for m in matches:
            try:
                decoded = m.decode('latin-1', errors='ignore').replace('\\(', '(').replace('\\)', ')')
                if decoded.strip():
                    text_pieces.append(decoded.strip())
            except Exception:
                pass
        # Search for [(text)] TJ arrays
        tj_matches = re.findall(rb'\[(.*?)\]\s*TJ', stream)
        for tj in tj_matches:
            inner_strs = re.findall(rb'\((.*?)\)', tj)
            for s in inner_strs:
                try:
                    decoded = s.decode('latin-1', errors='ignore').strip()
                    if decoded:
                        text_pieces.append(decoded)
                except Exception:
                    pass

    # Fallback to general text extraction if no Tj streams matched
    if not text_pieces:
        raw_text = re.findall(r'\((.*?)\)\s*Tj', pdf_bytes.decode('latin-1', errors='ignore'))
        text_pieces = [t.replace('\\(', '(').replace('\\)', '').strip() for t in raw_text if t.strip()]

    return ' '.join(text_pieces)

# -----------------------------------------------------------------------------
# DATABASE SETUP (NO FAKE SEED DATA)
# -----------------------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes tables. Does NOT insert any fake ratings, views, or users."""
    conn = get_db()
    c = conn.cursor()

    # 1. Users table
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        created_at TEXT NOT NULL
    )
    """)

    # 2. Login History table (Real login events only)
    c.execute("""
    CREATE TABLE IF NOT EXISTS login_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        email TEXT NOT NULL,
        login_date TEXT NOT NULL,
        login_time TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    # 3. Resources table (All new materials start with 0 views, 0 ratings)
    c.execute("""
    CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        subject TEXT NOT NULL,
        unit TEXT NOT NULL,
        type TEXT NOT NULL, -- 'pdf' or 'lecture'
        file_url TEXT,
        video_url TEXT,
        tags TEXT,
        content_text TEXT, -- Extracted text for context-aware AI
        uploaded_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        average_rating REAL DEFAULT 0.0,
        rating_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0
    )
    """)

    # 4. Ratings table (One rating per user per resource)
    c.execute("""
    CREATE TABLE IF NOT EXISTS ratings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, resource_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(resource_id) REFERENCES resources(id)
    )
    """)

    # 5. Bookmarks table
    c.execute("""
    CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(user_id, resource_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(resource_id) REFERENCES resources(id)
    )
    """)

    # 6. Activity / Progress table
    c.execute("""
    CREATE TABLE IF NOT EXISTS activity (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        viewed_at TEXT NOT NULL,
        UNIQUE(user_id, resource_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(resource_id) REFERENCES resources(id)
    )
    """)

    conn.commit()
    conn.close()
    print("[DB] Initialized clean SQLite database with zero fake demo data.")

def record_login_event(user_id, user_name, email):
    """Records a real login event in the login_history table."""
    conn = get_db()
    c = conn.cursor()
    now = datetime.now()
    login_date = now.strftime("%d %B %Y").lstrip("0")
    login_time = now.strftime("%I:%M %p")
    event_id = f"log-{uuid.uuid4().hex[:10]}"
    c.execute("""
    INSERT INTO login_history (id, user_id, user_name, email, login_date, login_time, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (event_id, user_id, user_name, email, login_date, login_time, int(time.time())))
    conn.commit()
    conn.close()

# -----------------------------------------------------------------------------
# RANKING ALGORITHM (BASED ON REAL DATA ONLY)
# -----------------------------------------------------------------------------
def calculate_ranking_score(avg_rating, rating_count, view_count):
    """
    Bayesian Weighted Rating Algorithm:
    - If resource has 0 ratings, score is determined by real student views.
    - If resource has ratings:
        WR = (v / (v + m)) * R + (m / (v + m)) * C + view_boost
    Where:
        v = real number of ratings
        m = minimum threshold baseline (2.0)
        R = real average rating
        C = platform baseline average (3.5)
    """
    import math
    if rating_count == 0:
        return round(0.01 * math.log10(max(view_count, 0) + 1), 4)

    m = 2.0
    c = 3.5
    v = float(rating_count)
    r = float(avg_rating)
    view_boost = 0.05 * math.log10(max(view_count, 0) + 1)
    score = (v / (v + m)) * r + (m / (v + m)) * c + view_boost
    return round(score, 4)

# -----------------------------------------------------------------------------
# STUDYSPHERE AI (LIVE MODEL INTEGRATION & RESOURCE CONTEXT)
# -----------------------------------------------------------------------------
def build_academic_system_prompt(context_info=None):
    """
    Constructs an academic system prompt for StudySphere AI:
    - Acts as a friendly, expert study tutor for first-year engineering students.
    - Explains concepts in clear, simple language without unnecessary jargon.
    - Solves numerical / math problems step-by-step showing every equation and step.
    - Generates MCQs with options, correct answers, and explanations when asked.
    - Explains formulas, derivations, and compares concepts when requested.
    - Dynamically adapts response style and length to user intent.
    - Seamlessly incorporates uploaded PDF / resource context when active.
    """
    prompt = (
        "You are StudySphere AI, a knowledgeable, encouraging, and clear study assistant for first-year undergraduate engineering students.\n"
        "Your mission is to help students learn and master their syllabus coursework.\n\n"
        "Guidelines:\n"
        "1. Explain concepts in intuitive, simple language with relevant engineering analogies.\n"
        "2. For mathematical equations and numerical problems, always provide complete step-by-step solutions showing each algebraic step and calculation.\n"
        "3. When requested to generate MCQs (multiple-choice questions), provide numbered questions with 4 distinct options (A, B, C, D), identify the correct answer, and give a brief explanation for each.\n"
        "4. Thoroughly explain formulas, define variables, state SI units, and outline physical derivations when asked.\n"
        "5. Compare and contrast concepts directly when asked (e.g. differences, pros/cons, similarities).\n"
        "6. Adjust answer depth and length to match the student's request (e.g., concise summaries vs. in-depth exam prep).\n"
        "7. Do NOT force every answer into a fixed or repetitive template. Adapt the formatting naturally according to the question.\n"
    )

    if context_info and context_info.get("title"):
        title = context_info.get("title", "")
        subject = context_info.get("subject", "")
        unit = context_info.get("unit", "")
        content_text = context_info.get("contentText", "")

        prompt += (
            f"\n--- ACTIVE STUDY RESOURCE CONTEXT ---\n"
            f"The student is currently viewing this uploaded study material on StudySphere:\n"
            f"Title: {title}\n"
        )
        if subject:
            prompt += f"Subject: {subject}\n"
        if unit:
            prompt += f"Unit/Module: {unit}\n"
        if content_text:
            prompt += f"Document Content Excerpt:\n\"\"\"\n{content_text[:3000]}\n\"\"\"\n"

        prompt += (
            "\nResource-grounding rules:\n"
            "- Ground your answer in this uploaded study material when relevant.\n"
            "- If the student's question relates to the document, cite key details from it.\n"
            "- If the student asks about a concept not covered in this document, answer accurately and helpfully, while politely mentioning that it is outside the scope of this active document.\n"
        )

    return prompt

def call_openai_chat(messages, system_prompt, api_key):
    """Invokes OpenAI API chat completions."""
    url = "https://api.openai.com/v1/chat/completions"
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "system", "content": system_prompt}] + messages,
        "temperature": 0.7,
        "max_tokens": 1200
    }
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        return body["choices"][0]["message"]["content"]

def call_gemini_chat(messages, system_prompt, api_key):
    """Invokes Google Gemini API generateContent."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    contents = [
        {"role": "user", "parts": [{"text": f"SYSTEM INSTRUCTIONS:\n{system_prompt}\n\nPlease follow these instructions."}]},
        {"role": "model", "parts": [{"text": "Understood. I will act as StudySphere AI following all instructions."}]}
    ]
    for m in messages:
        role = "user" if m.get("role") == "user" else "model"
        contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

    payload = {"contents": contents}
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        candidates = body.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts:
                return parts[0].get("text", "")
    return ""

_AI_CACHE = {}

def call_live_ai_model(messages, system_prompt):
    """Invokes zero-config live AI model service with retry and caching."""
    # Check cache first
    cache_key = json.dumps([{"role": m.get("role"), "content": m.get("content")} for m in messages], sort_keys=True)
    if cache_key in _AI_CACHE:
        return _AI_CACHE[cache_key]

    url = "https://text.pollinations.ai/"
    payload = {
        "messages": [{"role": "system", "content": system_prompt}] + messages
    }
    req_data = json.dumps(payload).encode("utf-8")

    last_err = None
    for attempt in range(2):
        try:
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
                }
            )
            with urllib.request.urlopen(req, timeout=50) as resp:
                raw = resp.read().decode("utf-8")
                result_text = raw
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, dict) and "choices" in parsed:
                        result_text = parsed["choices"][0]["message"]["content"]
                except Exception:
                    pass
                if result_text and result_text.strip():
                    _AI_CACHE[cache_key] = result_text.strip()
                    return result_text.strip()
        except urllib.error.HTTPError as he:
            last_err = he
            if he.code in (402, 429) and attempt == 0:
                time.sleep(3.5)
                continue
            raise
        except Exception as e:
            last_err = e
            if attempt == 0:
                time.sleep(2.0)
                continue
            raise

    if last_err:
        raise last_err
    return ""

def ask_study_ai(messages, context_info=None):
    """
    Connects to live AI provider to generate dynamic, question-specific answers.
    1. Checks for Easter egg triggers before any external provider calls.
    2. Checks OPENAI_API_KEY from .env / environment.
    3. Checks GEMINI_API_KEY from .env / environment.
    4. Falls back to live AI model service.
    5. If all fail, returns: 'StudySphere AI is temporarily unavailable. Please try again.'
    Never returns mock/hardcoded templates.
    """
    # Easter Egg: "supreme leader" detector (server-side, returns immediately without calling AI API)
    last_user_query = ""
    for m in reversed(messages):
        if isinstance(m, dict) and m.get("role") == "user":
            last_user_query = m.get("content", "")
            break
        elif isinstance(m, str):
            last_user_query = m
            break
    if not last_user_query and messages and isinstance(messages[-1], dict):
        last_user_query = messages[-1].get("content", "")

    if last_user_query:
        norm_query = str(last_user_query).strip().lower()
        if re.search(r'\bsupreme[\s\-_]+leader\b', norm_query):
            return "Mr.Bhavyam is the one and only supreme leader."

    load_dotenv()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()

    system_prompt = build_academic_system_prompt(context_info)

    # 1. Try OpenAI if configured
    if openai_key and len(openai_key) > 10:
        try:
            ans = call_openai_chat(messages, system_prompt, openai_key)
            if ans and ans.strip():
                return ans.strip()
        except Exception as e:
            print(f"[OpenAI API Notice: {e}]")

    # 2. Try Gemini if configured
    if gemini_key and len(gemini_key) > 10:
        try:
            ans = call_gemini_chat(messages, system_prompt, gemini_key)
            if ans and ans.strip():
                return ans.strip()
        except Exception as e:
            print(f"[Gemini API Notice: {e}]")

    # 3. Live AI model service
    try:
        ans = call_live_ai_model(messages, system_prompt)
        if ans and ans.strip():
            return ans.strip()
    except Exception as e:
        print(f"[Live AI Service Notice: {e}]")

    # 4. Strict requirement: If all AI attempts fail, do not return mock template.
    return "StudySphere AI is temporarily unavailable. Please try again."

# -----------------------------------------------------------------------------
# HTTP REQUEST HANDLER
# -----------------------------------------------------------------------------
class StudySphereHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def send_error_json(self, status_code, message):
        self.send_json(status_code, {"error": message})

    def get_auth_user(self):
        """Extracts and verifies Bearer token from Authorization header."""
        auth_header = self.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        token = auth_header[7:].strip()
        return verify_token(token)

    def read_json_body(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                return {}
            body = self.rfile.read(content_length).decode('utf-8')
            return json.loads(body)
        except Exception:
            return {}

    # -------------------------------------------------------------------------
    # GET ROUTES
    # -------------------------------------------------------------------------
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        # Health Check
        if path == "/api/health":
            self.send_json(200, {"status": "ok", "app": "StudySphere", "version": "1.0.0"})
            return

        # 1. Current Authenticated User Profile
        if path == "/api/auth/me":
            user = self.get_auth_user()
            if not user:
                self.send_error_json(401, "Not authenticated")
                return
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id, name, email, role, created_at FROM users WHERE id = ?", (user["id"],))
            row = c.fetchone()
            conn.close()
            if not row:
                self.send_error_json(404, "User not found")
                return
            self.send_json(200, {
                "user": {
                    "id": row["id"],
                    "name": row["name"],
                    "email": row["email"],
                    "role": row["role"],
                    "createdAt": row["created_at"]
                }
            })
            return

        # 2. Browse Resources (Real Database Data)
        if path == "/api/resources":
            conn = get_db()
            c = conn.cursor()

            search = query.get("search", [""])[0].strip().lower()
            subject = query.get("subject", [""])[0].strip()
            res_type = query.get("type", [""])[0].strip()
            sort_by = query.get("sort", ["popular"])[0].strip()
            min_rating = float(query.get("minRating", [0])[0] or 0)

            sql = "SELECT * FROM resources WHERE 1=1"
            params = []

            if subject and subject != "All":
                sql += " AND subject = ?"
                params.append(subject)

            if res_type and res_type != "All":
                sql += " AND type = ?"
                params.append(res_type)

            if min_rating > 0:
                sql += " AND average_rating >= ?"
                params.append(min_rating)

            if search:
                sql += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(subject) LIKE ? OR LOWER(unit) LIKE ? OR LOWER(tags) LIKE ?)"
                term = f"%{search}%"
                params.extend([term, term, term, term, term])

            c.execute(sql, params)
            rows = [dict(r) for r in c.fetchall()]
            conn.close()

            # Annotate ranking score based on real data
            for r in rows:
                r["rankingScore"] = calculate_ranking_score(
                    r["average_rating"],
                    r["rating_count"],
                    r["view_count"]
                )

            # Sort
            if sort_by == "highest_rated":
                rows.sort(key=lambda x: (x["average_rating"], x["rating_count"]), reverse=True)
            elif sort_by == "views":
                rows.sort(key=lambda x: x["view_count"], reverse=True)
            elif sort_by == "newest":
                rows.sort(key=lambda x: x["created_at"], reverse=True)
            else:  # 'popular' weighted ranking
                rows.sort(key=lambda x: x["rankingScore"], reverse=True)

            self.send_json(200, {"resources": rows, "count": len(rows)})
            return

        # 3. Single Resource Detail
        if path.startswith("/api/resources/") and len(path.split("/")) == 4:
            res_id = path.split("/")[3]
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT * FROM resources WHERE id = ?", (res_id,))
            res = c.fetchone()
            if not res:
                conn.close()
                self.send_error_json(404, "Resource not found")
                return

            res_data = dict(res)
            auth_user = self.get_auth_user()
            user_rating = 0
            is_bookmarked = False
            is_completed = False

            if auth_user:
                c.execute("SELECT rating FROM ratings WHERE user_id = ? AND resource_id = ?", (auth_user["id"], res_id))
                rat_row = c.fetchone()
                if rat_row:
                    user_rating = rat_row["rating"]

                c.execute("SELECT id FROM bookmarks WHERE user_id = ? AND resource_id = ?", (auth_user["id"], res_id))
                is_bookmarked = bool(c.fetchone())

                c.execute("SELECT completed FROM activity WHERE user_id = ? AND resource_id = ?", (auth_user["id"], res_id))
                act_row = c.fetchone()
                if act_row:
                    is_completed = bool(act_row["completed"])

            # Related resources from the same subject
            c.execute("""
            SELECT id, title, type, subject, unit, average_rating, rating_count
            FROM resources
            WHERE subject = ? AND id != ?
            LIMIT 4
            """, (res_data["subject"], res_id))
            related = [dict(r) for r in c.fetchall()]
            conn.close()

            res_data["viewCount"] = res_data["view_count"]
            res_data["averageRating"] = res_data["average_rating"]
            res_data["ratingCount"] = res_data["rating_count"]
            res_data["userRating"] = user_rating
            res_data["isBookmarked"] = is_bookmarked
            res_data["isCompleted"] = is_completed
            res_data["related"] = related

            self.send_json(200, {"resource": res_data})
            return

        # 4. User Bookmarks
        if path == "/api/bookmarks":
            user = self.get_auth_user()
            if not user:
                self.send_error_json(401, "Not authenticated")
                return
            conn = get_db()
            c = conn.cursor()
            c.execute("""
            SELECT r.*, b.created_at as bookmarked_at
            FROM bookmarks b
            JOIN resources r ON b.resource_id = r.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
            """, (user["id"],))
            rows = [dict(r) for r in c.fetchall()]
            conn.close()
            self.send_json(200, {"bookmarks": rows})
            return

        # 5. Student Dashboard Data
        if path == "/api/dashboard":
            user = self.get_auth_user()
            if not user:
                self.send_error_json(401, "Not authenticated")
                return
            conn = get_db()
            c = conn.cursor()

            # Recently viewed
            c.execute("""
            SELECT r.*, a.completed, a.viewed_at
            FROM activity a
            JOIN resources r ON a.resource_id = r.id
            WHERE a.user_id = ?
            ORDER BY a.viewed_at DESC
            LIMIT 6
            """, (user["id"],))
            recent_views = [dict(r) for r in c.fetchall()]

            # Real Counts
            c.execute("SELECT COUNT(*) as cnt FROM activity WHERE user_id = ? AND completed = 1", (user["id"],))
            completed_count = c.fetchone()["cnt"]

            c.execute("SELECT COUNT(*) as cnt FROM activity WHERE user_id = ?", (user["id"],))
            viewed_count = c.fetchone()["cnt"]

            c.execute("SELECT COUNT(*) as cnt FROM bookmarks WHERE user_id = ?", (user["id"],))
            bookmark_count = c.fetchone()["cnt"]

            c.execute("SELECT COUNT(*) as cnt FROM resources")
            total_resources = c.fetchone()["cnt"]

            # Subject Progress Breakdown
            subjects = [
                "Engineering Physics",
                "Engineering Mathematics",
                "Programming / C",
                "Electrical Engineering",
                "Engineering Chemistry"
            ]
            subject_progress = []
            for sub in subjects:
                c.execute("SELECT COUNT(*) as total FROM resources WHERE subject = ?", (sub,))
                total_in_sub = c.fetchone()["total"]
                c.execute("""
                SELECT COUNT(*) as done
                FROM activity a
                JOIN resources r ON a.resource_id = r.id
                WHERE a.user_id = ? AND r.subject = ? AND a.completed = 1
                """, (user["id"], sub))
                done_in_sub = c.fetchone()["done"]

                pct = int((done_in_sub / total_in_sub * 100) if total_in_sub > 0 else 0)
                subject_progress.append({
                    "subject": sub,
                    "total": total_in_sub,
                    "completed": done_in_sub,
                    "percentage": min(pct, 100)
                })

            # Recommended materials (Real highest-rated)
            c.execute("""
            SELECT * FROM resources
            WHERE rating_count > 0
            ORDER BY average_rating DESC, rating_count DESC
            LIMIT 4
            """)
            recommended = [dict(r) for r in c.fetchall()]
            conn.close()

            overall_pct = int((completed_count / total_resources * 100) if total_resources > 0 else 0)

            self.send_json(200, {
                "stats": {
                    "viewedCount": viewed_count,
                    "completedCount": completed_count,
                    "bookmarkCount": bookmark_count,
                    "totalResources": total_resources,
                    "overallProgress": min(overall_pct, 100)
                },
                "recentViews": recent_views,
                "subjectProgress": subject_progress,
                "recommended": recommended
            })
            return

        # 6. Admin: Login History (Real Login Events Only)
        if path == "/api/admin/login-history":
            user = self.get_auth_user()
            if not user or user["role"] != "admin":
                self.send_error_json(403, "Forbidden: Admin access required")
                return
            conn = get_db()
            c = conn.cursor()
            c.execute("""
            SELECT id, user_id, user_name, email, login_date, login_time, timestamp
            FROM login_history
            ORDER BY timestamp DESC
            LIMIT 100
            """)
            history = [dict(r) for r in c.fetchall()]
            conn.close()
            self.send_json(200, {"loginHistory": history})
            return

        # 7. Admin: Registered Students & Users List
        if path == "/api/admin/users":
            user = self.get_auth_user()
            if not user or user["role"] != "admin":
                self.send_error_json(403, "Forbidden: Admin access required")
                return
            conn = get_db()
            c = conn.cursor()
            # Deliberately NEVER select password_hash or salt
            c.execute("""
            SELECT id, name, email, role, created_at
            FROM users
            ORDER BY created_at DESC
            """)
            users_list = []
            for r in c.fetchall():
                # Format joined date nicely (e.g. "Oct 1")
                try:
                    dt = datetime.fromisoformat(r["created_at"].replace(' ', 'T'))
                    joined_fmt = dt.strftime("%b %d")
                except Exception:
                    joined_fmt = r["created_at"][:10]

                users_list.append({
                    "id": r["id"],
                    "name": r["name"],
                    "email": r["email"],
                    "role": r["role"],
                    "createdAt": r["created_at"],
                    "joinedFormatted": joined_fmt
                })
            conn.close()
            self.send_json(200, {"users": users_list})
            return

        # 8. Admin: Real Analytics Stats
        if path == "/api/admin/stats":
            user = self.get_auth_user()
            if not user or user["role"] != "admin":
                self.send_error_json(403, "Forbidden: Admin access required")
                return
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT COUNT(*) as cnt FROM users")
            total_users = c.fetchone()["cnt"]

            c.execute("SELECT COUNT(*) as cnt FROM resources")
            total_res = c.fetchone()["cnt"]

            c.execute("SELECT COUNT(*) as cnt FROM ratings")
            total_ratings = c.fetchone()["cnt"]

            c.execute("SELECT SUM(view_count) as total_views FROM resources")
            total_views = c.fetchone()["total_views"] or 0

            c.execute("SELECT AVG(average_rating) as avg_platform FROM resources WHERE rating_count > 0")
            avg_rating = round(c.fetchone()["avg_platform"] or 0.0, 2)
            conn.close()

            self.send_json(200, {
                "totalUsers": total_users,
                "totalResources": total_res,
                "totalRatings": total_ratings,
                "totalViews": total_views,
                "platformAverageRating": avg_rating
            })
            return

        # Static file serving
        super().do_GET()

    # -------------------------------------------------------------------------
    # POST ROUTES
    # -------------------------------------------------------------------------
    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. Register User (Real registration flow)
        if path == "/api/auth/register":
            body = self.read_json_body()
            name = body.get("name", "").strip()
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")

            if not name or not email or not password:
                self.send_error_json(400, "Name, email, and password are required")
                return
            if len(password) < 6:
                self.send_error_json(400, "Password must be at least 6 characters")
                return

            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id FROM users WHERE email = ?", (email,))
            if c.fetchone():
                conn.close()
                self.send_error_json(409, "An account with this email already exists")
                return

            # Determine role: kaliabhavyam123@gmail.com is assigned 'admin', all others 'student'
            role = "admin" if email == ADMIN_EMAIL.lower() else "student"
            pw_hash, salt = hash_password(password)
            user_id = f"user-{uuid.uuid4().hex[:10]}"
            created_at_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            c.execute("""
            INSERT INTO users (id, name, email, password_hash, salt, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (user_id, name, email, pw_hash, salt, role, created_at_str))
            conn.commit()
            conn.close()

            # Record real login event
            record_login_event(user_id, name, email)

            token = generate_token(user_id, role)
            self.send_json(201, {
                "message": "Account created successfully",
                "token": token,
                "user": {
                    "id": user_id,
                    "name": name,
                    "email": email,
                    "role": role,
                    "createdAt": created_at_str
                }
            })
            return

        # 2. Login User (Real authentication flow)
        if path == "/api/auth/login":
            body = self.read_json_body()
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")

            if not email or not password:
                self.send_error_json(400, "Email and password are required")
                return

            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id, name, email, password_hash, salt, role, created_at FROM users WHERE email = ?", (email,))
            user = c.fetchone()

            if not user or not verify_password(password, user["password_hash"], user["salt"]):
                conn.close()
                self.send_error_json(401, "Invalid email or password")
                return

            role = user["role"]
            # Ensure kaliabhavyam123@gmail.com is strictly admin
            if email == ADMIN_EMAIL.lower() and role != "admin":
                c.execute("UPDATE users SET role = 'admin' WHERE id = ?", (user["id"],))
                conn.commit()
                role = "admin"

            conn.close()

            # Record real login event in login_history
            record_login_event(user["id"], user["name"], user["email"])

            token = generate_token(user["id"], role)
            self.send_json(200, {
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "role": role,
                    "createdAt": user["created_at"]
                }
            })
            return

        # 3. Rate Resource (Real 1-5 Star Rating, 1 per student per resource)
        if path == "/api/ratings":
            user = self.get_auth_user()
            if not user:
                self.send_error_json(401, "Please log in to submit a rating")
                return

            body = self.read_json_body()
            res_id = body.get("resourceId")
            rating_val = body.get("rating")

            try:
                rating_val = int(rating_val)
                if rating_val < 1 or rating_val > 5:
                    raise ValueError()
            except (ValueError, TypeError):
                self.send_error_json(400, "Rating must be an integer between 1 and 5")
                return

            conn = get_db()
            c = conn.cursor()

            # Insert or update single user rating
            rat_id = f"rat-{uuid.uuid4().hex[:10]}"
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            c.execute("""
            INSERT INTO ratings (id, user_id, resource_id, rating, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, resource_id) DO UPDATE SET
                rating = excluded.rating,
                updated_at = excluded.updated_at
            """, (rat_id, user["id"], res_id, rating_val, now_str, now_str))

            # Dynamically recalculate average rating and count from actual rows
            c.execute("SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM ratings WHERE resource_id = ?", (res_id,))
            stats = c.fetchone()
            new_avg = round(stats["avg_r"], 1) if stats["avg_r"] else 0.0
            new_cnt = stats["cnt"]

            c.execute("""
            UPDATE resources
            SET average_rating = ?, rating_count = ?
            WHERE id = ?
            """, (new_avg, new_cnt, res_id))

            conn.commit()
            conn.close()

            self.send_json(200, {
                "message": "Rating saved successfully",
                "userRating": rating_val,
                "averageRating": new_avg,
                "ratingCount": new_cnt
            })
            return

        # 4. Toggle Bookmark
        if path == "/api/bookmarks/toggle":
            user = self.get_auth_user()
            if not user:
                self.send_error_json(401, "Please log in to bookmark resources")
                return

            body = self.read_json_body()
            res_id = body.get("resourceId")
            if not res_id:
                self.send_error_json(400, "Resource ID required")
                return

            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id FROM bookmarks WHERE user_id = ? AND resource_id = ?", (user["id"], res_id))
            existing = c.fetchone()

            if existing:
                c.execute("DELETE FROM bookmarks WHERE user_id = ? AND resource_id = ?", (user["id"], res_id))
                bookmarked = False
            else:
                bm_id = f"bm-{uuid.uuid4().hex[:10]}"
                c.execute("""
                INSERT INTO bookmarks (id, user_id, resource_id, created_at)
                VALUES (?, ?, ?, datetime('now'))
                """, (bm_id, user["id"], res_id))
                bookmarked = True

            conn.commit()
            conn.close()
            self.send_json(200, {"bookmarked": bookmarked})
            return

        # 5. Record Resource View (Real view counter)
        if path == "/api/activity/view":
            user = self.get_auth_user()
            body = self.read_json_body()
            res_id = body.get("resourceId")
            if not res_id:
                self.send_error_json(400, "Resource ID required")
                return

            conn = get_db()
            c = conn.cursor()

            # Increment actual view count
            c.execute("UPDATE resources SET view_count = view_count + 1 WHERE id = ?", (res_id,))

            # If student logged in, record actual user activity
            if user:
                act_id = f"act-{uuid.uuid4().hex[:10]}"
                now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                c.execute("""
                INSERT INTO activity (id, user_id, resource_id, completed, viewed_at)
                VALUES (?, ?, ?, 0, ?)
                ON CONFLICT(user_id, resource_id) DO UPDATE SET
                    viewed_at = excluded.viewed_at
                """, (act_id, user["id"], res_id, now_str))

            conn.commit()
            conn.close()
            self.send_json(200, {"success": True})
            return

        # 6. Mark Resource as Completed / Read
        if path == "/api/activity/complete":
            user = self.get_auth_user()
            if not user:
                self.send_error_json(401, "Please log in to track study progress")
                return

            body = self.read_json_body()
            res_id = body.get("resourceId")
            completed = 1 if body.get("completed", True) else 0

            conn = get_db()
            c = conn.cursor()
            act_id = f"act-{uuid.uuid4().hex[:10]}"
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            c.execute("""
            INSERT INTO activity (id, user_id, resource_id, completed, viewed_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, resource_id) DO UPDATE SET
                completed = excluded.completed,
                viewed_at = excluded.viewed_at
            """, (act_id, user["id"], res_id, completed, now_str))
            conn.commit()
            conn.close()

            self.send_json(200, {"completed": bool(completed)})
            return

        # 7. StudySphere AI (Context-Aware & Resource-Based)
        if path == "/api/chat":
            body = self.read_json_body()
            messages = body.get("messages", [])
            context = body.get("context", None)

            if not messages:
                self.send_error_json(400, "Messages list is required")
                return

            # If resourceId provided in context, fetch fresh content_text from DB
            if context and context.get("resourceId") and not context.get("contentText"):
                conn = get_db()
                c = conn.cursor()
                c.execute("SELECT title, subject, unit, content_text FROM resources WHERE id = ?", (context["resourceId"],))
                res_row = c.fetchone()
                if res_row:
                    context["title"] = res_row["title"]
                    context["subject"] = res_row["subject"]
                    context["unit"] = res_row["unit"]
                    context["contentText"] = res_row["content_text"] or ""
                conn.close()

            reply = ask_study_ai(messages, context)
            self.send_json(200, {"reply": reply})
            return

        # 8. Admin: Upload New Resource (Notes or Lecture)
        if path == "/api/resources":
            user = self.get_auth_user()
            if not user or user["role"] != "admin":
                self.send_error_json(403, "Forbidden: Only admins can upload resources")
                return

            body = self.read_json_body()
            title = body.get("title", "").strip()
            subject = body.get("subject", "").strip()
            unit = body.get("unit", "").strip()
            res_type = body.get("type", "").strip()  # 'pdf' or 'lecture'
            description = body.get("description", "").strip()
            file_url = body.get("fileUrl", "").strip()
            video_url = body.get("videoUrl", "").strip()
            tags = body.get("tags", "").strip()
            content_text = body.get("contentText", "").strip()

            if not title or not subject or not unit or not res_type or not description:
                self.send_error_json(400, "All required fields must be filled")
                return

            # YouTube link parser
            if res_type == "lecture" and video_url:
                if "watch?v=" in video_url:
                    video_id = video_url.split("watch?v=")[1].split("&")[0]
                    video_url = f"https://www.youtube.com/embed/{video_id}"
                elif "youtu.be/" in video_url:
                    video_id = video_url.split("youtu.be/")[1].split("?")[0]
                    video_url = f"https://www.youtube.com/embed/{video_id}"

            # If PDF uploaded and content_text not provided, try to extract from local file
            if res_type == "pdf" and file_url.startswith("/uploads/") and not content_text:
                local_path = os.path.join(BASE_DIR, file_url.lstrip("/"))
                if os.path.exists(local_path):
                    try:
                        with open(local_path, "rb") as f:
                            content_text = extract_text_from_pdf_bytes(f.read())
                    except Exception as e:
                        print(f"Could not extract PDF text: {e}")

            res_id = f"res-{uuid.uuid4().hex[:10]}"
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            conn = get_db()
            c = conn.cursor()
            # New resource starts at EXACTLY 0 views and 0 ratings (No fake numbers!)
            c.execute("""
            INSERT INTO resources (
                id, title, description, subject, unit, type, file_url, video_url,
                tags, content_text, uploaded_by, created_at, average_rating, rating_count, view_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 0, 0)
            """, (
                res_id, title, description, subject, unit, res_type,
                file_url, video_url, tags, content_text, user["id"], now_str
            ))
            conn.commit()
            conn.close()

            self.send_json(201, {
                "message": "Resource uploaded successfully.",
                "id": res_id,
                "resourceId": res_id
            })
            return

        # 9. Admin: PDF File Upload Endpoint
        if path == "/api/upload":
            user = self.get_auth_user()
            if not user or user["role"] != "admin":
                self.send_error_json(403, "Forbidden: Only admins can upload files")
                return

            body = self.read_json_body()
            filename = body.get("filename", f"note-{int(time.time())}.pdf")
            file_data_b64 = body.get("data", "")

            if not filename.lower().endswith(".pdf"):
                self.send_error_json(400, "Only PDF files (.pdf) are allowed")
                return

            try:
                import base64
                raw_bytes = base64.b64decode(file_data_b64)
                if len(raw_bytes) > 10 * 1024 * 1024:
                    self.send_error_json(400, "File exceeds maximum size of 10MB")
                    return

                safe_name = f"{uuid.uuid4().hex[:8]}-{os.path.basename(filename)}"
                save_path = os.path.join(UPLOAD_DIR, safe_name)
                with open(save_path, "wb") as f:
                    f.write(raw_bytes)

                # Extract text from the PDF file for context-aware AI
                extracted_text = extract_text_from_pdf_bytes(raw_bytes)

                self.send_json(200, {
                    "fileUrl": f"/uploads/{safe_name}",
                    "filename": safe_name,
                    "extractedText": extracted_text[:2000]
                })
                return
            except Exception as e:
                self.send_error_json(500, f"Upload failed: {str(e)}")
                return

        self.send_error_json(404, "Endpoint not found")

    # -------------------------------------------------------------------------
    # PUT ROUTES
    # -------------------------------------------------------------------------
    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Admin: Edit Resource
        if path.startswith("/api/resources/") and len(path.split("/")) == 4:
            user = self.get_auth_user()
            if not user or user["role"] != "admin":
                self.send_error_json(403, "Forbidden: Only admins can modify resources")
                return

            res_id = path.split("/")[3]
            body = self.read_json_body()

            title = body.get("title", "").strip()
            subject = body.get("subject", "").strip()
            unit = body.get("unit", "").strip()
            description = body.get("description", "").strip()
            file_url = body.get("fileUrl", "").strip()
            video_url = body.get("videoUrl", "").strip()
            tags = body.get("tags", "").strip()

            if "watch?v=" in video_url:
                video_id = video_url.split("watch?v=")[1].split("&")[0]
                video_url = f"https://www.youtube.com/embed/{video_id}"
            elif "youtu.be/" in video_url:
                video_id = video_url.split("youtu.be/")[1].split("?")[0]
                video_url = f"https://www.youtube.com/embed/{video_id}"

            conn = get_db()
            c = conn.cursor()
            c.execute("""
            UPDATE resources
            SET title = ?, subject = ?, unit = ?, description = ?,
                file_url = ?, video_url = ?, tags = ?
            WHERE id = ?
            """, (title, subject, unit, description, file_url, video_url, tags, res_id))
            conn.commit()
            conn.close()

            self.send_json(200, {"message": "Resource updated successfully."})
            return

        self.send_error_json(404, "Endpoint not found")

    # -------------------------------------------------------------------------
    # DELETE ROUTES
    # -------------------------------------------------------------------------
    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Admin: Delete Resource
        if path.startswith("/api/resources/") and len(path.split("/")) == 4:
            user = self.get_auth_user()
            if not user or user["role"] != "admin":
                self.send_error_json(403, "Forbidden: Only admins can delete resources")
                return

            res_id = path.split("/")[3]
            conn = get_db()
            c = conn.cursor()

            c.execute("DELETE FROM ratings WHERE resource_id = ?", (res_id,))
            c.execute("DELETE FROM bookmarks WHERE resource_id = ?", (res_id,))
            c.execute("DELETE FROM activity WHERE resource_id = ?", (res_id,))
            c.execute("DELETE FROM resources WHERE id = ?", (res_id,))
            conn.commit()
            conn.close()

            self.send_json(200, {"message": "Resource permanently deleted."})
            return

        self.send_error_json(404, "Endpoint not found")

# -----------------------------------------------------------------------------
# START SERVER
# -----------------------------------------------------------------------------
def run():
    init_db()
    port = PORT
    server = None
    for attempt in range(5):
        try:
            server = HTTPServer(("", port), StudySphereHandler)
            break
        except OSError:
            port += 1

    if not server:
        print(f"[Fatal] Could not bind to port {PORT} or nearby ports.")
        sys.exit(1)

    print("=" * 64)
    print("🎓 StudySphere — College Study Platform Server")
    print("   'Learn. Explore. Grow.'")
    print("=" * 64)
    print(f"Server is running at:  http://localhost:{port}")
    print(f"SQLite Database:       {DB_PATH}")
    print(f"Uploaded Files Dir:    {UPLOAD_DIR}")
    print("-" * 64)
    print(f"Admin Role Configured for: {ADMIN_EMAIL}")
    print("No fake data loaded. Real user and upload tracking active.")
    print("=" * 64)
    print("Press Ctrl+C to stop.\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping StudySphere server.")
        server.server_close()

if __name__ == '__main__':
    run()
