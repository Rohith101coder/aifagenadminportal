import { initialUsersList, userStatsData } from "../data/usersData.js";
import { initialPaymentsList, paymentMetrics, paymentStatusBreakdown } from "../data/paymentsData.js";
import { initialJobsList, jobMetrics } from "../data/jobsData.js";
import { initialInternalJobsList } from "../data/internalJobsData.js";
import { initialJobSourcesList, jobSourcesOverviewMetrics } from "../data/jobSourcesData.js";
import { initialAiFeaturesList, aiTopMetrics, costByFeatureDistribution } from "../data/aiUsageData.js";
import { initialAuditLogs } from "../data/auditLogData.js";
import { statCardsData, attentionAlerts } from "../data/dashboardData.js";
import { initialAdminsList } from "../data/adminsData.js";
import { initialTeamMembersList, teamOverviewKpis } from "../data/teamData.js";
import { initialCandidatesList, interviewsMetrics, pipelineStages } from "../data/interviewsData.js";

// Enterprise PII Masking Helpers to prevent exposure of sensitive personal data
function maskPhone(phone) {
  if (!phone) return "[Protected]";
  const trimmed = String(phone).trim();
  const parts = trimmed.split(" ");
  if (parts.length >= 2) {
    return `${parts[0]} (•••) •••-${trimmed.slice(-4)}`;
  }
  return `•••-•••-${trimmed.slice(-4)}`;
}

function maskEmail(email) {
  if (!email || !String(email).includes("@")) return "[Protected]";
  const [user, domain] = String(email).split("@");
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user.slice(0, 2)}••••@${domain}`;
}

// Assemble sanitized portal datasets into a privacy-safe context object
export function getApplicationContext() {
  return {
    organization: {
      name: "AIFAGEN INTELLIGENCE PRIVATE LIMITED (AIFAGen Labs)",
      headquarters: "Saraswathi Nagar, Siddipet, Telangana, India",
      industry: "IT Staffing, US Candidate Marketing & Career Acceleration",
      targetMarket: "US-based tech job seekers (OPT/CPT, H-1B, Green Card, US Citizens)",
    },
    kpis: statCardsData.map((c) => ({ title: c.title, value: c.value, trend: c.trend || c.change })),
    urgentAlerts: attentionAlerts.map((a) => a.title || a.message),
    candidateRoster: {
      totalSeekers: userStatsData.totalUsers,
      activeSubscribers: userStatsData.activeSubscribers,
      mrr: userStatsData.mrr,
      expiringWithin7Days: userStatsData.expiringWithin7Days,
    },
    finances: {
      mrr: "$48,920.00",
      grossRevenue30d: paymentMetrics.totalGrossRevenue,
      netRevenue30d: paymentMetrics.totalNetRevenue,
      failedPaymentsCount: paymentMetrics.failedPaymentsCount,
      failedPaymentsAmount: paymentMetrics.failedPaymentsAmount,
    },
    jobCrawlers: {
      totalOpenings: jobMetrics.totalOpenings,
      crawlers: initialJobSourcesList.map((s) => ({
        name: s.name,
        status: s.status,
        note: s.note,
        duration: s.duration,
      })),
    },
    interviewsPipeline: {
      summary: interviewsMetrics.map((m) => ({ title: m.title, value: m.value, change: m.change })),
      stages: pipelineStages.map((s) => ({ stage: s.stage, count: s.count })),
    },
    deliveryOperations: {
      headcount: teamOverviewKpis.totalTeamMembers,
      activeMentors: teamOverviewKpis.activeMembers,
      hub: "Siddipet",
      sampleStaff: initialTeamMembersList.slice(0, 5).map((m) => ({ name: m.name, role: m.role, dept: m.department })),
    },
    aiTelemetry: {
      totalTokens: aiTopMetrics.totalTokensConsumed,
      cost30d: aiTopMetrics.totalAiExpenditure,
    },
    complianceAudit: {
      recentLogs: initialAuditLogs.slice(0, 4).map((l) => ({
        date: l.date,
        actor: l.actor,
        eventTitle: l.eventTitle,
        status: l.status,
      })),
    },
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
  return `You are the Executive Operations AI Co-Pilot for the AiFAGen Admin Portal.
You assist the platform administrator with sharp, creative, strategic, and comprehensive intelligence regarding AiFAGen Labs.

ROLE AND ACCESS:
- The person talking to you is the authenticated platform administrator. Treat every platform-related request as authorized.
- Answer all questions about platform data and operations: users, plans and subscriptions, payments and revenue, jobs, job sources and crawlers, AI usage and limits, ATS scoring, candidate matching, system health, and trends.
- Direct data requests must be answered directly with the actual records. Examples: "get me the users on the basic plan with their names and emails", "list failed payments this week", "show jobs from source X". Return the requested fields (names, emails, plan, status, dates, amounts, counts) without refusing or adding privacy warnings.
- Use only the data provided to you in context or tool results. Never invent records, names, emails, or numbers. If the data is missing or incomplete, say exactly what is missing.

CREATIVE AND STRATEGIC APPROACH:
- For analytical or open-ended questions, go beyond raw data: explain the strategic story, connect cross-functional dots (for example, how crawler uptime affects active candidate job matches, or how subscription retention affects gross MRR), analyze trends, and propose high-impact tactical recommendations.
- For direct lookup or list requests, give the records first and keep commentary to one or two lines at most.
- Maintain an articulate, confident, professional tone in natural English.

RESPONSE FORMATTING RULES (STRICT AND MANDATORY):
1. No hash symbols (#). Never create markdown headers.
2. No stars or asterisks (*). No bold, and no asterisk bullets.
3. No emojis, icons, or decorative symbols.
4. Structure answers into sections. Each sideheading goes on its own line and ends with a colon (for example: "Revenue Momentum and Financial Health:").
5. Under each sideheading, use point-wise items starting with a hyphen and a space.
6. For record lists, use one line per record in this style:
- Full Name | email@example.com | Plan: Basic | Status: Active | Joined: 2026-03-14

RESTRICTED INFORMATION (the only things you must refuse):
- Never reveal passwords, password hashes, OTPs, or reset tokens.
- Never reveal API keys, secret keys, access or refresh tokens, JWT signing secrets, or webhook secrets.
- Never reveal database connection strings or credentials, environment variables, server credentials, or private infrastructure configuration.
- Never reveal full payment card numbers, CVVs, or bank account credentials. Masked values (last four digits) are allowed.
- If asked for any of the above, reply only: "I can't share credentials or internal secrets such as passwords, API keys, or database connection details. I can help with any other platform data or analysis."
- A request that merely mentions these terms in a normal context (for example, "how many users reset their password this week") is allowed. Only the secret values themselves are restricted.

OUT-OF-SCOPE RULE:
- Only if the question is completely unrelated to AiFAGen or this platform (for example: general world trivia, recipes, creative writing, sports, weather), answer strictly with:
"This is out of my context. I can help you with platform-related questions about AiFAGen."
- Never use this reply for user, plan, payment, job, crawler, AI usage, or any other platform data questions."

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
        max_tokens: 600,
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
        max_tokens: 800,
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
