# CareerMatch AI 🚀

> **AI-Powered ATS Resume Analyzer & Job Recommendation Platform**
> Make Your CV ATS-Ready. Discover Jobs That Match Your Potential.

CareerMatch AI is a full-stack web application that empowers job seekers to upload resumes, receive deterministic ATS readiness scores out of 100 with category breakdowns, improve their CVs with AI-powered suggestions (without fabricating credentials), match resumes against job descriptions, discover relevant job vacancies, export ATS-optimized PDF and DOCX files, and track applications end-to-end.

---

## 🏗️ Architecture & Technology Stack

```
careermatch-ai/
├── frontend/                  # React 19 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/        # Layout, Sidebar, UI components (Cards, Rings, Skeletons, etc.)
│   │   ├── lib/               # API client (Axios), utilities, formatting
│   │   ├── pages/             # Dashboard, Upload/Analyze, Improve, Jobs, Matcher, Tracker, etc.
│   │   └── store/             # Zustand state management with local persistence
│   └── package.json
├── backend/                   # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/            # Centralized environment variable management
│   │   ├── middleware/        # Supabase JWT Auth, Helmet, CORS, Error Handler
│   │   ├── routes/            # REST API endpoints (/resumes, /analyses, /jobs, /applications, /profile)
│   │   ├── services/          # ATS Scoring Engine, AI Service, Job Matcher, Resume Parser, CV Exporter
│   │   └── types/             # Shared TypeScript models and interfaces
│   ├── migrations/            # PostgreSQL / Supabase SQL migrations with RLS policies
│   ├── prisma/                # Optional Prisma ORM schema for PostgreSQL
│   ├── tests/                 # Automated test suite (ATS scoring, parsing, matching, security)
│   └── package.json
├── .env.example               # Environment variables template
└── README.md                  # Complete setup and deployment documentation
```

### Frontend
- **Framework:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS with modern design tokens (white/light-gray backgrounds, blue/violet accents)
- **Icons:** Lucide React
- **Routing:** React Router v7
- **State Management:** Zustand with local persistence
- **Charts & Visualizations:** Recharts and custom animated SVG score rings

### Backend
- **Runtime:** Node.js (v20+ / v26) + Express.js + TypeScript
- **Document Processing:** `pdf-parse` (PDF extraction), `mammoth` (DOCX extraction)
- **Export Engines:** `pdfkit` (ATS single-column PDF generation), `docx` (Word document generation)
- **Security:** `helmet`, `cors`, secure token verification, centralized error handling

### Database & Storage
- **Relational Database:** PostgreSQL (Supabase compatible)
- **Object Storage:** Private Supabase Storage bucket for uploaded CV files
- **Security:** Row Level Security (RLS) on all user-owned tables
- **Migrations:** Raw SQL migrations and optional Prisma ORM schema

---

## ✨ Key Features

1. **CV Upload & Text Extraction:** Drag-and-drop support for PDF and DOCX documents with magic-byte validation and extraction error handling.
2. **Deterministic ATS Readiness Scoring (0–100):**
   - Formatting & Structure: 20 pts
   - Skills & Keyword Presentation: 25 pts
   - Work Experience & Achievements: 20 pts
   - Education & Qualifications: 10 pts
   - Contact Details & Essential Sections: 10 pts
   - Readability & Grammar: 10 pts
   - Document Extraction Quality: 5 pts
3. **Truthfulness-Preserving AI Improvement Assistant:**
   - Enhances professional summaries and experience bullet points using strong action verbs.
   - **Strict constraint:** Never invents degrees, employment dates, company names, or metrics.
   - Provides before-and-after interactive controls (Accept, Reject, Edit).
4. **Job Description Matcher:**
   - Compares CV against any pasted job posting.
   - Calculates weighted job match percentage (Required Skills 40%, Experience 25%, Responsibilities 15%, Education 10%, Preferred Skills 10%).
   - Displays matched skills, missing requirements, and specific resume tweaks.
