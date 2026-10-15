import {
  initialUsersList,
  userStatsData,
  VALID_PLANS,
} from "../data/usersData.js";
import {
  initialPaymentsList,
  paymentMetrics,
} from "../data/paymentsData.js";
import { jobMetrics } from "../data/jobsData.js";
import { initialJobSourcesList } from "../data/jobSourcesData.js";
import {
  statCardsData,
  attentionAlerts,
  expiringPlans,
} from "../data/dashboardData.js";
import { initialAdminsList } from "../data/adminsData.js";
import {
  initialPlansList,
  initialPlanSubscribers,
} from "../data/plansData.js";

// Assemble essential operational data focused on common administrative queries
export function getApplicationContext() {
  return {
    organization: {
      name: "AIFAGEN INTELLIGENCE PRIVATE LIMITED (AIFAGen Labs)",
      headquarters: "Saraswathi Nagar, Siddipet, Telangana, India",
      industry: "IT Staffing, US Candidate Marketing & Career Acceleration",
      targetMarket: "US-based tech job seekers (OPT/CPT, H-1B, Green Card, US Citizens)",
    },
    // Core administrative datasets:
    candidates: {
      kpis: userStatsData,
      validPlans: VALID_PLANS,
      users: initialUsersList.map((usr) => ({
        name: usr.name,
        email: usr.email,
        phone: usr.phone,
        plan: usr.plan,
        status: usr.accountStatus || usr.subscriptionStatus,
        joinDate: usr.joinDate || usr.joinedDate,
        location: usr.location,
        areaOfInterest: usr.areaOfInterest,
        lastPayment: usr.lastPayment,
      })),
    },
    plans: {
      offerings: initialPlansList.map((p) => ({
        name: p.name,
        price: p.price,
        billingCycle: p.billingCycle,
        activeSubscribers: p.activeSubscribers,
        features: p.features,
      })),
      subscribers: initialPlanSubscribers,
    },
    payments: {
      metrics: paymentMetrics,
      recentTransactions: initialPaymentsList.map((tx) => ({
        invoiceNo: tx.invoiceNo,
        customer: tx.customerName || tx.userName,
        email: tx.email,
        plan: tx.plan,
        amount: tx.amount,
        status: tx.status,
        date: tx.date,
        method: tx.method,
      })),
    },
    dashboard: {
      statCards: statCardsData,
      urgentAlerts: attentionAlerts,
      expiringPlans: expiringPlans,
    },
    jobsAndCrawlers: {
      metrics: jobMetrics,
      crawlers: initialJobSourcesList.map((src) => ({
        name: src.name,
        domain: src.domain,
        status: src.status,
        category: src.category,
        region: src.region,
      })),
    },
    administrators: initialAdminsList,
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

  // Keep recent conversation history (last 8 messages) to prevent conversation token creep
  const recentMessages = Array.isArray(messages) ? messages.slice(-8) : [];

  // 1. Try Groq for high-speed inference
  if (groqApiKey && !groqApiKey.includes("your_")) {
    try {
      const groqPayload = {
        model: "qwen/qwen3.8-27b",
        messages: [systemMessage, ...recentMessages],
        temperature: 0.65,
        max_tokens: 1536,
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
  if (openRouterApiKey && !openRouterApiKey.includes("your_")) {
    try {
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
          messages: [systemMessage, ...recentMessages],
          temperature: 0.65,
          max_tokens: 1536,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      const rawContent = result.choices?.[0]?.message?.content || "No response received.";
      return cleanChatbotResponse(rawContent);
    } catch (orErr) {
      console.error("OpenRouter request failed:", orErr);
      throw orErr;
    }
  }

  throw new Error("Unable to complete chat request with configured AI models.");
}
