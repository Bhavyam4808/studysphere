# 🎓 StudySphere — "Learn. Explore. Grow."

> **First-Year College Hackathon Project (2026)**  
> An authentic, production-ready study platform for undergraduate engineering students. Discover course notes, watch lecture masterclasses, rate verified materials, track personal syllabus progress, and study with an intelligent context-aware AI academic assistant.

---

## 🌟 Project Overview & Vision

**StudySphere** is designed to solve the chaos faced by first-year college students: finding quality, syllabus-aligned study materials without getting lost in disorganized Drive links or unverified videos.

Unlike typical hackathon templates that ship with pre-populated dummy data and fake ratings, **StudySphere starts with zero fake data**. Every rating, view count, login log, and student account is 100% genuine and dynamically generated through real user actions.

Built by a small team of first-year students in one month, StudySphere prioritizes:
- **Zero Fabricated Demo Data:** No fake ratings, no fake view counts, no dummy pre-seeded records.
- **Authentic Authentication:** Standard student registration & email/password login (PBKDF2 HMAC-SHA256). No shortcut demo buttons.
- **Smart Admin Role Provisioning:** The recognized administrator email (`kaliabhavyam123@gmail.com`) automatically receives `admin` role upon registration, with zero hardcoded passwords.
- **Context-Aware StudySphere AI:** Ask questions directly about any active note or video lecture. The AI prioritizes the uploaded study material and transparently disclaims when an inquiry falls outside the material.
- **Real Activity & Analytics:** Real login history (timestamps, user, email) and safe student directory in the Admin portal.

---

## ✨ Core Features & Walkthrough

