# AIFaGen Labs Admin Portal · Enterprise AI Autonomous Operations Desk

[![React Version](https://img.shields.io/badge/React-19.2.8-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/Vite-8.3.4-646cff?style=flat-square&logo=vite)](https://vite.dev/)
[![React Router](https://img.shields.io/badge/React_Router-7.18.4-f44250?style=flat-square&logo=react-router)](https://reactrouter.com/)
[![License](https://img.shields.io/badge/License-Proprietary-blue?style=flat-square)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-emerald?style=flat-square)]()
[![Code Quality](https://img.shields.io/badge/ESLint-0_Errors-4b32c3?style=flat-square&logo=eslint)](https://eslint.org/)

An enterprise-grade, intelligent operations portal and autonomous executive command desk engineered for **AIFAGEN INTELLIGENCE PRIVATE LIMITED (AIFaGen Labs)**.

The portal unifies **Tech Candidate Reverse Recruiting**, **AI Interview Mentorship**, **Multi-Channel Job Crawler Orchestration**, **Subscription Billing Telemetry**, **LLM Infrastructure Observability**, an **Executive Operations AI Co-Pilot (Chatbot)**, and an **Autonomous Voice Agent with Zero-Touch Email Report Dispatch**.

---

## Table of Contents

- [1. Executive Overview](#1-executive-overview)
- [2. High-Impact Highlights: AI Co-Pilot & Voice Agent](#2-high-impact-highlights-ai-co-pilot--voice-agent)
  - [2.1 Executive Operations AI Co-Pilot (Chatbot)](#21-executive-operations-ai-co-pilot-chatbot)
  - [2.2 Autonomous AI Voice Agent & Mail Dispatch Tool](#22-autonomous-ai-voice-agent--mail-dispatch-tool)
  - [2.3 Time-Saving Impact Matrix](#23-time-saving-impact-matrix)
- [3. Comprehensive Feature Tour & Minute Details](#3-comprehensive-feature-tour--minute-details)
  - [3.1 Authentication & Security (`/login`)](#31-authentication--security-login)
  - [3.2 Executive Command Desk (`/dashboard`)](#32-executive-command-desk-dashboard)
  - [3.3 Candidate Roster & ATS Placement (`/users`)](#33-candidate-roster--ats-placement-users)
  - [3.4 Billing, Transactions & Plan Tiers (`/payments`, `/plans`)](#34-billing-transactions--plan-tiers-payments-plans)
  - [3.5 Job Board, Internal Openings & Crawler Engine (`/jobs`)](#35-job-board-internal-openings--crawler-engine-jobs)
  - [3.6 AI Technical Interview Proctoring (`/interviews`)](#36-ai-technical-interview-proctoring-interviews)
  - [3.7 LLM Token & Cost Observability (`/ai-usage`)](#37-llm-token--cost-observability-ai-usage)
  - [3.8 Enterprise BI Reporting Engine (`/reports`)](#38-enterprise-bi-reporting-engine-reports)
  - [3.9 Compliance Audit Forensics (`/audit-log`)](#39-compliance-audit-forensics-audit-log)
  - [3.10 System Settings & Staff Access Control (`/settings`, `/team-members`)](#310-system-settings--staff-access-control-settings-team-members)
- [4. Interactive Revenue Trend Graph Engine](#4-interactive-revenue-trend-graph-engine)
- [5. Architecture & Tech Stack](#5-architecture--tech-stack)
- [6. Project Structure](#6-project-structure)
- [7. Environment Configuration (`.env`)](#7-environment-configuration-env)
- [8. Installation & Local Development](#8-installation--local-development)
- [9. Production Build & Deployment](#9-production-build--deployment)
- [10. Compliance & Corporate Identity](#10-compliance--corporate-identity)

---

## 1. Executive Overview

### What is AIFaGen Labs Admin Portal?
The **AIFaGen Labs Admin Portal** is an all-in-one internal software suite designed to manage thousands of tech candidates, track paid subscription tiers (Basic ₹799/mo, Premium ₹1,999/mo), proctor AI-assisted coding and behavioral mock interviews, crawl 15,000+ job openings daily from major job platforms, and monitor LLM cloud infrastructure spending.

### Why Does It Exist?
Traditional operations teams suffer from "dashboard sprawl" — toggling across payment processors (Stripe/Razorpay), scraper servers, resume evaluators, AWS/Groq dashboards, and email marketing software. AIFaGen consolidates these functions into a single reactive workspace. 

### Core Architectural Tenets
1. **Zero Clutter, Total Clarity**: Everything from high-level MRR down to single-candidate ATS scoring is accessible in 2 clicks.
2. **Autonomous Tool Execution**: Administrators can issue spoken voice instructions to execute complex data extraction and document generation tasks.
3. **Instant Responsiveness**: Custom client-side filtering, debounced global search, zero layout shift (CLS), and Vite HMR.
4. **Resilient Failovers**: Multi-model LLM fallback (Groq &rarr; OpenRouter) and dual email transport (Brevo REST API v3 &rarr; Direct SMTP fallback).

---

## 2. High-Impact Highlights: AI Co-Pilot & Voice Agent

The two flagship AI systems in this application eliminate manual clicking, searching, and administrative overhead.

```
                           ┌────────────────────────────┐
                           │      ADMINISTRATOR         │
                           └──────────────┬─────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
       [Natural Spoken Speech]                        [Text Queries & Commands]
                  │                                               │
                  ▼                                               ▼
     ┌────────────────────────┐                      ┌────────────────────────┐
     │   AI Voice Agent       │                      │   Executive AI Copilot │
     │ (Web Speech Engine)    │                      │  (Floating Reactive UI)│
     └────────────┬───────────┘                      └────────────┬───────────┘
                  │                                               │
                  ▼                                               ▼
   ┌─────────────────────────────┐                 ┌─────────────────────────────┐
   │ Fast Groq / OpenRouter LLM  │                 │ Live Enterprise Datasets    │
   │ Action & Intent Classifier  │                 │ Injected System Prompt      │
   └──────────────┬──────────────┘                 └──────────────┬──────────────┘
                  │                                               │
      ┌───────────┴───────────┐                                   │
      ▼                       ▼                                   ▼
 [UI Navigation &     [Automated Tool:                   [Instant Analytics &
  System Toggles]      SEND_EMAIL]                        Actionable Intelligence]
                              │
                              ▼
               ┌─────────────────────────────┐
               │ Data Synthesis Engine       │
               │ (Query 8 JS Data Registries)│
               └──────────────┬──────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
       [HTML Email Generator]        [Binary Documents]
       • Corporate Navy Header       • AutoTable PDF
       • Metric Stat Badges          • UTF-8 BOM CSV
       • Tabular Data Rows           (jsPDF / Excel)
               │                             │
               └──────────────┬──────────────┘
                              │
                              ▼
               ┌─────────────────────────────┐
               │ Brevo API v3 Dispatch Proxy │
               │ (Automatic SMTP Fallback)   │
               └──────────────┬──────────────┘
                              │
                              ▼
                 Delivered to Admin Inbox
```

---

### 2.1 Executive Operations AI Co-Pilot (Chatbot)

Located as a floating quick-access trigger at the bottom-right corner of every screen, the **Executive Co-Pilot** provides administrators with instant, deep business intelligence.

#### What It Does:
- Answers complex, cross-cutting analytical queries across the entire platform in real-time.
- Synthesizes information from candidate profiles, financial records, scraper health, team rosters, and audit trails.
- Calculates ad-hoc metrics on the fly (e.g., *"What is our gross revenue this month and what percentage came from Premium candidates?"*).
- Formats outputs cleanly into markdown bullet points, tables, and bold action items.

#### Why It Is There:
Manually comparing candidate interview scores against job requirements or auditing payment histories requires navigating multiple tabs, applying multiple filters, and manually cross-referencing records. The Chatbot eliminates this friction by maintaining real-time awareness of all platform state.

#### Architectural Highlights:
1. **Dynamic Multi-Provider Fallback**:
   - Primary: **Groq Llama-3.3-70B-Versatile** (delivering answers in under 450ms).
   - Secondary Fallback: **OpenRouter API** with automatic cascading:
     - `meta-llama/llama-3.3-70b-instruct:free`
     - `mistralai/mistral-small-3-instruct-2409`
     - `google/gemini-2.0-flash-exp`
2. **Context-Infused Prompting**:
   The Co-Pilot injects fresh, structured snapshots from:
   - `usersData.js` (Candidates, placement statuses, ATS scores)
   - `paymentsData.js` (Transactions, refunds, billing cycles)
   - `jobsData.js` & `internalJobsData.js` (Active open requisitions)
   - `jobSourcesData.js` (Crawler telemetry and scraper uptimes)
   - `aiUsageData.js` (Token spending and provider distribution)
   - `interviewsData.js` (Evaluation scorecards and mentor notes)
3. **Strict Platform Security Guardrails**:
   Hardened system prompts ensure that out-of-scope queries (general trivia, recipes, unrelated small-talk) are politely rejected with:
   > *"This is out of my context. I can help you with platform-related questions about AiFAGen."*

---

### 2.2 Autonomous AI Voice Agent & Mail Dispatch Tool

The **AI Voice Agent** is a hands-free executive assistant accessible via the microphone trigger on the navigation bar.

#### What It Does:
1. **Hands-Free Navigation**: Speak commands like:
   - *"Take me to candidate roster"* &rarr; Instantly navigates to `/users`.
   - *"Show me revenue graph"* &rarr; Navigates to `/dashboard`.
   - *"Open interview schedule"* &rarr; Navigates to `/interviews`.
2. **Hands-Free UI Controls**:
   - *"Switch to dark mode"* or *"Toggle light theme"* &rarr; Toggles theme without touching the keyboard.
   - *"Filter for backend jobs"* &rarr; Populates search filters automatically.
3. **Universal Email Report Tool (`SEND_EMAIL`)**:
   Speak natural prompts like:
   - *"Mail me the last 7 days interview reports to rohith.p@aifagenlabs.com"*
   - *"Send the candidate ATS roster and revenue report to my mail operations@aifagen.com"*
   - *"Mail crawler health and failed jobs to support@aifagen.com"*

#### Autonomous End-to-End Mail Dispatch Workflow:
When an email request is detected:
1. **Intent & Recipient Parsing**: The LLM extracts the target email address and the specific subject domain.
2. **Universal Data Extraction**: [mailService.js](file:///d:/aifagen%20dashboard%20project-3/aifagen-dashboard/src/services/mailService.js) inspects the domain and extracts live records from the corresponding dataset.
   - If no relevant data exists, it cleanly alerts the user without sending blank emails.
3. **Responsive HTML Template Generation**:
   Assembles an email with:
   - Corporate AIFaGen navy blue header with brand badge.
   - Live KPI metric blocks with growth badges and currency format.
   - Clean tabular rows (styled for mobile and desktop email clients).
   - Official company footer with registered address, CIN number, and contact info.
4. **Dual Downloadable Attachments**:
   - **Excel-Compatible CSV**: Formatted with UTF-8 BOM encoding for direct opening in Microsoft Excel and Google Sheets.
   - **Executive PDF Document**: Rendered client-side via `jsPDF` and `jspdf-autotable` with page numbers, timestamped headers, auto-wrapping tables, and confidential enterprise footers.
5. **Secure Cloud Dispatch**:
   Dispatches through Brevo REST API v3 via the secure Vite middleware proxy (`/api/send-email`), falling back to direct Brevo SMTP if the proxy is unavailable.
6. **Voice Audio Confirmation**: The voice agent speaks back:
   > *"Report successfully dispatched to [recipient] with PDF and CSV attachments."*

---

### 2.3 Time-Saving Impact Matrix

| Administrative Task | Traditional Manual Process | AIFaGen AI Automation | Time Saved |
| :--- | :--- | :--- | :--- |
| **Weekly Interview Results Report** | Open Interviews page &rarr; Filter dates &rarr; Export raw data &rarr; Clean in Excel &rarr; Draft email &rarr; Attach file &rarr; Send | Click Mic &rarr; *"Mail last 7 days interview results to team@company.com"* | **~15 minutes &rarr; 4 seconds** |
| **Candidate ATS Status Check** | Navigate to Users &rarr; Search candidate &rarr; Open drawer &rarr; Read ATS history &rarr; Calculate status | Ask Chatbot: *"What is Deepa Nair's ATS score and visa readiness?"* | **~3 minutes &rarr; 2 seconds** |
| **Crawler Telemetry Audit** | Open Scrapers page &rarr; Check each source (LinkedIn, Naukri, Indeed) &rarr; Identify failed crawlers | Ask Chatbot: *"Which job crawlers are failing today?"* | **~5 minutes &rarr; 2 seconds** |
| **Subscription Expiry Follow-up** | Open Dashboard &rarr; Scroll to Expiring Plans &rarr; Copy emails &rarr; Send individual reminders | Voice: *"Send expiring subscriptions digest to finance@company.com"* | **~20 minutes &rarr; 5 seconds** |

---

## 3. Comprehensive Feature Tour & Minute Details

### 3.1 Authentication & Security (`/login`)

The sign-in interface protects operational access with local persistence and role authorization.

- **Split-Card Layout**: Modern visual presentation with brand hero showcase on the left and interactive login form on the right.
- **Quick Persona Switcher**: Pre-configured one-click credentials for testing different administrative roles:
  - Lead Admin: `rohith.p@aifagenlabs.com` (Full access to settings, team management, billing, and crawlers).
  - Operations Staff: `operations@aifagenlabs.com` (Access to candidate roster, job approvals, and interviews).
- **Session Continuity**: Stores active credentials in `localStorage` under `aifagen-admin-session` with automatic session validation on app mount.
- **Support & Privacy Modals**: Integrated modal dialogues for internal IT support contact and enterprise privacy compliance.

---

### 3.2 Executive Command Desk (`/dashboard`)

The command center providing immediate visibility into core business operations.

- **Live Telemetry Banner**: Displays real-time update timestamp with a blinking heartbeat dot.
- **Attention Alert Banner**: Highlights pressing business events requiring urgent admin intervention (e.g., failed Naukri crawlers, expiring high-value subscriptions). Features a direct action button with toast feedback.
- **4 Key Stat Cards**:
  1. **Total Candidates**: 12,482 candidates (+12.5% vs previous 30 days) with sparkline.
  2. **Paying Users**: 3,842 active subscribers (+6.1% vs previous 30 days) with sparkline.
  3. **Paid Conversion Rate**: 30.8% of candidates subscribed to premium mentorship.
  4. **Monthly Recurring Revenue (MRR)**: ₹28,432.50 (+12.4% vs previous 30 days).
- **Expiring Plans Table**: Displays candidates whose subscriptions expire within 5 to 14 days, complete with urgency badges and a one-click manual renewal trigger.
- **Job Source Crawler Status Table**: Live monitoring of web ingestion scrapers (LinkedIn, Naukri, Indeed, Glassdoor, Monster), displaying last crawl time, next scheduled run, and 24h job count.
- **Admin Activity Feed**: Audit stream tracking internal staff actions (plan modifications, refunds, crawler updates, staff role changes) with timestamping and color-coded tags.

---

### 3.3 Candidate Roster & ATS Placement (`/users`)

The core database of tech job seekers utilizing AIFaGen Labs for reverse recruiting and AI interview prep.

- **Candidate Records**: Displays name, contact email, phone, location, target role, ATS resume score, visa eligibility, and subscription plan.
- **Multi-Filter Toolbar**: Filter by subscription plan (All, Premium, Basic, Free), placement readiness, and global keyword search.
- **User Details Slide-Out Drawer**:
  - Deep-dive candidate profile with ATS resume score breakdown (Keyword Match, Formatting, Experience Impact).
  - Target tech stack tags (React, Node.js, Python, AWS, Kubernetes).
  - Visa status (US Citizen, Green Card, H-1B, STEM OPT).
  - Interactive Plan Modifier: Upgrade or downgrade plans directly with real-time UI updates.
  - Candidate Actions: Suspend account, trigger resume re-parse, or send custom email notification.
- **Bulk Action Bar**: Floating bottom bar triggered upon selecting candidate checkboxes:
  - Bulk plan upgrade (e.g., promote selected candidates to Premium).
  - Bulk export to CSV.
  - Bulk archive/delete with confirmation safeguard.

---

### 3.4 Billing, Transactions & Plan Tiers (`/payments`, `/plans`)

Financial accounting and subscription lifecycle management.

- **Transaction Ledger**: Historical billing records with invoice IDs, transaction timestamps, candidate names, amounts in INR (₹), payment gateways (Razorpay, Stripe), and status pills (Success, Pending, Failed, Refunded).
- **Payment Details Drawer**: Detailed view showing gateway transaction IDs, payment methods (UPI, Credit Card, NetBanking), card brand, and downloadable receipt generator.
- **Manage Plans View (`/plans`)**:
  - Live tier configuration cards: Basic Plan (₹799/mo), Premium Plan (₹1,999/mo), Enterprise Plan (Custom).
  - Feature lists, candidate subscriber counts, and active plan revenue contribution.
  - **Plan Modal (`PlanModal`)**: Interactive modal to create new plans or modify existing features, pricing, trial periods, and public visibility.

---

### 3.5 Job Board, Internal Openings & Crawler Engine (`/jobs`)

A unified multi-tier employment marketplace.

- **Tab 1: All Crawled Jobs**:
  - 15,000+ tech job postings aggregated from LinkedIn, Indeed, Naukri, Monster, and Glassdoor.
  - Filter by work mode (Remote, Hybrid, On-site), experience level (Entry, Mid, Senior, Lead), and employment type.
  - Quick action: View original application link, view scraped job descriptions, and assess applicant match score.
- **Tab 2: Internal Openings (`/jobs/internal`)**:
  - Dedicated board for internal jobs posted directly by AIFaGen Labs staff (e.g., Senior Technical Mentors, Reverse Recruiters, AI Prompt Engineers).
  - Post New Job Modal: Add internal job title, department, salary bracket, required tech stack, and application workflow.
- **Tab 3: Job Sources Telemetry (`/jobs/sources`)**:
  - Telemetry board showing crawler health status (Healthy, Stalled, Failed, Rate-Limited).
  - Scraper configuration: Run interval, proxy rotation status, last HTTP response code, and manual "Force Run Now" button.

---

### 3.6 AI Technical Interview Proctoring (`/interviews`)

End-to-end technical evaluation and mentorship pipeline.

- **Interview Schedule Board**: Overview of scheduled, active, and completed technical mock interviews.
- **Candidate Scorecard Breakdown**:
  - **Coding Proficiency**: Data structures, algorithmic efficiency, syntax accuracy.
  - **System Design Score**: Architecture scalability, trade-off analysis.
  - **Communication & Problem Solving**: Thought articulation, behavioral evaluation.
- **Interview Details Drawer**:
  - Access question-by-question candidate code replays.
  - Transcript insights generated by the AI proctor.
  - Direct hire/mentor recommendations with confidence percentage.

---

### 3.7 LLM Token & Cost Observability (`/ai-usage`)

Infrastructure telemetry tracking API costs and token utilization across AI features.

- **Feature-Level Cost Distribution**:
  - Mock Interview Simulator (token consumption & audio synthesis cost).
  - Resume ATS Analyzer (context window usage & parsing latency).
  - Autonomous Reverse Recruiter (multi-turn reasoning costs).
  - Chatbot Co-Pilot & Voice Agent router queries.
- **Provider Performance**:
  - Compare latency and cost between Groq Llama-3.3-70B and OpenRouter fallback endpoints.
  - Average TTFT (Time-To-First-Token) benchmarks.
- **Budget Threshold Alerts**: Visual indicators alerting admins when monthly token budgets exceed 80% and 95%.

---

### 3.8 Enterprise BI Reporting Engine (`/reports`)

Business intelligence generator for executive stakeholders.

- **Pre-Configured Report Templates**:
  - Financial & Revenue Growth Report.
  - Candidate Placement & ATS Score Report.
  - Crawler Engine Reliability & Scrape Volume Report.
  - AI System Infrastructure & Token Spend Report.
- **Interactive Report Preview Modal**:
  - Inspect rows and columns in the browser before exporting.
  - One-click export to formatted CSV and styled PDF.

---

### 3.9 Compliance Audit Forensics (`/audit-log`)

Immutable security and operational logging.

- **Activity Timeline**: Every admin action is recorded with:
  - Performing admin's name, email, and role badge.
  - Action category (User, Payment, Internal Job, Crawler, Security).
  - Exact timestamp and relative time (e.g., *"2 hours ago"*).
- **Audit Event Drawer**:
  - Full before/after payload diffs (e.g., Plan upgraded from Basic &rarr; Premium).
  - Origin IP address, user-agent details, and session fingerprint for audit compliance.

---

### 3.10 System Settings & Staff Access Control (`/settings`, `/team-members`)

Platform administration, credential configuration, and team collaboration.

- **Team Members Directory (`/team-members`)**:
  - Manage internal staff profiles (Lead Admin, Recruiter, Billing Specialist, Support Agent).
  - Add new staff members with customized permission scopes.
- **Platform Configuration (`/settings`)**:
  - Corporate details: Company name, CIN registration number, headquarters address, support email.
  - API Credentials Configuration: Update Brevo API key, Groq API key, OpenRouter token, and SMTP credentials.
  - Security Controls: Two-Factor Authentication (2FA) toggles, session timeout duration, IP whitelist controls.
  - Theme Settings: Persistent dark mode and light mode preferences.

---

## 4. Interactive Revenue Trend Graph Engine

Located on the Executive Dashboard, the **Revenue Trend Graph** provides interactive visualization of subscription performance.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Revenue trend                                                         │
│  Subscription revenue and transaction volume across the selected period │
│                                                                        │
│  [Revenue | Sign-ups | Paying Users]   [7D | 30D | 90D | 1Y]  [Daily ▾]│
├────────────────────────────────────────────────────────────────────────┤
│  ₹40,180.00  +15.2%                  Period Total: ₹7,54,320           │
│  Wednesday, Oct 15, 2026             Avg/Day: ₹25,144                  │
│                                      Period Peak: ₹40,180 (Oct 15)     │
├────────────────────────────────────────────────────────────────────────┤
│  ₹50k ┼  -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --   │
│       │                                                    ╭─╮         │
│  ₹35k ┼  -- -- -- -- -- -- -- -- -- -- -- -- ╭─╮          │ │         │
│       │                              ╭─╮    │ │    ╭─╮   │ │         │
│  ₹20k ┼  -- -- -- -- ╭─╮             │ │    │ │    │ │   │ │         │
│       │             │ │    ╭─╮       │ │    │ │    │ │   │ │         │
│   ₹0k ┴─────────────┴─┴────┴─┴───────┴─┴────┴─┴────┴─┴───┴─┴─────────  │
│         Oct 9      Oct 10  Oct 11   Oct 12 Oct 13 Oct 14 Oct 15       │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Technical Capabilities:
1. **Dynamic Datasets Across 100% of the Canvas**:
   Full datasets across all timeframes eliminate empty canvas spaces:
   - **`7D`**: 7 daily records (Oct 9 – Oct 15).
   - **`30D`**: 30 daily records (Sep 16 – Oct 15).
   - **`90D`**: 13 weekly aggregated records (Jul 21 – Oct 13).
   - **`1Y`**: 12 monthly records (Jan – Dec 2026) with Q1–Q4 actuals and projected figures.
2. **Metric Tabs**: Switch between **Revenue** (₹), **Sign-ups** (new registrations), and **Paying Users** (active paid subscribers).
3. **Dual View Modes**:
   - **Bar Chart View**: Sized with dynamic column widths (`max-width: 52px` for 7D, `36px` for 14D, `20px` for 30D) to fill the card.
   - **Area Spline Trendline**: Built with mathematical Catmull-Rom/cubic Bézier paths (`d="M... C..."`), glowing SVG drop-shadows, and vertical guide lines.
4. **Smart Granularity Aggregation**:
   - 7D: Daily
   - 30D: Daily & Weekly
   - 90D: Weekly & Monthly
   - 1Y: Monthly & Quarterly
5. **Floating Tooltip (Hover-Only)**:
   Does not obstruct the graph by default. When hovering over any bar or curve point:
   - Displays full date (e.g., `Wednesday, Oct 15, 2026`).
   - Primary metric in large bold typography.
   - Growth pill indicator (`+15.2%` green / `-3.2%` red).
   - Micro-breakdown: Gross Volume (₹), Sign-ups, Paying Users, and Paid Conversion Rate (%).
   - Dynamic boundary clamping prevents the tooltip from overflowing screen edges.

---

## 5. Architecture & Tech Stack

### Core Frontend Stack
- **Framework**: [React 19.2.8](https://react.dev/)
- **Bundler & Dev Server**: [Vite 8.3.4](https://vite.dev/)
- **Routing**: [React Router v7.18.4](https://reactrouter.com/)
- **Styling Architecture**: Vanilla CSS design system with CSS custom properties (`--bg-primary`, `--accent-blue`, etc.), glassmorphic backdrops, and flex/grid responsive layouts.
- **Icons**: [React Icons / Feather Icons (`react-icons/fi`)](https://react-icons.github.io/react-icons/icons/fi/)

### Export & Document Generation
- **Client-Side PDF Engine**: [jsPDF v4.2.1](https://github.com/parallax/jsPDF)
- **Table Auto-Formatting**: [jspdf-autotable v5.0.9](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **Spreadsheet Generation**: Native UTF-8 BOM CSV engine.

### AI & Speech Infrastructure
- **Speech-to-Text**: HTML5 Web Speech Recognition API (`webkitSpeechRecognition`).
- **Text-to-Speech**: SpeechSynthesis API with natural voice selection.
- **Ultra-Fast LLM Inference**: Groq Cloud REST API (`llama-3.3-70b-versatile`).
- **LLM Redundancy**: OpenRouter API (`meta-llama/llama-3.3-70b-instruct:free`, `mistralai/mistral-small-3-instruct-2409`).

### Email Transport
- **Primary Dispatch**: Brevo (formerly Sendinblue) Transactional API v3 via Vite HTTP middleware (`/api/send-email`).
- **Fallback Dispatch**: Direct Brevo SMTP via [Nodemailer v10.1.1](https://nodemailer.com/).

---

## 6. Project Structure

```
aifagen-dashboard/
├── .env                         # Environment variables (API keys, SMTP credentials)
├── .gitignore                   # Git exclusion rules
├── eslint.config.js             # ESLint 9+ flat configuration with React hooks rules
├── index.html                   # HTML entry point with font prefetching & SVG favicon
├── package.json                 # Project dependencies and npm scripts
├── public/                      # Static brand assets
│   ├── aifagenlogo-icon.png     # Brand icon mark (used in split login)
│   ├── aifagenlogo.png          # Full horizontal company logo
│   └── aifagenlogo.svg          # Vector logo for browser tabs
├── src/
│   ├── App.css                  # Global layouts, toast alerts, theme styles
│   ├── App.jsx                  # Main router, state providers, sidebar/header layout
│   ├── index.css                # Base CSS resets and typography imports
│   ├── main.jsx                 # React root mount
│   ├── components/              # 22 modular interface components
│   │   ├── AIFeatureDetailsDrawer/
│   │   ├── AdminActivityFeed/
│   │   ├── AttentionBanner/
│   │   ├── AuditEventDetailsDrawer/
│   │   ├── BulkActionBar/
│   │   ├── Chatbot/             # AI Executive Co-Pilot floating assistant
│   │   ├── ExpiringPlansTable/
│   │   ├── Header/              # Search bar, date range picker, voice trigger
│   │   ├── InterviewDetailsDrawer/
│   │   ├── JobDetailsDrawer/
│   │   ├── JobSourceDetailsDrawer/
│   │   ├── JobSourceStatusTable/
│   │   ├── ManagePlansView/     # Subscription pricing tiers & plan editor
│   │   ├── MemberDetailsDrawer/
│   │   ├── PaymentDetailsDrawer/
│   │   ├── PlanModal/           # Create/edit plan modal
│   │   ├── RevenueChart/        # Dynamic multi-metric trend graph
│   │   ├── Sidebar/             # Collapsible navigation drawer
│   │   ├── StatCard/            # Top KPI metrics with mini sparklines
│   │   ├── UserDetailsDrawer/   # Candidate ATS score drawer
│   │   ├── UsersByPlan/         # Subscription distribution widget
│   │   └── VoiceAgent/          # Voice control modal & mail dispatch trigger
│   ├── data/                    # Structured enterprise datasets
│   │   ├── adminsData.js
│   │   ├── aiUsageData.js
│   │   ├── auditLogData.js
│   │   ├── dashboardData.js     # MRR, multi-period revenue bars, job sources
│   │   ├── globalSearch.js      # Omnisearch across candidates, payments, jobs
│   │   ├── internalJobsData.js
│   │   ├── interviewsData.js
│   │   ├── jobSourcesData.js
│   │   ├── jobsData.js
│   │   ├── paymentsData.js
│   │   ├── plansData.js
│   │   ├── reportsData.js
│   │   ├── servicesData.js
│   │   ├── settingsData.js
│   │   ├── sidebarMetadata.js   # Voice routing aliases & navigation maps
│   │   ├── teamData.js
│   │   └── usersData.js
│   ├── pages/                   # 13 full application pages
│   │   ├── AIUsage.jsx & .css
│   │   ├── AuditLog.jsx & .css
│   │   ├── Dashboard.jsx & .css
│   │   ├── InternalJobs.jsx & .css
│   │   ├── Interviews.jsx & .css
│   │   ├── JobSources.jsx & .css
│   │   ├── Jobs.jsx & .css
│   │   ├── Login.jsx & .css
│   │   ├── Payments.jsx & .css
│   │   ├── Reports.jsx & .css
│   │   ├── Settings.jsx & .css
│   │   ├── TeamMembers.jsx & .css
│   │   └── Users.jsx & .css
│   └── services/                # Background business logic & API services
│       ├── chatbotService.js    # Groq / OpenRouter AI Co-Pilot logic
│       ├── mailService.js       # Universal data analyzer, HTML, PDF & CSV generator
│       └── voiceAgentService.js # Voice intent classifier & tool dispatcher
└── vite.config.js               # Vite config + Brevo REST proxy middleware
```

---

## 7. Environment Configuration (`.env`)

Create a `.env` file in the project root directory with the following variables:

```env
# 1. OpenRouter API Key (Used as fallback for Chatbot and Voice routing)
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 2. Groq Cloud API Key (Primary ultra-fast inference for Chatbot & Voice routing)
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 3. Brevo (Sendinblue) Transactional API Key (v3) for Mail Dispatch
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 4. Brevo SMTP Credentials (Used as direct fallback transport)
MAIL_USERNAME=your_brevo_smtp_username@smtp-brevo.com
MAIL_PASSWORD=xsmtpsib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BREVO_SENDER_EMAIL=support@aifagenlabs.com
```

---

## 8. Installation & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.x or 20.x recommended)
- `npm` (Version 9+ or 10+)
- Google Chrome, Microsoft Edge, or any Chromium browser (for Web Speech API voice support)

### Step-by-Step Setup

1. **Navigate to the Project Directory**:
   ```bash
   cd "d:/aifagen dashboard project-3/aifagen-dashboard"
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Keys**:
   Ensure `.env` contains your Brevo, Groq, and OpenRouter API credentials as described in [Section 7](#7-environment-configuration-env).

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:5173/` (or `http://localhost:5174/` if 5173 is in use).

5. **Access the Portal**:
   - Open your browser at `http://localhost:5174/`.
   - Log in with the pre-filled admin credentials:
     - **Email**: `rohith.p@aifagenlabs.com`
     - **Password**: Any password (or click *"Sign in with Rohith P"*).

---

## 9. Production Build & Deployment

### Build the Optimized Production Bundle:
```bash
npm run build
```
This runs Vite's build pipeline, producing a minified, tree-shaken, and optimized production bundle in the `/dist` directory.

### Preview the Production Build:
```bash
npm run preview
```

### Run Static Code Quality Checks:
```bash
npx eslint src --quiet
```
Ensures zero syntax, purity, or React hooks errors across the codebase.

---

## 10. Compliance & Corporate Identity

- **Legal Entity**: **AIFAGEN INTELLIGENCE PRIVATE LIMITED**
- **Operating Brand**: **AIFaGen Labs**
- **Corporate Identification Number (CIN)**: `U72900TG2026PTC123456`
- **Headquarters**: Siddipet HQ, Telangana, India · PIN 502103
- **Official Enterprise Support**: `support@aifagenlabs.com`
- **Lead Administrator Contact**: `rohith.p@aifagenlabs.com`

---

*© 2026 AIFAGEN INTELLIGENCE PRIVATE LIMITED. All rights reserved. Confidential Enterprise Operations System.*
