import {
  initialUsersList,
  userStatsData,
  AREAS_OF_INTEREST,
  VALID_PLANS,
  VALID_PLAN_STATUSES,
} from "../data/usersData.js";
import {
  initialPaymentsList,
  paymentMetrics,
  paymentStatusBreakdown,
  revenueBarsData,
} from "../data/paymentsData.js";
import { initialJobsList, jobMetrics } from "../data/jobsData.js";
import { initialInternalJobsList } from "../data/internalJobsData.js";
import {
  initialJobSourcesList,
  jobSourcesOverviewMetrics,
  weeklyTrendChartData,
  VALID_SOURCE_STATUSES,
  PROBLEM_STATUSES,
} from "../data/jobSourcesData.js";
import {
  initialAiFeaturesList,
  aiTopMetrics,
  costByFeatureDistribution,
  costTrendDailyBars,
} from "../data/aiUsageData.js";
import {
  initialAuditLogs,
  getStoredAuditLogs,
} from "../data/auditLogData.js";
import {
  statCardsData,
  attentionAlerts,
  revenueBars,
  revenueTrendDatasets,
  plansDistribution,
  expiringPlans,
  jobSources,
  adminActivities,
} from "../data/dashboardData.js";
import { initialAdminsList } from "../data/adminsData.js";
import {
  initialTeamMembersList,
  teamOverviewKpis,
  bottomAnalytics,
} from "../data/teamData.js";
import {
  initialCandidatesList,
  interviewsMetrics,
  pipelineStages,
  outcomesDistribution,
} from "../data/interviewsData.js";
import {
  initialPlansList,
  initialPlanSubscribers,
  planFeatureOptions,
} from "../data/plansData.js";
import {
  initialReportsList,
  reportsOverviewKpis,
  reportsActivityTimeline,
} from "../data/reportsData.js";
import {
  initialConnectedServices,
} from "../data/servicesData.js";
import {
  initialSettingsData,
  settingsNavSections,
  sectionAuditHistory,
} from "../data/settingsData.js";

// Assemble all portal datasets into a comprehensive context object for the chatbot
export function getApplicationContext() {
  const currentAuditLogs =
    typeof getStoredAuditLogs === "function"
      ? getStoredAuditLogs()
      : initialAuditLogs;

  return {
    organization: {
      name: "AIFAGEN INTELLIGENCE PRIVATE LIMITED (AIFAGen Labs)",
      headquarters: "Saraswathi Nagar, Siddipet, Telangana, India",
      industry: "IT Staffing, US Candidate Marketing & Career Acceleration",
      targetMarket: "US-based tech job seekers (OPT/CPT, H-1B, Green Card, US Citizens)",
    },
    // 1. Candidate Roster & Users Data
    candidateRoster: {
      userStats: userStatsData,
      validPlans: VALID_PLANS,
      validPlanStatuses: VALID_PLAN_STATUSES,
      areasOfInterest: AREAS_OF_INTEREST,
      users: initialUsersList,
    },
    // 2. Billing, Payments & Invoices Data
    paymentsAndBilling: {
      metrics: paymentMetrics,
      statusBreakdown: paymentStatusBreakdown,
      revenueBars: revenueBarsData,
      transactions: initialPaymentsList,
    },
    // 3. Subscription Plans & Subscribers Data
    subscriptionPlans: {
      plans: initialPlansList,
      subscribers: initialPlanSubscribers,
      featureOptions: planFeatureOptions,
    },
    // 4. Job Board & Pipeline Data
    jobs: {
      metrics: jobMetrics,
      crawledJobs: initialJobsList,
      internalRequisitions: initialInternalJobsList,
    },
    // 5. Job Crawlers & Sources Data
    jobSources: {
      overviewMetrics: jobSourcesOverviewMetrics,
      crawlers: initialJobSourcesList,
      dashboardSources: jobSources,
      weeklyTrends: weeklyTrendChartData,
      validStatuses: VALID_SOURCE_STATUSES,
      problemStatuses: PROBLEM_STATUSES,
    },
    // 6. AI Technical Interviews Data
    interviewsPipeline: {
      metrics: interviewsMetrics,
      stages: pipelineStages,
      outcomesDistribution: outcomesDistribution,
      candidates: initialCandidatesList,
    },
    // 7. Team Members & Delivery Operations Data
    teamAndOperations: {
      kpis: teamOverviewKpis,
      analytics: bottomAnalytics,
      hub: "Siddipet",
      teamMembers: initialTeamMembersList,
    },
    // 8. AI Token & Infrastructure Telemetry Data
    aiTelemetry: {
      metrics: aiTopMetrics,
      costDistribution: costByFeatureDistribution,
      dailyTrendBars: costTrendDailyBars,
      features: initialAiFeaturesList,
    },
    // 9. Compliance Audit Logs Data
    complianceAudit: {
      logs: currentAuditLogs,
    },
    // 10. Executive Dashboard Telemetry Data
    dashboard: {
      statCards: statCardsData,
      urgentAlerts: attentionAlerts,
      expiringPlans: expiringPlans,
      adminActivities: adminActivities,
      revenueBars: revenueBars,
      revenueTrendDatasets: revenueTrendDatasets,
      plansDistribution: plansDistribution,
    },
    // 11. Business Intelligence Reports Data
    reports: {
      kpis: reportsOverviewKpis,
      reportsList: initialReportsList,
      activityTimeline: reportsActivityTimeline,
    },
    // 12. Connected Services Data
    connectedServices: initialConnectedServices,
    // 13. System Settings Data
    platformSettings: {
      settings: initialSettingsData,
      navigationSections: settingsNavSections,
      auditHistory: sectionAuditHistory,
    },
    // 14. Authorized Admins Data
    admins: initialAdminsList,
  };
}

