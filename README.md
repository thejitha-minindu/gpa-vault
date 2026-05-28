# 📊 GPA Vault

A premium GPA calculator and academic performance tracker with real-time analytics, what-if planning, and cloud sync via Supabase.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase&logoColor=white)

---

## ✨ Features

- **Multiple Grading Scales** — 4.0 Standard, 4.2 Standard, Percentage, and Letter (No +/-)
- **Semester Management** — Create, rename, and organise unlimited semesters with weighted courses
- **Real-Time CGPA** — Cumulative GPA calculated live as you add or edit courses
- **Analytics Dashboard** — GPA trend charts, credit-load bars, and grade distribution pie charts powered by Recharts
- **What-If Planner** — Add hypothetical courses and instantly see how they affect your projected CGPA
- **Target GPA Calculator** — Find the average grade you need in remaining credits to hit a goal
- **Degree Templates** — Quick-fill semesters with common course structures (CS, Business, Engineering, Medicine, Arts)
- **Prior Record Support** — Include a previous GPA and credit count for transfer students
- **Google OAuth** — Sign in with Google via Supabase Auth
- **Cloud Sync** — All semesters, courses, and preferences are persisted in Supabase (PostgreSQL) with Row Level Security
- **Dark / Light Mode** — Toggle between a sleek dark theme and a clean light theme
- **CSV Export** — Download all semester data as a CSV file

---

## 🛠 Tech Stack

| Layer         | Technology                                      |
| ------------- | ----------------------------------------------- |
| Frontend      | React 18, Vite 5                                |
| Styling       | Vanilla CSS-in-JS (inline styles)               |
| Charts        | Recharts                                        |
| Auth          | Supabase Auth (Google OAuth)                    |
| Database      | Supabase (PostgreSQL) with RLS                  |
| Fonts         | Playfair Display, DM Sans (Google Fonts)        |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- A [Supabase](https://supabase.com/) project (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/thejitha-minindu/gpa-vault.git
cd gpa-vault
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com/dashboard)
2. Go to **SQL Editor** and run the schema from [`supabase/schema.sql`](supabase/schema.sql) to create the required tables:
   - `profiles` — user preferences (theme, scale, prior GPA)
   - `semester_records` — semester metadata
   - `course_records` — individual course entries
3. Go to **Authentication → Providers** and enable **Google** (add your OAuth client ID and secret)
4. Go to **Authentication → URL Configuration** and add your app's URL to **Redirect URLs**:
   - For local dev: `http://localhost:3000`
   - For production: `https://gpa-vault.vercel.app`

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> ⚠️ **Never commit `.env.local` to Git.** It is already listed in `.gitignore`.

### 5. Run the Dev Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your repo to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. Add your environment variables in the Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite and handles the build

> **Important:** After deploying, add your Vercel URL to Supabase → Authentication → URL Configuration → Redirect URLs.

### Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

The output is in the `dist/` folder, ready to be served by any static host.

---

## 📁 Project Structure

```
gpa-vault/
├── index.html                  # Entry HTML
├── vite.config.js              # Vite configuration
├── package.json
├── .env.local                  # Supabase credentials (not committed)
├── supabase/
│   └── schema.sql              # Database schema with RLS policies
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Root component — state, effects, routing
    ├── lib/
    │   └── supabase.js         # Supabase client initialisation
    ├── data/
    │   ├── gradeScales.js      # Grading scale definitions
    │   └── degreeTemplates.js  # Degree template course lists
    ├── utils/
    │   ├── gpa.js              # GPA calculation helpers
    │   ├── storage.js          # localStorage wrappers
    │   ├── auth.js             # Local auth utilities (fallback)
    │   └── supabaseSync.js     # Supabase read/write sync logic
    ├── components/
    │   ├── AuthModal.jsx       # Google sign-in modal
    │   ├── TopNav.jsx          # Navigation bar
    │   └── SemesterCard.jsx    # Collapsible semester card
    └── views/
        ├── DashboardView.jsx   # Overview with stats and GPA ring
        ├── SemestersView.jsx   # Semester management
        ├── AnalyticsView.jsx   # Charts and performance breakdown
        └── WhatIfView.jsx      # What-if planner and target calculator
```

---

## 📄 License

This project is for personal/educational use.
