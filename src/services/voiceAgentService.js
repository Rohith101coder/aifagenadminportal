import sidebarMetadata from "../data/sidebarMetadata.js";

/**
 * 1. AI Decision Maker:
 * Sends the user speech transcript and the complete sidebar metadata to the LLM (GPT-4o-mini via OpenRouter).
 * The LLM understands user intent, maps it to the matching sidebar item, and returns pure JSON.
 */
export async function determineActionFromVoice(transcript, metadata = sidebarMetadata) {
  if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
    return {
      action: "UNKNOWN",
      id: null,
      path: null,
      feedback: "No speech recognized.",
      reasoning: "Empty speech transcript received.",
    };
  }

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
    console.error("VoiceAgent: No AI API key configured in environment.");
    return {
      action: "UNKNOWN",
      id: null,
      path: null,
      feedback: "API key is not configured.",
      reasoning: "Missing VITE_GROQ_API_KEY and VITE_OPENROUTER_API_KEY.",
    };
  }

  // Concise metadata to maximize speed and stay safely within token quotas
  const conciseMetadata = metadata.map((item) => ({
    id: item.id,
    label: item.label,
    type: item.type,
    path: item.path,
    category: item.category,
    description: item.description,
  }));

  // Fast heuristic check for universal email dispatch commands
  const lowerTranscript = transcript.toLowerCase();
  const hasMailKeyword =
    /\b(mail|email|send)\b/i.test(lowerTranscript) &&
    /\b(to my mail|to my email|to me|to|report|reports|data|info|information|results?|summary|records?|pipeline|interview|payment|user|job|team|audit|setting|ai|token|cost|input section)\b/i.test(lowerTranscript);

  if (hasMailKeyword) {
    const extractedEmail =
      transcript.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] ||
      null;

    return {
      action: "SEND_EMAIL",
      tool: "send_universal_report",
      query: transcript,
      toEmail: extractedEmail,
      feedback: "Analyzing portal records and preparing report...",
      reasoning: "User requested data or report to be emailed.",
    };
  }

  // System prompt supplying the sidebar metadata to the LLM
  const systemPrompt = `You are the intelligent Voice Action Router for the AIFaGen Admin Portal.
Your task is to analyze the user's spoken voice transcript and decide what actionable item or tool to trigger.

You have access to:
1. Full metadata of all actionable elements on the sidebar:
\`\`\`json
${JSON.stringify(conciseMetadata)}
\`\`\`

2. Built-in Tools:
- "send_universal_report": Analyzes the user's request across all portal data files (Interviews, Payments, Users, Jobs, AI telemetry, Audit logs, Team, Settings, Dashboard), extracts matching data, generates styled HTML email, Excel (.csv) and PDF reports, and dispatches them via email. Trigger this whenever the user asks to email, mail, or send ANY information, report, or records (e.g. "mail me the last 7 days interview reports", "send failed payments report", "email candidate roster", "mail AI costs", "send team members in recruitment", etc.).

Rules for Decision Making:
1. If the user asks to email/mail/send ANY reports, data, or summaries:
   Return action "SEND_EMAIL" with tool "send_universal_report", query (the user request), and any extracted email address if spoken (otherwise null).
2. Match the user's natural intent to the most appropriate item in the metadata based on its label, description, keywords, category, or path.
3. If the user mentions any concept belonging to a page (e.g., "show me applicants", "who is in Siddipet", "check failed payments", "view scrapers", "toggle light mode", "sign me out", "go to home desk"), select that item.
4. If the user asks something completely outside portal navigation, controls, or data reporting, return action "UNKNOWN".
5. Output STRICT, VALID JSON ONLY. Do NOT include markdown code blocks (\`\`\`json), explanations, or preamble.

Expected JSON Format:
{
  "action": "NAVIGATE" | "CONTROL" | "SEND_EMAIL" | "UNKNOWN",
  "tool": "<tool name if SEND_EMAIL, else null>",
  "query": "<user prompt if SEND_EMAIL, else null>",
  "toEmail": "<extracted email address if spoken, or null>",
  "id": "<exact unique ID from metadata or null>",
  "path": "<exact path from metadata if NAVIGATE, or null>",
  "feedback": "<concise, polite confirmation spoken/displayed to user>",
  "reasoning": "<brief explanation of why this was matched>"
}`;

  try {
    let rawContent = null;

    // 1. Try Groq for ultra-low latency LPU routing (~300ms)
    if (groqApiKey && !groqApiKey.includes("your_")) {
      try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
            "User-Agent": "AIFaGenPortal/1.0",
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Spoken Transcript: "${transcript}"` },
            ],
            temperature: 0.1,
          }),
        });

        if (groqResponse.ok) {
          const groqResult = await groqResponse.json();
          rawContent = groqResult.choices?.[0]?.message?.content?.trim();
        } else {
          console.warn(`Groq VoiceAgent returned HTTP ${groqResponse.status}. Trying fallback...`);
        }
      } catch (groqErr) {
        console.warn("Groq VoiceAgent call failed, checking fallback:", groqErr);
      }
    }

    // 2. Fallback to OpenRouter if Groq was not used or failed
    if (!rawContent && openRouterApiKey) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            typeof window !== "undefined"
              ? window.location.origin
              : "http://localhost:5173",
          "X-Title": "AIFaGen Voice Agent",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Spoken Transcript: "${transcript}"` },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter HTTP ${response.status}: ${errText}`);
      }

      const result = await response.json();
      rawContent = result.choices?.[0]?.message?.content?.trim() || "{}";
    }

    if (!rawContent) {
      throw new Error("No response from AI inference engine.");
    }

    // Strip any accidental markdown formatting
    const cleaned = rawContent
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    const decision = JSON.parse(cleaned);

    // Normalize and validate response
    const action = decision.action || decision.type || "UNKNOWN";
    const tool = decision.tool || null;
    const query = decision.query || transcript;
    const days = decision.days || 7;
    const toEmail = decision.toEmail || null;
    const id = decision.id || decision.target || null;
    const path = decision.path || null;
    const feedback = decision.feedback || "Command processed.";
    const reasoning = decision.reasoning || "";

    return {
      action,
      tool,
      query,
      days,
      toEmail,
      id,
      path,
      feedback,
      reasoning,
    };
  } catch (err) {
    console.error("VoiceAgent LLM resolution error:", err);
    return {
      action: "UNKNOWN",
      id: null,
      path: null,
      feedback: "Could not resolve voice command with AI assistant.",
      reasoning: err.message || "Network / Parsing error",
    };
  }
}

/**
 * 2. Action Executor:
 * Receives the JSON decision returned by the LLM and executes the required action.
 * Dispatches Router navigation, triggers DOM events, and runs control callbacks.
 */
export function executeAgentAction(
  decision,
  {
    navigate,
    onNavigateFallback,
    onToggleTheme,
    onSignOut,
    onToggleSidebar,
    onSendEmail,
  } = {},
) {
  if (!decision || decision.action === "UNKNOWN") {
    return false;
  }

  // A. Email Tool Action
  if (decision.action === "SEND_EMAIL") {
    if (onSendEmail) {
      onSendEmail(decision);
      return true;
    }
  }

  // B. Navigation Action
  if (decision.action === "NAVIGATE") {
    let navigated = false;

    // 1. Direct React Router navigation via path
    if (decision.path) {
      if (navigate) {
        navigate(decision.path);
        navigated = true;
      } else if (onNavigateFallback) {
        onNavigateFallback(decision.path, decision.id);
        navigated = true;
      }
    }

    // 2. Fallback router navigation via ID if path wasn't provided
    if (!navigated && decision.id && onNavigateFallback) {
      onNavigateFallback(decision.id);
    }

    // 3. Highlight & simulate click on target DOM element in the sidebar
    if (decision.id) {
      const element =
        document.getElementById(decision.id) ||
        document.querySelector(`[data-sidebar-id="${decision.id}"]`) ||
        document.querySelector(`[data-nav-id="${decision.id}"]`);

      if (element) {
        try {
          element.click();
          // Add brief visual pulse to show user what was activated
          element.classList.add("voice-action-highlight");
          setTimeout(() => {
            element.classList.remove("voice-action-highlight");
          }, 1200);
        } catch (err) {
          console.warn("VoiceAgent: DOM click simulation note:", err);
        }
      }
    }

    return true;
  }

  // B. Control Action
  if (decision.action === "CONTROL" && decision.id) {
    // Theme toggle
    if (
      decision.id === "sidebar-ctrl-theme-toggle" ||
      decision.id === "theme-toggle"
    ) {
      if (onToggleTheme) {
        onToggleTheme();
        return true;
      }
      const btn =
        document.getElementById("sidebar-ctrl-theme-toggle") ||
        document.querySelector('[data-action-id="theme-toggle"]');
      if (btn) {
        btn.click();
        return true;
      }
    }

    // Sign out
    if (
      decision.id === "sidebar-ctrl-sign-out" ||
      decision.id === "sign-out"
    ) {
      if (onSignOut) {
        onSignOut();
        return true;
      }
      const btn =
        document.getElementById("sidebar-ctrl-sign-out") ||
        document.querySelector('[data-action-id="sign-out"]');
      if (btn) {
        btn.click();
        return true;
      }
    }

    // Sidebar collapse
    if (
      decision.id === "sidebar-ctrl-collapse" ||
      decision.id === "sidebar-collapse"
    ) {
      if (onToggleSidebar) {
        onToggleSidebar();
        return true;
      }
      const btn =
        document.getElementById("sidebar-ctrl-collapse") ||
        document.querySelector(".collapse-btn");
      if (btn) {
        btn.click();
        return true;
      }
    }
  }

  return false;
}