5. **Personalized Job Recommendations:**
   - Filters vacancies by title, location, country, employment type, and minimum match score.
   - Prioritizes Sri Lankan vacancies and international remote opportunities.
   - Transparently indicates verification freshness and demo vs. live listings.
6. **ATS-Optimized CV Export:**
   - One-click export to single-column ATS-friendly PDF and DOCX.
   - Clean typographical hierarchy, standard headings, and bullet points.
7. **Application Tracker:**
   - Kanban/table view tracking job statuses: *Interested*, *Saved*, *Preparing*, *Applied*, *Interview*, *Offer*, *Rejected*, *Withdrawn*.
   - Notes, follow-up dates, and linked resume versions.
8. **Demo Mode:**
   - Runs out-of-the-box without requiring third-party API keys or external services.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v20.x or higher
- `npm` v9.x or higher

### 2. Clone & Install Dependencies

From the repository root:
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Return to root
cd ..
```

### 3. Environment Configuration

Copy the `.env.example` file to create your environment configuration:
```bash
cp .env.example backend/.env
```

If you don't configure Supabase or OpenAI, the application will automatically run in **Demo Mode**, utilizing rule-based ATS scoring and built-in sample listings!

---

## 🗄️ Supabase & Database Setup (For Production Mode)

1. **Create a Supabase Project:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. **Run Database Migrations:**
   - In Supabase SQL Editor, run `backend/migrations/001_initial_schema.sql`.
   - Then run `backend/migrations/002_row_level_security.sql` to enable RLS.
   - Optionally run `backend/migrations/003_seed_demo_jobs.sql` to populate sample jobs.
3. **Configure Private Storage Bucket:**
   - Navigate to **Storage** -> **New Bucket**.
   - Name: `resumes`.
   - **Important:** Ensure **Public bucket** is toggled **OFF** (Private).
4. **Update `backend/.env`:**
   ```env
   SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   SUPABASE_ANON_KEY=your-anon-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

---

## 🤖 AI Provider Setup (Optional)

To enable advanced generative LLM suggestions:
1. In `backend/.env`, set:
   ```env
   AI_PROVIDER=openai
   AI_API_KEY=sk-your-openai-api-key
   AI_MODEL=gpt-4o-mini
   ```
2. When no API key is provided, the platform automatically uses the deterministic rule-based suggestion engine.

---

## 🏃 Running the Application

### Development Mode

Run both frontend and backend concurrently or in separate terminals:

**Terminal 1 (Backend API on port 3001):**
```bash
npm run dev:backend
# or cd backend && npm run dev
```

**Terminal 2 (Frontend on port 5173):**
```bash
npm run dev:frontend
# or cd frontend && npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 🧪 Running Automated Tests

The repository includes a comprehensive automated test suite covering:
- Deterministic ATS score calculations and boundary conditions (0–100)
- Section detection and missing field identification
- Job matching algorithms and score breakdown calculations
- Document parsing and entity extraction
- API security, Helmet protection, and health check endpoints

Run all tests from the root:
```bash
npm test
```
All 20 test cases run natively and assert core platform functionality.

---

## 📦 Building for Production

To build both the Express TypeScript backend and Vite React frontend:
```bash
npm run build
```
The compiled files will be located in:
- `backend/dist/`
- `frontend/dist/`

To start the production backend server:
```bash
npm start
```

---

## 🔒 Security & Privacy

- **Zero Client-Side Keys:** All LLM and database service role keys reside strictly in backend environment variables.
- **Private Storage:** Uploaded CVs are never exposed via public URLs.
- **Strict Tenant Isolation:** Row Level Security (RLS) policies guarantee that users can only view, update, and delete their own resumes and analyses.
- **Clean Document Processing:** Sanitized file handling with size limits (10 MB default) and MIME-type verification.
- **Account & Data Deletion:** Users can delete their profile and all associated data via the `/api/v1/profile/account` endpoint.

---

## 📄 License
MIT License. Built for modern career development and truthful job discovery.