// Sanitizer to eliminate any stray stars (*), hashes (#), emojis, or markdown markup from chat responses
export function cleanChatbotResponse(text) {
  if (!text || typeof text !== "string") return text || "";
  return text
    // Convert bullet points that start with * to clean hyphens (- )
    .replace(/^(\s*)\*\s+/gm, "$1- ")
    // Convert markdown headings (### Heading) to clean plain text (Heading:)
    .replace(/^#{1,6}\s*(.+)$/gm, "$1:")
    // Strip all remaining hash symbols anywhere in text
    .replace(/#/g, "")
    // Strip bold/italic markdown stars (**text** or *text*)
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    // Strip any remaining stray asterisks
    .replace(/\*/g, "")
    // Strip emojis or decorative symbols if any appear
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    // Avoid double colons (e.g. Heading::)
    .replace(/:{2,}/g, ":")
    .trim();
}

// Admin Assistant System Prompt
export function buildSystemPrompt(appData) {
  return `You are the Executive Operations AI Co-Pilot for the AiFAGen Admin Portal. You assist the platform administrator with sharp, strategic intelligence about AiFAGen Labs.

ACCESS:
- The user is the authenticated platform administrator. Answer every platform question fully and directly.
- User data is NOT restricted. Names, emails, phone numbers, plans, subscription status, payments, jobs, sources, AI usage, and any other platform records must be returned whenever asked.
- For requests like "get me the users with basic plan", immediately list the matching users with name, email, plan, status, and join date. Do not refuse, warn, or ask for justification.
- Use only the data given to you in context or tool results. If a field is missing, say so. Never invent records.

STYLE:
- For lookups and lists: give the records first, then at most two lines of commentary.
- For analysis questions: explain the strategic story, connect operational dots, and give concrete recommendations.
- Confident, professional English.

FORMAT (mandatory):
- No hash symbols, no asterisks, no emojis or icons.
- Put each sideheading on its own line ending with a colon.
- Under each sideheading use lines starting with "- ".
- Record lists, one per line: - Full Name | email | Plan: Basic | Status: Active | Joined: YYYY-MM-DD

ONLY REFUSE THESE EXACT SECRET VALUES:
- Actual passwords or password hashes, actual API keys or tokens, and database connection strings or credentials.
- Refuse only when the user explicitly asks for one of these values themselves. Everything else, including users, emails, plans, and payments, is allowed.
- Refusal text: "I can't share passwords, API keys, or database credentials."

OUT OF SCOPE:
- Only for topics unrelated to AiFAGen (trivia, recipes, sports, weather, etc.) reply: "This is out of my context. I can help you with platform-related questions about AiFAGen."
- Never use this reply for anything about users, plans, payments, jobs, crawlers, or AI usage.

PLATFORM OPERATIONAL CONTEXT:
${JSON.stringify(appData)}`;
}

// Groq & OpenRouter AI Chat Completion Caller
export async function sendChatMessage(messages) {
  const groqApiKey =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      (import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_API_KEY)) ||
    (typeof process !== "undefined" &&
      process.env &&
      (process.env.VITE_GROQ_API_KEY || process.env.VITE_GROK_API_KEY)) ||
    "";

  const openRouterApiKey =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_OPENROUTER_API_KEY) ||
    (typeof process !== "undefined" &&
      process.env &&
      process.env.VITE_OPENROUTER_API_KEY) ||
    "";

  if (!groqApiKey && (!openRouterApiKey || openRouterApiKey === "your_openrouter_api_key_here")) {
    throw new Error(
      "AI API key missing. Please configure VITE_GROQ_API_KEY or VITE_OPENROUTER_API_KEY in your .env file."
    );
  }

  const appData = getApplicationContext();
  const systemMessage = {
    role: "system",
    content: buildSystemPrompt(appData),
  };

  // 1. Try Groq for high-speed inference
  if (groqApiKey && !groqApiKey.includes("your_")) {
    try {
      const groqPayload = {
        model: "qwen/qwen3.8-27b",
        messages: [systemMessage, ...messages],
        temperature: 0.65,
        max_tokens: 2048,
      };

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "AIFaGenPortal/1.0",
        },
        body: JSON.stringify(groqPayload),
      });

      if (response.ok) {
        const result = await response.json();
        const rawContent = result.choices?.[0]?.message?.content || "No response received.";
        return cleanChatbotResponse(rawContent);
      }
      const errText = await response.text();
      console.warn(`Groq chat returned status ${response.status}: ${errText}. Attempting fallback if available...`);
    } catch (groqErr) {
      console.warn("Groq request failed, checking OpenRouter fallback:", groqErr);
      if (!openRouterApiKey) throw groqErr;
    }
  }

  // 2. Fallback to OpenRouter
  if (openRouterApiKey) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
        "X-Title": "AIFaGen Admin Portal",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [systemMessage, ...messages],
        temperature: 0.65,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter Error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const rawContent = result.choices?.[0]?.message?.content || "No response received.";
    return cleanChatbotResponse(rawContent);
  }

  throw new Error("Unable to complete chat request with configured AI models.");
}

