# TechPrep — Interview Mastery Platform

TechPrep is a full-stack interview-preparation app: a curated question bank organized by
technology topic, quizzes, AI-powered mock interviews (with voice), a resume analyzer, an
AI code editor, progress tracking, and gamified revision — plus a full admin panel for
managing all of that content.

This repo is the **frontend** (React + Vite). The API lives in a separate repo:
[`tech-prep-app-backend`](https://github.com/manish9869/tech-prep-app-backend) (Express +
PostgreSQL), which this app talks to over REST — see its Swagger docs at `/api/docs` on a
running backend for the full API reference.

## Tech stack

- **React 19** + **Vite 6** — build tooling and dev server
- **Tailwind CSS 4** + Radix UI primitives (shadcn-style components in `src/components/ui`)
- **TanStack Query** — server-state fetching/caching for every API call
- **React Router v7** — client-side routing, with a role-based route tree (see below)
- **React Hook Form + Zod** — form state and validation
- **Recharts** — analytics dashboards
- **Framer Motion** — page/element transitions
- **jsPDF** — client-side PDF export (e.g. optimized resume download)
- **Sonner** — toast notifications
- Browser **Web Speech API** (`SpeechRecognition` / `speechSynthesis`) — voice input and
  question read-aloud in Mock Interview, entirely client-side, no paid API involved

## Getting started

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your running backend, e.g. http://localhost:5000/api
npm run dev             # http://localhost:5173
```

You'll need the [backend](https://github.com/manish9869/tech-prep-app-backend) running
locally (or pointed at a deployed instance) for the app to have any data to show — this repo
has no mock/offline data layer.

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

## Auth flow

- Email/password registration and login, or **Google OAuth** (if the backend has it configured).
- The backend issues a short-lived **JWT access token** (kept in memory only — never
  `localStorage`, so it can't be read by an XSS payload sniffing storage) plus an `httpOnly`
  refresh cookie.
- On a `401`, the app silently calls `/auth/refresh` once and retries the original request
  before giving up and bouncing to `/login` — see `src/api/httpClient.js`.
- Google OAuth completes via a redirect to `/oauth-complete?token=...` (`src/pages/OAuthComplete.jsx`),
  since the frontend and backend can live on different domains and third-party cookies aren't
  reliable for that hop.

## Roles and routing

The whole app renders under one of two route trees, decided by `profile.role` once the
logged-in user's profile has loaded (`src/App.jsx` → `RoleRouter`):

- **`user` (viewer)** — the study/practice experience described below.
- **`admin`** — a separate, smaller route tree for managing content; admins don't see the
  viewer pages at all.

Sidebar links for viewers are additionally filtered live against the `page_visibility` table,
so an admin can hide any feature app-wide from **Page Visibility** without a deploy.

## Viewer features

| Page | Route | What it does |
|---|---|---|
| **Dashboard** | `/` | Overview: streak, recent activity, quick links into the rest of the app |
| **Explore Topics** | `/explore` | Browse all topics (Java, React, SQL, System Design, …) as cards |
| **Study** | `/study/:topicId` | Work through a topic's questions one at a time, with notes/bookmarking |
| **All Questions** | `/all-questions` | Flat, filterable/searchable view across every topic |
| **Question Detail** | `/question/:questionId` | Full question, answer, explanation, code snippet, notes |
| **Quiz** | `/quiz` | Timed MCQ quiz by topic/difficulty. **Server-graded** — the answer key never reaches the browser until after you submit, so client-side answer-peeking isn't possible |
| **Mock Interview** | `/mock-interview` | Pick one or more technologies + an interview round (**Screening → Technical → Manager → HR**), then answer questions with AI feedback. Includes a 🔊 speaker button to have the question read aloud and a 🎤 mic button to answer by voice (transcribed live into the same answer box you'd otherwise type into) — both powered by the browser's built-in Web Speech API, so there's no recording upload and no extra cost |
| **Code Editor** | `/code-editor` | In-browser code editor with AI-assisted run/analyze/optimize and "generate a coding challenge" |
| **Roadmap** | `/roadmap` | Visual, phase-by-phase learning path per topic |
| **Bookmarks** | `/bookmarks` | Questions you've saved for later |
| **Revision Center** | `/revision` | Targeted review: wrong quiz answers, bookmarked questions, not-yet-attempted, and other weak-spot views |
| **Quiz History** | `/quiz-history` | Every past quiz attempt with score breakdown |
| **Achievements** | `/achievements` | Badges for milestones — questions completed, quiz scores, bookmarks, study streaks, topics explored |
| **Analytics** | `/analytics` | Charts of study activity, quiz performance, and topic coverage over time |
| **Resume Analyzer** | `/resume-analyzer` | Upload a resume (PDF/DOCX/TXT); AI scores it (ATS score, JD match), extracts skills, flags missing keywords, and can generate an optimized rewrite |
| **My Profile** | `/profile` | Account details, streak stats |

## Admin features

| Page | Route | What it does |
|---|---|---|
| **Dashboard** | `/` | Content/user overview |
| **Topics** | `/topics` | Create/edit/reorder topics, upload logos |
| **Questions** | `/questions` | Full CRUD on the question bank — theory, coding, MCQ, scenario, and interview-round questions |
| **Roadmap Manager** | `/roadmap-manager` | Build the phase-by-phase roadmap content per topic |
| **Page Visibility** | `/page-visibility` | Toggle any viewer-side page on/off app-wide, instantly |
| **Import / Export** | `/import-export` | Bulk-import questions from JSON, export the current bank |
| **Test Cases** | `/test-cases` | Internal QA reference doc |

Admins reach content endpoints exactly like viewers (same JWT), but write access
(create/update/delete on topics, questions, companies, roadmap phases) is enforced
**server-side** by an admin-role check — hiding the admin UI is a UX nicety, not the actual
security boundary.

## Project structure

```
src/
  api/            # httpClient (fetch wrapper, token refresh), auth.js, entities.js (typed API calls)
  pages/          # one file per route — viewer/ and admin/ subfolders, see tables above
  components/
    layout/       # AppLayout, Sidebar, MobileNav
    shared/       # QuestionCard, PageHeader, etc. reused across pages
    ui/           # shadcn-style Radix primitives (button, dialog, tabs, ...)
  lib/            # AuthContext, ThemeContext, query-client, PageNotFound, utils
```

## Contributing

`main` is protected — push a feature branch and open a pull request. An AI reviewer
(CodeRabbit) comments automatically on every PR; a human still has to approve and merge.
