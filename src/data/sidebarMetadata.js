/**
 * Comprehensive Sidebar Navigation & Actionable Controls Metadata
 * 
 * Every entry corresponds to an actionable element on the sidebar with a unique ID.
 * This metadata is provided directly to the LLM so it can intelligently map user speech transcripts
 * to the exact actionable element and return structured JSON actions for the executor.
 */

export const sidebarMetadata = [
  // GROUP 1: COMMAND DESK
  {
    id: "sidebar-nav-dashboard",
    label: "Executive Dashboard",
    type: "NAVIGATE",
    path: "/dashboard",
    category: "COMMAND DESK",
    description:
      "Main administrative overview desk displaying live platform KPIs: Monthly Recurring Revenue (MRR), total registered users, active subscriptions, and urgent operational alerts that require administrative review.",
    keywords: [
      "dashboard",
      "executive dashboard",
      "home",
      "overview",
      "command desk",
      "kpi",
      "kpis",
      "metrics",
      "main page",
      "stats",
      "revenue summary"
    ]
  },

  // GROUP 2: CANDIDATES & REVENUE
  {
    id: "sidebar-nav-candidate-roster",
    label: "Candidate Roster",
    type: "NAVIGATE",
    path: "/users",
    category: "CANDIDATES & REVENUE",
    description:
      "Directory of enrolled candidates and US tech job seekers. Shows ATS resume scores, visa categories (H-1B, OPT, CPT, Green Card, US Citizen), subscription plans (Career Accelerator, Executive Elite), account statuses, and placement readiness.",
    keywords: [
      "candidates",
      "candidate roster",
      "users",
      "job seekers",
      "applicants",
      "talent pool",
      "students",
      "resumes",
      "ats scores",
      "visa types"
    ]
  },
  {
    id: "sidebar-nav-billing-invoices",
    label: "Billing & Invoices",
    type: "NAVIGATE",
    path: "/payments",
    category: "CANDIDATES & REVENUE",
    description:
      "Financial ledger and transactions. Tracks candidate retainers, subscription billings, successful versus failed Stripe/Razorpay payments, invoice receipts, gross revenue collections, and payment reminders.",
    keywords: [
      "billing",
      "invoices",
      "payments",
      "billing and invoices",
      "transactions",
      "retainers",
      "revenue",
      "subscriptions",
      "failed payments",
      "receipts",
      "financials"
    ]
  },

  // GROUP 3: JOB MARKET & PIPELINE
  {
    id: "sidebar-nav-job-pipeline",
    label: "Job Pipeline",
    type: "NAVIGATE",
    path: "/jobs/all",
    category: "JOB MARKET & PIPELINE",
    description:
      "Job market pipeline root aggregator. Groups all job positions, public external market feeds, internal direct company listings, and automated crawler source telemetry.",
    keywords: [
      "jobs",
      "job pipeline",
      "all jobs",
      "positions",
      "vacancies",
      "job board",
      "openings"
    ]
  },
  {
    id: "sidebar-nav-jobs-all",
    label: "All Positions",
    type: "NAVIGATE",
    path: "/jobs/all",
    category: "JOB MARKET & PIPELINE",
    description:
      "Unified list of all tech job postings across both external crawled job boards and internal direct client opportunities.",
    keywords: [
      "all positions",
      "all job postings",
      "everything open",
      "every job",
      "total jobs"
    ]
  },
  {
    id: "sidebar-nav-jobs-market",
    label: "Market Feeds",
    type: "NAVIGATE",
    path: "/jobs/public",
    category: "JOB MARKET & PIPELINE",
    description:
      "External public market jobs scraped live from external portals such as Indeed, LinkedIn, Dice, and Glassdoor across the United States tech sector.",
    keywords: [
      "market feeds",
      "public jobs",
      "external jobs",
      "scraped jobs",
      "indeed jobs",
      "linkedin jobs",
      "dice jobs",
      "market positions"
    ]
  },
  {
    id: "sidebar-nav-jobs-internal",
    label: "Internal Postings",
    type: "NAVIGATE",
    path: "/jobs/internal",
    category: "JOB MARKET & PIPELINE",
    description:
      "Exclusive in-house client tech openings, direct company partnerships, and privately listed career roles managed directly by AiFAGen Labs.",
    keywords: [
      "internal postings",
      "internal jobs",
      "exclusive jobs",
      "direct clients",
      "company postings",
      "private jobs",
      "in house positions"
    ]
  },
  {
    id: "sidebar-nav-jobs-crawlers",
    label: "Crawler Sources",
    type: "NAVIGATE",
    path: "/jobs/sources",
    category: "JOB MARKET & PIPELINE",
    description:
      "Monitoring and health telemetry for automated job scraping crawlers (Naukri, Indeed, Glassdoor, Dice). Displays fetch frequency, spider status, error rates, and last synced timestamps.",
    keywords: [
      "crawler sources",
      "crawlers",
      "scrapers",
      "spiders",
      "job sources",
      "scraper health",
      "crawler telemetry",
      "scraping status"
    ]
  },

  // GROUP 4: TALENT ACCELERATION
  {
    id: "sidebar-nav-interview-pipeline",
    label: "Interview Pipeline",
    type: "NAVIGATE",
    path: "/interviews",
    category: "TALENT ACCELERATION",
    description:
      "Interview coordination and pipeline management. Tracks mock interviews, mentor prep sessions, screening calls, technical rounds, and final client interviews with Google Meet/Zoom calendar integrations.",
    keywords: [
      "interviews",
      "interview pipeline",
      "mock interviews",
      "screenings",
      "client rounds",
      "interview schedule",
      "mentor calls",
      "interview prep"
    ]
  },
  {
    id: "sidebar-nav-delivery-operations",
    label: "Delivery Operations",
    type: "NAVIGATE",
    path: "/team-members",
    category: "TALENT ACCELERATION",
    description:
      "Operational staff directory based at the Siddipet delivery center. Lists career mentors, reverse recruiters, delivery managers, team capacity, and active candidate caseloads.",
    keywords: [
      "delivery operations",
      "team",
      "team members",
      "staff",
      "siddipet team",
      "mentors",
      "reverse recruiters",
      "recruiters",
      "delivery hub",
      "employees"
    ]
  },
  {
    id: "sidebar-nav-placement-analytics",
    label: "Placement Analytics",
    type: "NAVIGATE",
    path: "/reports",
    category: "TALENT ACCELERATION",
    description:
      "Data intelligence on candidate placement speed, time-to-hire, funnel conversion rates, salary packages achieved, and delivery team placement efficiency reports.",
    keywords: [
      "placement analytics",
      "reports",
      "analytics",
      "placement velocity",
      "conversion funnel",
      "intelligence",
      "performance reports",
      "hiring analytics"
    ]
  },

  // GROUP 5: SYSTEM & COMPLIANCE
  {
    id: "sidebar-nav-ai-engine",
    label: "AI Engine & Quotas",
    type: "NAVIGATE",
    path: "/ai-usage",
    category: "SYSTEM & COMPLIANCE",
    description:
      "AI infrastructure telemetry. Tracks OpenAI/OpenRouter model token usage, ATS scoring compute costs, chatbot query spend, API rate limits, and quota balance.",
    keywords: [
      "ai engine",
      "ai usage",
      "quotas",
      "ai costs",
      "token consumption",
      "gpt usage",
      "api keys",
      "model spend",
      "ai spend"
    ]
  },
  {
    id: "sidebar-nav-audit-compliance",
    label: "Audit & Compliance",
    type: "NAVIGATE",
    path: "/audit-log",
    category: "SYSTEM & COMPLIANCE",
    description:
      "Immutable compliance activity trail and security log. Records all administrative actions, data exports, login attempts, user profile updates, and role modifications with IP addresses and timestamps.",
    keywords: [
      "audit log",
      "audit and compliance",
      "compliance",
      "audit trail",
      "security logs",
      "activity logs",
      "system history",
      "event trail"
    ]
  },
  {
    id: "sidebar-nav-platform-settings",
    label: "Platform Settings",
    type: "NAVIGATE",
    path: "/settings",
    category: "SYSTEM & COMPLIANCE",
    description:
      "Administrative system configuration. Manage admin roster accounts, invite administrators, configure security policies, branding logos, session timeout limits, and email notification alerts.",
    keywords: [
      "platform settings",
      "settings",
      "configuration",
      "admin users",
      "administrators",
      "security policy",
      "preferences",
      "system settings"
    ]
  },

  // GROUP 6: FOOTER ACTIONABLE CONTROLS
  {
    id: "sidebar-ctrl-theme-toggle",
    label: "Toggle Theme",
    type: "CONTROL",
    path: null,
    category: "SYSTEM CONTROLS",
    description:
      "Toggles the platform visual appearance between Dark Mode and Light Mode.",
    keywords: [
      "toggle theme",
      "theme toggle",
      "switch theme",
      "dark mode",
      "light mode",
      "turn on dark mode",
      "turn on light mode",
      "dark theme",
      "light theme",
      "change appearance"
    ]
  },
  {
    id: "sidebar-ctrl-sign-out",
    label: "Sign Out",
    type: "CONTROL",
    path: null,
    category: "SYSTEM CONTROLS",
    description:
      "Immediately terminates the current administrator session, clears security credentials, and redirects to the login screen.",
    keywords: [
      "sign out",
      "log out",
      "logout",
      "signout",
      "exit portal",
      "exit session",
      "terminate session",
      "leave platform"
    ]
  },
  {
    id: "sidebar-ctrl-collapse",
    label: "Toggle Sidebar Collapse",
    type: "CONTROL",
    path: null,
    category: "SYSTEM CONTROLS",
    description:
      "Expands or collapses the sidebar to maximize screen workspace area.",
    keywords: [
      "collapse sidebar",
      "expand sidebar",
      "hide sidebar",
      "minimize sidebar",
      "maximize workspace",
      "toggle sidebar"
    ]
  }
];

export default sidebarMetadata;
