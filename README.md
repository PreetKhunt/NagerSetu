# NagarSetu — AI-Powered Civic Grievance Platform

NagarSetu is a full-stack, AI-powered civic grievance lodging and tracking system. Citizens can report civic issues (potholes, garbage, water leakage, etc.) using text, voice, or image uploads. The platform's AI classifies the complaint, suggests priority, auto-generates descriptions from images, and routes the complaint to the responsible municipal department for resolution.

---

## 🔗 Live Deployments

- **Frontend (Production)**: [https://nagar-setu-rust.vercel.app](https://nagar-setu-rust.vercel.app)
- **Frontend (Branch Preview)**: [https://nagar-setu-git-backend-fastapi-team-448.vercel.app](https://nagar-setu-git-backend-fastapi-team-448.vercel.app)
- **Backend (Render)**: [https://nagarsetu-backend-c858.onrender.com](https://nagarsetu-backend-c858.onrender.com)
- **API Swagger Documentation**: [https://nagarsetu-backend-c858.onrender.com/docs](https://nagarsetu-backend-c858.onrender.com/docs)

---

## 🚀 Key Features

- **Multi-Mode Grievance Lodging**: Text description, voice recording, or image upload.
- **AI Vision Scanning & Auto-Description**: Uploading a photo triggers the backend `gemini-3.1-flash-lite` model to analyze the image, validate it as a civic issue, and auto-generate a description which the citizen can edit/append details to.
- **Automatic Routing**: AI text analysis classifies the category, department, and priority.
- **End-to-End Tracking**: Citizens and officers see the same live data synced via a Supabase PostgreSQL database. Officers can update statuses, write resolution notes, and assign handling officers.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 · Vite 8 · Bootstrap 5 (grid/utilities) · Leaflet Maps · Axios
- **Backend**: FastAPI (Python) · SQLAlchemy ORM · Uvicorn
- **Database**: Supabase PostgreSQL
- **AI Integration**: Google Gemini API (`gemini-3.1-flash-lite`)

---

## 💻 Local Setup

### 1. Backend

Navigate to the `backend/` directory:
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows
source .venv/bin/activate      # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env and configure keys
# DATABASE_URL=postgresql+psycopg://...
# GEMINI_API_KEY=AIzaSy...

# Start server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

Navigate to the project root:
```bash
# Install dependencies
npm install

# Create .env and configure VITE_API_BASE_URL=http://localhost:8000/api
# Start development server
npm run dev
```