### 1. 🏠 Clean Home & Catalog Hub
- **Dynamic Real Metrics:** Shows actual live statistics (real views, real student count, real ratings). Starts at 0 until students join and interact.
- **Graceful Empty States:** When newly installed with no materials, students see an encouraging *"No study materials uploaded yet — check back soon!"* state.
- **Syllabus Category Grid:** First-year engineering disciplines:
  1. Engineering Physics (Quantum mechanics, optics, lasers, wave theory)
  2. Engineering Mathematics (Linear algebra, eigenvalues, differential equations)
  3. Programming / C (Pointers, memory management, functions, arrays)
  4. Electrical Engineering (Kirchhoff's laws, KCL/KVL, network theorems)
  5. Engineering Chemistry (Thermodynamics, electrochemistry)
  6. Other (Electives)

### 2. 🔐 Authentic Authentication & Security
- **No Fake Shortcut Buttons:** The Login page is authentic and standard. Students register their own college email and log in securely.
- **Role Redirection:**
  - Standard students are routed directly to the **Student Dashboard**.
  - Verified administrators are routed directly to the **Admin Dashboard**.
- **Admin Account Recognition:**
  - **Email:** `kaliabhavyam123@gmail.com`
  - When this email registers or logs in, the backend securely assigns `role = 'admin'`. No passwords are hardcoded in the codebase.
- **Cryptographic Security:** Passwords hashed with PBKDF2 HMAC-SHA256 (100,000 iterations + unique random salts).
- **Backend Role Protection:** All admin endpoints (`/api/admin/*`, `POST /api/resources`, `DELETE /api/resources/:id`) strictly enforce admin privileges (non-admins receive `403 Forbidden`).

### 3. 👑 Admin Dashboard (Staff Portal)
Organized into two intuitive sections:

#### Tab 1: Resources Management
- **Upload Notes:** Upload PDF study materials (< 10MB) or provide URLs. Automatically runs native text extraction to index keywords for the AI.
- **Upload Lecture:** Embed YouTube masterclasses or direct video streams with Title, Subject, Unit, Description, and Tags.
- **Manage Resources:** Filter and search through active materials. Edit metadata or permanently delete obsolete materials (with double-confirmation).

#### Tab 2: Users & Activity Tracking
- **Login History:** Live chronological log of every real authentication event showing:
  - User Name & Email
  - Login Date & Time
  - Real event timestamp
- **Registered Students:** Directory of enrolled students displaying Name, Email, Semester, and Joined Date. Deliberately omits sensitive hashes and credentials.

### 4. 🤖 Context-Aware "StudySphere AI"
- Renamed from generic "Study AI" to **StudySphere AI**.
- **In-Viewer Integration:** Every PDF Reader and Video Lecture player modal includes an **[Ask StudySphere AI about this Note/Lecture]** action button.
- **Resource Context Passing:** Automatically binds the active document's title, subject, unit, and extracted text to the AI session.
- **Intelligent Academic Answers:**
  - **In-Material Match:** Answers directly from the resource, quoting key excerpts.
  - **Out-of-Material Inquiry:** If a student asks about an unrelated topic (e.g. asking about Kirchhoff's circuit laws while viewing Quantum Physics notes), StudySphere AI explicitly announces:  
    > *"I couldn't find this specifically in the selected study material (Quantum Mechanics), but I can explain the concept generally:"*  
    followed by a structured academic response.
- **Structured Pedagogy:** Organizes tough engineering topics into:  
  **Concept** → **Explanation** → **Example** → **Exam Takeaway**.
- **Multi-Turn Memory & [New Chat]:** Full conversation memory with an instant reset button.
- **Resilient Fallback:** Works with OpenAI (`gpt-3.5-turbo`) when `OPENAI_API_KEY` is set in `.env`, or seamlessly falls back to the native offline academic knowledge engine.

### 5. ⭐ Anti-Inflation Rating System
- 1–5 star interactive ratings.
- **Anti-Spam / Anti-Inflation Constraint:** `UNIQUE(user_id, resource_id)` database constraint ensures each student only has one vote per resource. Submitting a new rating updates their existing rating rather than inflating counts.
- Displays *"Not rated yet"* until a real student rates the material.

### 6. 📊 Student Dashboard & Bookmarks
- Personal syllabus completion tracker.
- Recent study history: Quick-launch cards for recently viewed notes.
- Personal Bookmarks shelf for quick exam revision.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Tailwind CSS, Heroicons SVG | Responsive, beginner-friendly component architecture |
| **Backend** | Python 3 standard library (`server.py`) | Lightweight REST API, native PDF text extractor, zero external dependencies |
| **Alternative** | Node.js Express (`server.js`) | Express REST API alternative |
| **Database** | SQLite (`studysphere.db`) | Local relational storage, pristine clean initialization |
| **Security** | PBKDF2 HMAC-SHA256, Session Tokens | Production password hashing and role enforcement |
| **AI Assistant** | OpenAI API proxy with offline academic tutor | Context-aware resource Q&A |

---

## 🚀 How to Run the Project

### Prerequisites
- Python 3.8+ (pre-installed on macOS and Linux)

### Step 1: Start the Backend Server
In your terminal, navigate to the project directory:
```bash
cd /Users/bhavyam4808/.gemini/antigravity/scratch/studysphere
python3 server.py
```
The server will start on **`http://localhost:8080`**:
```text
🎓 StudySphere — College Study Platform Server
Server is running at:  http://localhost:8080
Admin Role Configured for: kaliabhavyam123@gmail.com
No fake data loaded. Real user and upload tracking active.
```
*(Port 8080 is selected to prevent conflicts with macOS AirPlay Receiver on port 5000).*

### Step 2: Open in Browser
Visit **`http://localhost:8080`** in Google Chrome, Safari, or Firefox.

*(On macOS, you can also double-click `start.command` in Finder!)*

---

## 🧪 Automated End-to-End Verification

StudySphere includes a comprehensive verification test suite covering the entire user journey:
```bash
python3 test_flow.py
```
This script tests and validates:
1. **Zero Fake Data:** Clean stats (0 resources, 0 views, 0 ratings).
2. **Student Authentication:** Registration, password hashing, and login.
3. **Admin Automatic Recognition:** `kaliabhavyam123@gmail.com` granted `admin` role.
4. **Security Enforcement:** Student tokens receive `403 Forbidden` on admin routes.
5. **Real Login History & Safe Student Directory:** Accurate logging without credential leakage.
6. **Resource Uploads:** PDF Notes and YouTube lectures.
7. **Real Interactions:** View count increments, 1–5 star ratings, and bookmarks.
8. **StudySphere AI Context-Awareness:** Tests both in-context resource citations and out-of-material disclaimer handling.
9. **Real Analytics:** Dynamic updates based on real user actions.

---

## 👥 Hackathon Walkthrough Sequence (3-Minute Live Demo)

1. **Clean Slate Start:**
   - Open `http://localhost:8080`.
   - Show the clean home page with zero fake numbers or manufactured ratings.
2. **Register as Admin:**
   - Click **Sign In** → **Create an account**.
   - Register with email `kaliabhavyam123@gmail.com` and your chosen password.
   - You are immediately recognized as Admin and directed to the **Admin Dashboard**!
3. **Upload Real Study Material:**
   - Go to **Resources** tab → **Upload Notes**.
   - Upload a PDF or add note details (e.g., *"Quantum Mechanics & Wave Functions"*).
   - Add a video lecture under **Upload Lecture**.
4. **Inspect Users Tab:**
   - Click the **Users** tab in Admin Dashboard.
   - View your real login event in **Login History** (timestamp, user, email).
   - View **Registered Students** list.
5. **Register as a Student:**
   - Log out. Click **Create an account** and register as a student (e.g. `rahul@college.edu`).
   - Automatically redirected to the **Student Dashboard**.
6. **Interact with the Resource:**
   - Open the uploaded Quantum Mechanics note.
   - Rate it 5 stars (notice it now displays 5.0 with 1 rating).
   - Click **Bookmark** and **Mark as Read**.
7. **Test Context-Aware StudySphere AI:**
   - Click **[Ask StudySphere AI about this Note]** inside the PDF viewer.
   - Notice the green active context badge: *"Studying: Quantum Mechanics & Wave Functions"*.
   - Ask: *"What is de Broglie wavelength?"* → AI references the uploaded note!
   - Ask: *"Explain Kirchhoff's current law"* → AI detects the topic is not in the physics note and clearly announces:  
     *"I couldn't find this specifically in the selected study material (Quantum Mechanics), but I can explain the concept generally:"* followed by structured points!

---

## 📜 License

Created under the MIT License for College Hackathon 2026. Built with ❤️ by undergraduate engineering students.
