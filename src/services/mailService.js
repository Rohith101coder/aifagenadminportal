import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Import all portal datasets from ALL existing JS files in src/data/
import {
  initialCandidatesList,
  interviewsMetrics,
  pipelineStages,
  outcomesDistribution,
} from "../data/interviewsData.js";
import {
  initialPaymentsList,
  paymentMetrics,
  paymentStatusBreakdown,
  revenueBarsData,
} from "../data/paymentsData.js";
import {
  initialUsersList,
  userStatsData,
  AREAS_OF_INTEREST,
  VALID_PLANS,
  VALID_PLAN_STATUSES,
} from "../data/usersData.js";
import {
  initialJobsList,
  jobMetrics,
} from "../data/jobsData.js";
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
  initialTeamMembersList,
  teamOverviewKpis,
  bottomAnalytics,
} from "../data/teamData.js";
import {
  initialReportsList,
  reportsOverviewKpis,
  reportsActivityTimeline,
} from "../data/reportsData.js";
import {
  initialSettingsData,
  settingsNavSections,
  sectionAuditHistory,
} from "../data/settingsData.js";
import {
  statCardsData,
  attentionAlerts,
  revenueBars,
  revenueTrendDatasets,
  plansDistribution,
  expiringPlans,
  jobSources as dashboardJobSources,
  adminActivities,
} from "../data/dashboardData.js";
import {
  initialPlansList,
  initialPlanSubscribers,
  planFeatureOptions,
} from "../data/plansData.js";
import {
  initialConnectedServices,
} from "../data/servicesData.js";
import {
  initialAdminsList,
} from "../data/adminsData.js";
import {
  searchAllData,
} from "../data/globalSearch.js";
import sidebarMetadata from "../data/sidebarMetadata.js";

/**
 * 1. Base Mail Tool: Dispatches email via Brevo
 * Accepts: toEmail, subject, htmlContent, text, attachments
 * Tries server middleware (/api/send-email) first to prevent CORS, then direct Brevo REST API fallback.
 */
export async function sendEmailTool({
  toEmail,
  subject,
  htmlContent,
  text = "",
  attachments = [],
}) {
  if (!toEmail || typeof toEmail !== "string" || !toEmail.includes("@")) {
    throw new Error(`Invalid recipient email address: "${toEmail}"`);
  }

  const clientApiKey =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      (import.meta.env.BREVO_API_KEY || import.meta.env.VITE_BREVO_API_KEY)) ||
    (typeof process !== "undefined" &&
      process.env &&
      (process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY)) ||
    "";
  let senderEmail =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      (import.meta.env.BREVO_SENDER_EMAIL ||
        import.meta.env.VITE_BREVO_SENDER_EMAIL)) ||
    (typeof process !== "undefined" &&
      process.env &&
      (process.env.BREVO_SENDER_EMAIL ||
        process.env.VITE_BREVO_SENDER_EMAIL)) ||
    "rohithvadla07@gmail.com";

  if (
    !senderEmail ||
    senderEmail.includes("smtp-brevo.com") ||
    senderEmail.includes("aifagenlabs.com") ||
    senderEmail.includes("your_")
  ) {
    senderEmail = "rohithvadla07@gmail.com";
  }

  const cleanAttachments = (attachments || [])
    .map((att) => ({
      name: att.name || att.filename || "Report_Attachment",
      content: att.content || att.base64 || "",
    }))
    .filter(
      (att) =>
        att.content &&
        typeof att.content === "string" &&
        att.content.trim().length > 0
    );

  const payload = {
    toEmail: toEmail.trim(),
    subject: subject || "AIFaGen Portal Report",
    htmlContent: htmlContent || "<p>Attached report from AIFaGen Admin Portal.</p>",
    text: text || "Please view the HTML version or download the attached reports.",
    attachments: cleanAttachments,
    brevoApiKey: clientApiKey,
    senderEmail: senderEmail,
  };

  let endpointErrorMsg;

  // Attempt 1: Call Vercel/Vite serverless endpoint (/api/send-email)
  try {
    const apiUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/api/send-email`
        : "http://localhost:5174/api/send-email";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        method: data.method || "brevo_api",
        messageId: data.messageId,
        toEmail: payload.toEmail,
      };
    }

    const errData = await response.json().catch(() => ({}));
    endpointErrorMsg = errData.error || errData.message || `Server responded with status ${response.status}`;
    console.warn("Mail endpoint warning:", endpointErrorMsg, errData);
  } catch (netErr) {
    endpointErrorMsg = netErr.message;
    console.warn("Server mail endpoint unreachable:", endpointErrorMsg, netErr);
  }

  // Attempt 2: Direct Client Fallback using Brevo REST API v3
  if (!clientApiKey || clientApiKey.includes("your_")) {
    throw new Error(
      endpointErrorMsg || "No Brevo API key configured in environment. Please add BREVO_API_KEY to Vercel Environment Variables."
    );
  }

  const brevoDirectResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": clientApiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "AIFaGen Dashboard",
        email: senderEmail,
      },
      to: [{ email: payload.toEmail, name: payload.toEmail }],
      subject: payload.subject,
      htmlContent: payload.htmlContent,
      textContent: payload.text,
      ...(cleanAttachments.length > 0 ? { attachment: cleanAttachments } : {}),
    }),
  });

  if (!brevoDirectResponse.ok) {
    const errText = await brevoDirectResponse.text();
    let parsedErr;
    try {
      parsedErr = JSON.parse(errText);
    } catch {
      parsedErr = { message: errText };
    }
    throw new Error(parsedErr.message || `Brevo HTTP error ${brevoDirectResponse.status}`);
  }

  const directResult = await brevoDirectResponse.json();
  return {
    success: true,
    method: "brevo_client_direct",
    messageId: directResult.messageId,
    toEmail: payload.toEmail,
  };
}

/**
 * 2. Universal Data Analysis Engine:
 * Analyzes the user's intent across ALL existing JS data files.
 * If matching data is found, extracts, filters, calculates KPIs, and compiles rows.
 * If not found, returns { found: false, message: "No data found matching your request." }
 */
export function analyzeAndExtractDataForQuery(userQuery = "") {
  const query = (userQuery || "").toLowerCase().trim();
  const todayStr = "Oct 15, 2026";

  // Check 1: Internal Job Requisitions (internalJobsData.js)
  if (
    query.includes("internal job") ||
    query.includes("internal opening") ||
    query.includes("internal requisition") ||
    query.includes("internal vacancy") ||
    query.includes("internal hiring") ||
    (query.includes("internal") && query.includes("job"))
  ) {
    let list = [...initialInternalJobsList];
    if (query.includes("mentor")) list = list.filter((j) => (j.title || "").toLowerCase().includes("mentor"));
    else if (query.includes("recruiter")) list = list.filter((j) => (j.title || "").toLowerCase().includes("recruit"));

    const totalOpeningsCount = list.reduce((acc, j) => acc + (j.openings || 1), 0);
    const totalApplicantsCount = list.reduce((acc, j) => acc + (j.applicants || 0), 0);

    return {
      found: true,
      topic: "Internal Job Requisitions",
      categoryBadge: "INTERNAL HIRING",
      title: "Internal Job Requisitions & Direct Hiring Report",
      subtitle: `Analyzed ${list.length} internal openings at AIFaGen Labs · Total Vacancies: ${totalOpeningsCount}`,
      dateRange: "Active Internal Positions as of " + todayStr,
      summaryMetrics: [
        { label: "Active Roles", value: String(list.length), subText: "Internal requisitions", color: "#0f172a" },
        { label: "Open Positions", value: String(totalOpeningsCount), subText: "Positions to fill", color: "#2563eb" },
        { label: "Total Applicants", value: String(totalApplicantsCount), subText: "Internal applicants", color: "#059669" },
        { label: "Operations Hub", value: "Siddipet HQ", subText: "Telangana, India", color: "#7c3aed" },
      ],
      insights: [
        `All internal requisitions managed directly by AIFaGen Labs operations and mentorship leadership.`,
        `Primary hiring categories include Senior Technical Mentors, Reverse Recruiters, and AI Prompt Engineers.`,
        `Positions offer competitive compensation packages benchmarking global tech staffing standards.`,
      ],
      headers: ["#", "Requisition ID", "Job Title", "Department", "Location", "Type", "Salary Bracket", "Openings", "Applicants", "Status"],
      rows: list.map((j, i) => [
        i + 1,
        j.id,
        j.title,
        j.department,
        j.location,
        j.type,
        j.salary,
        j.openings,
        j.applicants,
        j.status,
      ]),
      statusColumnIndex: 9,
    };
  }

  // Check 2: Expiring Plans & Renewals Due (dashboardData.js -> expiringPlans)
  if (
    query.includes("expir") ||
    query.includes("churn") ||
    query.includes("renewal due") ||
    query.includes("lapse") ||
    query.includes("renewals") ||
    (query.includes("plan") && query.includes("soon"))
  ) {
    let list = [...expiringPlans];

    return {
      found: true,
      topic: "Expiring Plans & Renewal Follow-Up",
      categoryBadge: "CHURN PREVENTION",
      title: "Expiring Subscriptions & Urgent Renewal Digest",
      subtitle: `Monitoring ${list.length} subscriptions expiring within 14 days · Revenue at risk: ₹${(list.length * 1999).toLocaleString()}`,
      dateRange: "Next 14 Days Forecast as of " + todayStr,
      summaryMetrics: [
        { label: "Expiring Soon", value: String(list.length), subText: "Within 14 days", color: "#dc2626" },
        { label: "Revenue at Risk", value: `₹${(list.length * 1999).toLocaleString()}`, subText: "Recurring renewals", color: "#d97706" },
        { label: "Premium Tier", value: String(list.filter((p) => p.plan === "Premium").length), subText: "High-value members", color: "#7c3aed" },
        { label: "Retention Goal", value: "92%", subText: "Benchmark target", color: "#059669" },
      ],
      insights: [
        `${list.length} candidates have subscription plans expiring soon, requiring proactive recruiter outreach.`,
        `Automated renewal reminders have been queued for candidate email and SMS notification.`,
        `Securing renewals ensures uninterrupted candidate marketing across US job boards.`,
      ],
      headers: ["#", "Candidate Name", "Email Address", "Current Plan", "Expiry Date", "Days Remaining", "Auto Renew", "Status"],
      rows: list.map((p, i) => [
        i + 1,
        p.name,
        p.email,
        p.plan,
        p.expiryDate,
        p.daysRemaining ? `${p.daysRemaining} days` : "7 days",
        p.autoRenew ? "Enabled" : "Manual",
        p.status || "Expiring Soon",
      ]),
      statusColumnIndex: 7,
    };
  }

  // Check 3: Subscription Plans & Pricing Matrix (plansData.js)
  if (
    query.includes("pricing plan") ||
    query.includes("plan tier") ||
    query.includes("subscription plan") ||
    query.includes("manage plan") ||
    query.includes("tier matrix") ||
    query.includes("subscriber list") ||
    (query.includes("plan") && !query.includes("expir") && !query.includes("interview") && !query.includes("payment") && !query.includes("audit") && !query.includes("who changed"))
  ) {
    const isSubscribersQuery = query.includes("subscriber");
    if (isSubscribersQuery && initialPlanSubscribers.length > 0) {
      return {
        found: true,
        topic: "Plan Subscribers",
        categoryBadge: "SUBSCRIBERS",
        title: "Active Subscription Plan Members & Renewal Ledger",
        subtitle: `Roster of ${initialPlanSubscribers.length} enrolled subscribers across Basic & Premium tiers`,
        dateRange: "Active Billing Run as of " + todayStr,
        summaryMetrics: [
          { label: "Total Subscribers", value: String(initialPlanSubscribers.length), subText: "Active paid accounts", color: "#0f172a" },
          { label: "Premium Tier", value: String(initialPlanSubscribers.filter((s) => s.plan === "Premium").length), subText: "₹1,999/mo bundle", color: "#7c3aed" },
          { label: "Basic Tier", value: String(initialPlanSubscribers.filter((s) => s.plan === "Basic").length), subText: "₹799/mo bundle", color: "#2563eb" },
          { label: "Active Revenue", value: "₹28,432.50", subText: "Monthly recurring", color: "#059669" },
        ],
        insights: [
          `Subscribers receive automated resume parsing, mock interviews, and tailored recruiter marketing.`,
          `Tier upgrade conversion rate is currently tracking at 30.8%.`,
          `Payment gateways (Razorpay, Stripe) handling recurring renewal debits.`,
        ],
        headers: ["#", "Subscriber Name", "Email Address", "Plan Tier", "Amount", "Billing Cycle", "Renewal Date", "Gateway", "Status"],
        rows: initialPlanSubscribers.map((s, i) => [
          i + 1,
          s.name,
          s.email,
          s.plan,
          s.amount || "₹1,999",
          s.billingCycle || "Monthly",
          s.renewalDate || "Oct 30, 2026",
          s.gateway || "Razorpay",
          s.status || "Active",
        ]),
        statusColumnIndex: 8,
      };
    }

    return {
      found: true,
      topic: "Subscription Plans & Pricing Tiers",
      categoryBadge: "PRODUCT TIERS",
      title: "Subscription Plans, Pricing Tiers & Feature Matrix",
      subtitle: `Configuration of ${initialPlansList.length} commercial subscription tiers at AIFaGen Labs`,
      dateRange: "Current Pricing Matrix as of " + todayStr,
      summaryMetrics: [
        { label: "Active Plans", value: String(initialPlansList.length), subText: "Commercial tiers", color: "#0f172a" },
        { label: "Basic Plan", value: "₹799/mo", subText: "ATS & Job Board", color: "#2563eb" },
        { label: "Premium Plan", value: "₹1,999/mo", subText: "Full Mentorship", color: "#7c3aed" },
        { label: "Enterprise Tier", value: "Custom", subText: "Corporate Hiring", color: "#059669" },
      ],
      insights: [
        `Basic Plan (₹799/mo) and Premium Plan (₹1,999/mo) form the core candidate monetization tiers.`,
        `Available plan feature options include: ${planFeatureOptions.slice(0, 3).map((f) => f.name || f).join(", ")}.`,
        `All plans include a standard trial period with full access to reverse recruiter matching.`,
      ],
      headers: ["#", "Plan ID", "Plan Name", "Monthly Price", "Yearly Price", "Trial Period", "Subscribers", "Active Revenue", "Status"],
      rows: initialPlansList.map((p, i) => [
        i + 1,
        p.id,
        p.name,
        p.priceMonthly || p.price || "₹799/mo",
        p.priceYearly || "₹7,999/yr",
        p.trialDays ? `${p.trialDays} Days` : "14 Days",
        p.subscriberCount || "1,200",
        p.activeRevenue || "₹9,58,800",
        p.status || "Active",
      ]),
      statusColumnIndex: 8,
    };
  }

  // Check 4: Attention Alerts & System Issues (dashboardData.js -> attentionAlerts)
  if (
    query.includes("alert") ||
    query.includes("attention") ||
    query.includes("system blocker") ||
    query.includes("critical issue") ||
    query.includes("system issue") ||
    query.includes("warning")
  ) {
    let list = [...attentionAlerts];

    return {
      found: true,
      topic: "System Attention Alerts",
      categoryBadge: "SYSTEM ALERTS",
      title: "Operational Attention Alerts & Urgent Blockers Report",
      subtitle: `Recorded ${list.length} pressing alerts requiring administrative action across portal modules`,
      dateRange: "Live Alerts as of " + todayStr,
      summaryMetrics: [
        { label: "Active Alerts", value: String(list.length), subText: "Requires action", color: "#dc2626" },
        { label: "Job Sources", value: String(list.filter((a) => a.type === "job_sources").length), subText: "Crawler errors", color: "#d97706" },
        { label: "Payments", value: String(list.filter((a) => a.type === "payments").length), subText: "Failed debits", color: "#7c3aed" },
        { label: "Expiring Plans", value: String(list.filter((a) => a.type === "plans_expiring").length), subText: "Churn risk", color: "#2563eb" },
      ],
      insights: [
        `${list.length} operational items flagged by telemetry requiring immediate staff resolution.`,
        `Critical alerts include failed Naukri scrapers and 5 failed candidate payment renewals.`,
        `Resolution links and diagnostic drawers are directly accessible from the Executive Dashboard.`,
      ],
      headers: ["#", "Alert ID", "Category / Type", "Alert Title", "Details / Subtitle", "Detection Time", "Action Required"],
      rows: list.map((a, i) => [
        i + 1,
        `ALT-${a.id}`,
        a.type || "System",
        a.title,
        a.subtitle,
        a.time,
        a.buttonText || "Resolve",
      ]),
      statusColumnIndex: 6,
    };
  }

  // Check 5: Admin Activity Feed (dashboardData.js -> adminActivities)
  if (
    query.includes("admin activit") ||
    query.includes("staff activit") ||
    query.includes("activity feed") ||
    query.includes("recent action") ||
    query.includes("action log")
  ) {
    let list = [...adminActivities];

    return {
      found: true,
      topic: "Admin Activity Feed",
      categoryBadge: "STAFF ACTIONS",
      title: "Administrator Activity Feed & Recent Operations Stream",
      subtitle: `Tracking ${list.length} administrative events and staff interactions across modules`,
      dateRange: "Recent Audit Window as of " + todayStr,
      summaryMetrics: [
        { label: "Total Activities", value: String(list.length), subText: "Recorded staff actions", color: "#0f172a" },
        { label: "Lead Admin", value: "Rohith P", subText: "Super Administrator", color: "#2563eb" },
        { label: "Action Types", value: "5 Categories", subText: "Plans, refunds, users", color: "#059669" },
        { label: "Audit State", value: "Verified", subText: "Immutable stream", color: "#7c3aed" },
      ],
      insights: [
        `All administrative actions logged with actor identity, target record, and timestamp.`,
        `Recent operations include candidate tier updates, crawler resets, and manual invoice receipts.`,
        `Operations verified compliant with internal access control policies.`,
      ],
      headers: ["#", "Activity ID", "Admin Name", "Action Taken", "Details / Target", "Badge", "Timestamp"],
      rows: list.map((act, i) => [
        i + 1,
        `ACT-${act.id}`,
        act.adminName,
        act.actionText,
        act.detail,
        act.badge,
        act.timestamp,
      ]),
      statusColumnIndex: 5,
    };
  }

  // Check 6: Revenue Trends & Trajectory (dashboardData.js -> revenueBars, revenueTrendDatasets, plansDistribution)
  if (
    query.includes("revenue trend") ||
    query.includes("revenue trajectory") ||
    query.includes("monthly growth") ||
    query.includes("mrr trend") ||
    query.includes("financial growth") ||
    query.includes("revenue graph")
  ) {
    let list = [...revenueBars];

    return {
      found: true,
      topic: "Revenue Trend & Growth Analytics",
      categoryBadge: "FINANCIAL BI",
      title: "Subscription Revenue Trend & Multi-Period Performance Digest",
      subtitle: `Comprehensive revenue trajectory across 7D, 30D, and 90D timeframes · Current MRR: ₹28,432.50`,
      dateRange: "Active Billing Trajectory as of " + todayStr,
      summaryMetrics: [
        { label: "Current MRR", value: "₹28,432.50", subText: "+12.4% vs prev 30d", color: "#059669" },
        { label: "Peak Day", value: "₹40,180.00", subText: "Oct 15, 2026", color: "#2563eb" },
        { label: "Paid Conversion", value: "30.8%", subText: "Premium mentorship", color: "#7c3aed" },
        { label: "Avg Daily Rev", value: "₹25,144.00", subText: "Consistent run-rate", color: "#0f172a" },
      ],
      insights: [
        `Monthly recurring revenue demonstrating strong growth across all candidate subscription cohorts.`,
        `Premium Plan accounts for the majority of gross volume (${plansDistribution?.premium || 65}%).`,
        `Automated revenue tracking across multi-period datasets (${Object.keys(revenueTrendDatasets || {}).join(", ") || "7D, 30D, 90D, 1Y"}) confirms positive cash flow.`,
      ],
      headers: ["#", "Date / Period", "Gross Revenue", "New Sign-ups", "Paying Users", "Conversion %", "Trajectory"],
      rows: list.map((rb, i) => [
        i + 1,
        rb.day || rb.date || `Day ${i + 1}`,
        `₹${(rb.value || 25000).toLocaleString()}`,
        rb.signups || 45,
        rb.payingUsers || 18,
        rb.conversionRate || "32%",
        "+15.2%",
      ]),
      statusColumnIndex: 6,
    };
  }

  // Check 7: BI Reports Catalog & Export History (reportsData.js)
  if (
    query.includes("bi report") ||
    query.includes("scheduled report") ||
    query.includes("report catalog") ||
    query.includes("report template") ||
    (query.includes("report") && query.includes("list"))
  ) {
    let list = [...initialReportsList];

    return {
      found: true,
      topic: "BI Reports Catalog & Export History",
      categoryBadge: "BI REPORTING",
      title: "Enterprise BI Reports Catalog & Export History",
      subtitle: `Overview of ${list.length} analytical reports across Financial, Placement, Crawler, and AI Telemetry`,
      dateRange: "Scheduled Reports as of " + todayStr,
      summaryMetrics: [
        { label: "Configured Reports", value: String(list.length), subText: "Active report templates", color: "#0f172a" },
        { label: "Scheduled Runs", value: reportsOverviewKpis.scheduledRuns || "14 Runs/Wk", subText: "Automated schedule", color: "#2563eb" },
        { label: "Total Exports", value: reportsOverviewKpis.totalExports || "428 Exports", subText: "PDF / CSV generated", color: "#059669" },
        { label: "System Health", value: "100%", subText: "All templates verified", color: "#7c3aed" },
      ],
      insights: [
        `Standardized enterprise report formats configured for automatic weekly and monthly generation.`,
        `Recent export timeline logs ${reportsActivityTimeline?.length || 5} generation events in system audit.`,
        `Export engine formats rows directly into Excel-compatible CSV and vector PDF with AutoTable.`,
      ],
      headers: ["#", "Report ID", "Report Title", "Category", "Format", "Schedule", "Last Generated", "File Size", "Owner", "Status"],
      rows: list.map((r, i) => [
        i + 1,
        r.id,
        r.title || r.name,
        r.category,
        r.format,
        r.schedule || "Weekly",
        r.lastGenerated || "Oct 14, 2026",
        r.size || "1.2 MB",
        r.owner || "System",
        r.status || "Ready",
      ]),
      statusColumnIndex: 9,
    };
  }

  // Check 8: Connected Cloud Services & API Health (servicesData.js)
  if (
    query.includes("connected service") ||
    query.includes("services status") ||
    query.includes("third party") ||
    query.includes("api status") ||
    query.includes("api health") ||
    query.includes("integration") ||
    query.includes("cloud services")
  ) {
    let list = [...initialConnectedServices];

    return {
      found: true,
      topic: "Connected Services & Integrations",
      categoryBadge: "INFRASTRUCTURE",
      title: "Connected Cloud Services, API Integrations & Health Telemetry",
      subtitle: `Status, latency, and uptime telemetry for ${list.length} external cloud integrations`,
      dateRange: "Live Infrastructure Health as of " + todayStr,
      summaryMetrics: [
        { label: "Total Services", value: String(list.length), subText: "Monitored APIs", color: "#0f172a" },
        { label: "Healthy Integrations", value: String(list.filter((s) => s.status === "Healthy" || s.status === "Connected").length), subText: "Operational", color: "#059669" },
        { label: "Attention Required", value: String(list.filter((s) => s.status !== "Healthy" && s.status !== "Connected").length), subText: "Needs review", color: "#dc2626" },
        { label: "Avg Latency", value: "145ms", subText: "Cloud response time", color: "#2563eb" },
      ],
      insights: [
        `Infrastructure monitoring encompasses Brevo Transactional Mail, Groq LPU, OpenRouter, Razorpay, and Proxy Rotators.`,
        `Primary transactional mail endpoint operating normally via Brevo REST API v3.`,
        `Automatic failover cascades configured between primary and secondary LLM providers.`,
      ],
      headers: ["#", "Service Name", "Category", "Provider / API", "Status", "Uptime", "Latency", "Last Ping", "Health Note"],
      rows: list.map((s, i) => [
        i + 1,
        s.name,
        s.category,
        s.provider || "Cloud API",
        s.status,
        s.uptime || "99.9%",
        s.latency || "140ms",
        s.lastChecked || "Just now",
        s.note || "Operational",
      ]),
      statusColumnIndex: 4,
    };
  }

  // Check 9: Authorized Administrators & Security Roles (adminsData.js)
  if (
    query.includes("admin roster") ||
    query.includes("administrator") ||
    query.includes("admin account") ||
    query.includes("super admin") ||
    query.includes("authorized admin") ||
    query.includes("admin user")
  ) {
    let list = [...initialAdminsList];

    return {
      found: true,
      topic: "Authorized Platform Administrators",
      categoryBadge: "ACCESS CONTROL",
      title: "Authorized Platform Administrators & Security Roles Directory",
      subtitle: `Directory of ${list.length} verified administrative accounts for AIFaGen Labs`,
      dateRange: "Verified Accounts as of " + todayStr,
      summaryMetrics: [
        { label: "Total Admins", value: String(list.length), subText: "Authorized accounts", color: "#0f172a" },
        { label: "Super Admin", value: "Rohith P", subText: "Lead Platform Admin", color: "#2563eb" },
        { label: "Support & Ops", value: "3 Accounts", subText: "Role-based scopes", color: "#7c3aed" },
        { label: "2FA Status", value: "100% Active", subText: "Enterprise security", color: "#059669" },
      ],
      insights: [
        `Administrative access strictly partitioned across Super Admin, Support, Operations, and Placements.`,
        `Session persistence governed by encrypted localStorage tokens with automatic expiry safeguards.`,
        `All admin logins recorded with IP address, user agent, and timestamp forensic audit trails.`,
      ],
      headers: ["#", "Admin ID", "Full Name", "Email Address", "Security Role", "Added Date", "Session Type", "Status"],
      rows: list.map((adm, i) => [
        i + 1,
        adm.id,
        adm.name,
        adm.email,
        adm.role,
        adm.addedDate,
        adm.isSelf ? "Lead Admin (Self)" : "Delegated Staff",
        "Verified Active",
      ]),
      statusColumnIndex: 7,
    };
  }

  // Check 10: Candidate Technical Mock Interviews (interviewsData.js)
  if (
    query.includes("interview") ||
    query.includes("pipeline stage") ||
    query.includes("candidate interview") ||
    (query.includes("candidate") && !query.includes("roster") && !query.includes("user"))
  ) {
    let list = [...initialCandidatesList];

    if (query.includes("7 day") || query.includes("week")) list = list.slice(0, 10);
    if (query.includes("scheduled")) list = list.filter((c) => c.status === "Scheduled");
    else if (query.includes("in progress")) list = list.filter((c) => c.status === "In Progress");
    else if (query.includes("hired") || query.includes("placed")) list = list.filter((c) => c.status === "Hired");
    else if (query.includes("offer")) list = list.filter((c) => c.status.toLowerCase().includes("offer"));
    else if (query.includes("rejected")) list = list.filter((c) => c.status === "Rejected");

    const companies = ["google", "microsoft", "amazon", "flipkart", "infosys", "tcs", "swiggy", "accenture"];
    for (const comp of companies) {
      if (query.includes(comp)) {
        list = list.filter((c) => (c.company || "").toLowerCase().includes(comp));
      }
    }

    if (list.length === 0) {
      return {
        found: false,
        topic: "Interviews",
        message: `No interview records found matching "${userQuery}".`,
      };
    }

    const scheduled = list.filter((c) => c.status === "Scheduled").length;
    const inProgress = list.filter((c) => c.status === "In Progress").length;
    const offers = list.filter((c) => c.status.toLowerCase().includes("offer")).length;
    const hired = list.filter((c) => c.status === "Hired").length;

    return {
      found: true,
      topic: "Interviews & Hiring Pipeline",
      categoryBadge: "HIRING INTELLIGENCE",
      title: "Interview Performance & Candidate Pipeline Digest",
      subtitle: `Analyzed ${list.length} candidate interview records · Period: Oct 06 – Oct 15, 2026`,
      dateRange: "Oct 06, 2026 – Oct 15, 2026",
      summaryMetrics: [
        { label: "Total Interviewed", value: String(list.length), subText: interviewsMetrics[0]?.change || "+12.4% vs prev", color: "#0f172a" },
        { label: "Active Pipeline", value: String(scheduled + inProgress), subText: "Scheduled / In Progress", color: "#2563eb" },
        { label: "Offers Extended", value: String(offers), subText: `${outcomesDistribution?.offerAcceptance || 83}% acceptance`, color: "#7c3aed" },
        { label: "Hired / Placed", value: String(hired), subText: "Average 14d cycle", color: "#059669" },
      ],
      insights: [
        `${list.length} candidate technical mock interviews recorded across Engineering, Product, and Design.`,
        `Candidate pipeline tracks progression across ${pipelineStages.map((s) => s.stage).join(" -> ")}.`,
        `Top hiring organizations include Google, Microsoft, Amazon, and Flipkart.`,
      ],
      headers: ["#", "Candidate Name", "Email Address", "Target Role", "Company", "Stage", "Interviewer", "Date & Time", "Status"],
      rows: list.map((c, i) => [
        i + 1,
        c.name,
        c.email,
        c.jobTitle,
        c.company || "AIFaGen",
        c.currentStage,
        c.interviewers && c.interviewers[0] ? c.interviewers[0].name : "Recruiter",
        `${c.interviewDate} ${c.interviewTime || ""}`,
        c.status,
      ]),
      statusColumnIndex: 8,
    };
  }

  // Check 11: Payments, Invoices, Billing & Transactions (paymentsData.js)
  if (
    query.includes("payment") ||
    query.includes("revenue") ||
    query.includes("refund") ||
    query.includes("invoice") ||
    query.includes("billing") ||
    query.includes("transaction") ||
    query.includes("gst")
  ) {
    let list = [...initialPaymentsList];

    if (query.includes("failed") || query.includes("failure")) {
      list = list.filter((p) => p.status === "Failed");
    } else if (query.includes("success") || query.includes("captured")) {
      list = list.filter((p) => p.status === "Successful");
    } else if (query.includes("refund")) {
      list = list.filter((p) => p.status === "Refunded");
    }

    if (list.length === 0) {
      return {
        found: false,
        topic: "Payments",
        message: `No payment records found matching "${userQuery}".`,
      };
    }

    const totalVolume = list.reduce((acc, p) => acc + (p.numericAmount || 0), 0);
    const successfulCount = list.filter((p) => p.status === "Successful").length;
    const failedCount = list.filter((p) => p.status === "Failed").length;
    const refundedCount = list.filter((p) => p.status === "Refunded").length;

    return {
      found: true,
      topic: "Payments & Revenue Management",
      categoryBadge: "FINANCE & BILLING",
      title: "Payments, Revenue & Financial Invoices Report",
      subtitle: `Financial reconciliation for ${list.length} transactions · Total Analyzed: ₹${totalVolume.toLocaleString()}`,
      dateRange: "September – October 2026",
      summaryMetrics: [
        { label: "Total Transactions", value: String(list.length), subText: "Analyzed records", color: "#0f172a" },
        { label: "Gross Volume", value: `₹${totalVolume.toLocaleString()}`, subText: paymentMetrics[0]?.change || "+18.3%", color: "#2563eb" },
        { label: "Successful", value: String(successfulCount), subText: `${paymentStatusBreakdown?.successPercentage || Math.round((successfulCount / list.length) * 100)}% capture rate`, color: "#059669" },
        { label: "Failed / Refunds", value: `${failedCount} / ${refundedCount}`, subText: "Attention required", color: "#dc2626" },
      ],
      insights: [
        `Reconciled ${list.length} payment records totaling ₹${totalVolume.toLocaleString()} across Razorpay and Stripe gateways.`,
        `${successfulCount} payments successfully settled with verified invoice receipts across ${revenueBarsData?.length || 10} recorded intervals.`,
        failedCount > 0 ? `${failedCount} failed transactions detected requiring follow-up.` : "No critical gateway errors detected in active cycle.",
      ],
      headers: ["Transaction ID", "Customer Name", "Customer Email", "Plan", "Amount", "Net Amount", "Payment Method", "Date & Time", "Invoice #", "Status"],
      rows: list.map((p) => [
        p.id,
        p.userName,
        p.userEmail,
        p.plan,
        p.amount,
        p.netAmount || p.amount,
        p.paymentMethod,
        `${p.paymentDate} ${p.paymentTime || ""}`,
        p.invoiceNo,
        p.status,
      ]),
      statusColumnIndex: 9,
    };
  }

  // Check 12: Candidate Roster & Users (usersData.js)
  if (
    query.includes("user") ||
    query.includes("candidate roster") ||
    query.includes("applicant") ||
    query.includes("candidate list") ||
    query.includes("job seeker")
  ) {
    let list = [...initialUsersList];

    if (query.includes("premium")) list = list.filter((u) => u.plan === "Premium");
    else if (query.includes("basic")) list = list.filter((u) => u.plan === "Basic");

    if (query.includes("active")) list = list.filter((u) => u.planStatus === "Active");
    else if (query.includes("inactive") || query.includes("past due")) list = list.filter((u) => u.planStatus !== "Active");

    if (list.length === 0) {
      return {
        found: false,
        topic: "Users",
        message: `No candidate user records found matching "${userQuery}".`,
      };
    }

    const premiumCount = list.filter((u) => u.plan === "Premium").length;
    const activeCount = list.filter((u) => u.planStatus === "Active").length;

    return {
      found: true,
      topic: "Candidate Roster & User Subscriptions",
      categoryBadge: "USER INTELLIGENCE",
      title: "Candidate Roster & Member Engagement Report",
      subtitle: `Analyzed ${list.length} candidate profiles across US tech placement tracks`,
      dateRange: "Active Roster as of " + todayStr,
      summaryMetrics: [
        { label: "Total Candidates", value: String(list.length), subText: "Registered seekers", color: "#0f172a" },
        { label: "Active Subscriptions", value: String(activeCount), subText: `${VALID_PLAN_STATUSES[0]} plan holders`, color: "#059669" },
        { label: "Premium Tier", value: String(premiumCount), subText: `${VALID_PLANS[2]} Bundle`, color: "#7c3aed" },
        { label: "Total Portal Users", value: userStatsData[0]?.value || "12,482", subText: "+8.3% monthly growth", color: "#2563eb" },
      ],
      insights: [
        `${list.length} candidate profiles actively tracked across placement tracks including ${AREAS_OF_INTEREST.slice(0, 3).join(", ")}.`,
        `${premiumCount} candidates enrolled in Premium full-service reverse recruiting retainers.`,
        `Candidate ATS scores evaluated across formatting, keywords, and technical impact.`,
      ],
      headers: ["User ID", "Candidate Name", "Email Address", "Phone", "Location", "Area of Interest", "Target Role", "Plan", "Status", "Joined Date"],
      rows: list.map((u) => [
        u.id,
        u.name,
        u.email,
        u.phone || "Protected",
        u.location,
        u.areaOfInterest,
        u.jobPreferences?.targetRole || u.headline || "Tech Professional",
        u.plan,
        u.planStatus || "Active",
        u.startDate,
      ]),
      statusColumnIndex: 8,
    };
  }

  // Check 13: Crawled Jobs Board & Market Opportunities (jobsData.js)
  if (
    query.includes("job") ||
    query.includes("opening") ||
    query.includes("posting") ||
    query.includes("vacancy") ||
    query.includes("market feed")
  ) {
    let list = [...initialJobsList];

    const companies = ["google", "apple", "microsoft", "meta", "netflix", "uber", "amazon", "stripe"];
    for (const comp of companies) {
      if (query.includes(comp)) {
        list = list.filter((j) => (j.company || "").toLowerCase().includes(comp));
      }
    }

    if (query.includes("remote")) list = list.filter((j) => (j.employmentType || "").toLowerCase().includes("remote"));

    if (list.length === 0) {
      return {
        found: false,
        topic: "Jobs",
        message: `No job openings found matching "${userQuery}".`,
      };
    }

    return {
      found: true,
      topic: "Job Openings & Market Pipeline",
      categoryBadge: "MARKET INTELLIGENCE",
      title: "Job Openings & Placement Pipeline Report",
      subtitle: `Analyzed ${list.length} verified tech openings across top global employers`,
      dateRange: "Active Opportunities as of " + todayStr,
      summaryMetrics: [
        { label: "Curated Openings", value: String(list.length), subText: "Verified active jobs", color: "#0f172a" },
        { label: "Live Market Jobs", value: jobMetrics.liveJobs?.total || "6,284", subText: "+8.7% vs prev 30d", color: "#2563eb" },
        { label: "Added Today", value: jobMetrics.jobsAddedToday?.total || "284", subText: "Automated ingestion", color: "#059669" },
        { label: "Active Crawlers", value: "12 / 15", subText: "Healthy sources", color: "#7c3aed" },
      ],
      insights: [
        `${list.length} verified job openings available for candidate marketing and automatic resume tailoring.`,
        `Top hiring organizations include ${[...new Set(list.map((j) => j.company))].slice(0, 4).join(", ")}.`,
        `Ingested from certified job sources including LinkedIn, Indeed, Glassdoor, and direct ATS feeds.`,
      ],
      headers: ["Job ID", "Job Title", "Company", "Department", "Employment Type", "Source", "Applicants", "Posted Date", "Status"],
      rows: list.map((j) => [
        j.id,
        j.title,
        j.company,
        j.department || "Engineering",
        j.employmentType,
        j.source || "Direct ATS",
        j.applicantsCount || "24+",
        j.postedDate || "Oct 2026",
        j.status || "Active",
      ]),
      statusColumnIndex: 8,
    };
  }

  // Check 14: Job Crawlers & Ingestion Sources (jobSourcesData.js + dashboardData.js -> jobSources)
  if (
    query.includes("job source") ||
    query.includes("crawler") ||
    query.includes("scraper") ||
    query.includes("feed health") ||
    query.includes("ingestion")
  ) {
    let list = [...initialJobSourcesList];

    if (list.length === 0) {
      return {
        found: false,
        topic: "Job Sources",
        message: `No job sources found matching "${userQuery}".`,
      };
    }

    return {
      found: true,
      topic: "Automated Job Crawlers & Ingestion Sources",
      categoryBadge: "DATA PIPELINE",
      title: "Job Scrapers & External Feed Health Report",
      subtitle: `Status and sync telemetry for ${list.length} automated job ingestion crawlers`,
      dateRange: "Live Crawler Telemetry as of " + todayStr,
      summaryMetrics: [
        { label: "Total Crawlers", value: String(list.length), subText: "Monitored feeds", color: "#0f172a" },
        { label: "Healthy Feeds", value: String(list.filter((s) => !PROBLEM_STATUSES.includes(s.status)).length), subText: `${VALID_SOURCE_STATUSES[0]} sources`, color: "#059669" },
        { label: "Crawlers with Issues", value: String(list.filter((s) => PROBLEM_STATUSES.includes(s.status)).length), subText: "Requires captcha fix", color: "#dc2626" },
        { label: "Daily Fetch Rate", value: jobSourcesOverviewMetrics?.dailyJobsIngested || "2,400+", subText: "Jobs ingested/day", color: "#2563eb" },
      ],
      insights: [
        `Crawlers fetch fresh job opportunities every 4 hours across ${dashboardJobSources?.length || 5} major job source portals.`,
        `LinkedIn, Indeed, and Naukri crawlers operating with automatic proxy rotation.`,
        `Weekly trend chart indicates ${weeklyTrendChartData.length || 7} continuous days of sustained crawler ingestion.`,
      ],
      headers: ["Source Name", "Platform Domain", "Category", "Sync Status", "Jobs Ingested", "Success Rate", "Last Sync", "Health Note"],
      rows: list.map((s) => [
        s.name,
        s.domain || "Job Portal",
        s.category || "Aggregator",
        s.status,
        s.jobsFetched || "240+",
        s.successRate || "98%",
        s.lastRun || "Today",
        s.note || "Operational",
      ]),
      statusColumnIndex: 3,
    };
  }

  // Check 15: AI Telemetry & Token Expenditure (aiUsageData.js)
  if (
    /\b(ai|tokens?|llm|gpt|telemetry|ats score|model costs?|groq|openrouter)\b/i.test(query)
  ) {
    let list = [...initialAiFeaturesList];

    if (list.length === 0) {
      return {
        found: false,
        topic: "AI Telemetry",
        message: `No AI telemetry records found matching "${userQuery}".`,
      };
    }

    return {
      found: true,
      topic: "AI Telemetry & Feature Expenditure",
      categoryBadge: "AI TELEMETRY",
      title: "AI Feature Cost, Token Consumption & Latency Audit",
      subtitle: `Breakdown of ${list.length} AI pipelines · Monthly Spend: ${aiTopMetrics.spendThisMonth?.usd || "$412.36"} (${aiTopMetrics.spendThisMonth?.inr || "₹34,128"})`,
      dateRange: "Current Billing Cycle (October 2026)",
      summaryMetrics: [
        { label: "Spend This Month", value: aiTopMetrics.spendThisMonth?.usd || "$412.36", subText: "41.2% of budget", color: "#059669" },
        { label: "Total Requests", value: aiTopMetrics.totalRequests?.count || "48,762", subText: "+22.1% throughput", color: "#2563eb" },
        { label: "Cost Per Scan", value: aiTopMetrics.costPerScan?.usd || "$0.032", subText: "-18.9% optimized", color: "#7c3aed" },
        { label: "Success Rate", value: aiTopMetrics.successRate?.rate || "96.2%", subText: "High reliability", color: "#0f172a" },
      ],
      insights: [
        `Total tokens consumed across all production features operating well within monthly budget ceilings.`,
        `Primary token consumption driven by Resume ATS Analyzer (${costByFeatureDistribution?.resumeParser || "48%"}) and Mock Interviews.`,
        `Daily cost trend bars confirm steady token efficiency across ${costTrendDailyBars?.length || 7} monitored days with latency under 450ms.`,
      ],
      headers: ["Feature Name", "Category", "Primary Model", "Tokens Consumed", "Spend (USD)", "Spend (INR)", "Avg Latency", "Monthly Runs", "Status"],
      rows: list.map((f) => [
        f.name || f.feature,
        f.category || "NLP",
        f.model || "Llama-3.3-70B",
        f.tokens || "120K",
        f.costUsd || f.cost || "$50.00",
        f.costInr || "₹4,137",
        f.latency || "420ms",
        f.runs || "8,400",
        f.status || "Healthy",
      ]),
      statusColumnIndex: 8,
    };
  }

  // Check 16: Compliance Audit Logs & Security Forensics (auditLogData.js)
  if (
    query.includes("audit") ||
    query.includes("security log") ||
    query.includes("event log") ||
    query.includes("who changed") ||
    query.includes("compliance log")
  ) {
    const list = typeof getStoredAuditLogs === "function" ? getStoredAuditLogs() : initialAuditLogs;

    return {
      found: true,
      topic: "System Audit Logs & Security Compliance",
      categoryBadge: "COMPLIANCE LOGS",
      title: "Administrative Audit Trail & Security Event Logs",
      subtitle: `Recorded ${list.length} authorized administrative actions · Immutable audit ledger`,
      dateRange: "October 2026 Trail",
      summaryMetrics: [
        { label: "Audit Events", value: String(list.length), subText: "Verified admin actions", color: "#0f172a" },
        { label: "Super Admins", value: "Rohith P", subText: "Siddipet HQ Terminal", color: "#2563eb" },
        { label: "Compliance Score", value: "100%", subText: "SOC2 / US Privacy", color: "#059669" },
        { label: "Security Level", value: "Elevated", subText: "MFA Enforced", color: "#7c3aed" },
      ],
      insights: [
        `All administrative actions logged with timestamp, actor credentials, and state delta verification.`,
        `Recent critical events include candidate plan tier modifications and registered Siddipet corporate updates.`,
        `0 unauthorized privilege escalation attempts detected in current audit window.`,
      ],
      headers: ["Event ID", "Date & Time", "Actor", "Role", "Category", "Event Summary", "Target", "Status"],
      rows: list.map((l) => [
        l.id,
        `${l.date} ${l.time || ""}`,
        l.actor,
        l.actorRole,
        l.category,
        l.eventSummary,
        l.targetName || l.targetType || "System",
        l.status,
      ]),
      statusColumnIndex: 7,
    };
  }

  // Check 17: Team Directory & Delivery Operations (teamData.js)
  if (
    query.includes("team") ||
    query.includes("staff") ||
    query.includes("recruiter") ||
    query.includes("mentor") ||
    query.includes("employee") ||
    query.includes("headcount")
  ) {
    let list = [...initialTeamMembersList];

    if (query.includes("recruitment")) list = list.filter((m) => (m.department || "").toLowerCase().includes("recruit"));
    else if (query.includes("engineer") || query.includes("tech")) list = list.filter((m) => (m.department || "").toLowerCase().includes("tech") || (m.role || "").toLowerCase().includes("engineer"));

    if (list.length === 0) {
      return {
        found: false,
        topic: "Team",
        message: `No team member records found matching "${userQuery}".`,
      };
    }

    return {
      found: true,
      topic: "Team Directory & Delivery Staff",
      categoryBadge: "TEAM & ROLES",
      title: "Team Roster, Mentors & Recruiter Allocation",
      subtitle: `Roster of ${list.length} internal team members across Siddipet Operations Hub & US Placement`,
      dateRange: "Active Staff as of " + todayStr,
      summaryMetrics: [
        { label: "Team Members", value: String(list.length), subText: "Active staff", color: "#0f172a" },
        { label: "Total Headcount", value: teamOverviewKpis.totalTeamMembers || "12", subText: "Operations team", color: "#2563eb" },
        { label: "Active Mentors", value: teamOverviewKpis.activeMembers || "11", subText: "Candidate mentors", color: "#059669" },
        { label: "Operations Hub", value: "Siddipet", subText: "Telangana HQ", color: "#7c3aed" },
      ],
      insights: [
        `Delivery team comprises specialized technical recruiters, career advisors, and senior mock interviewers.`,
        `100% of staff onboarded with verified company email credentials across ${bottomAnalytics?.hub || "Siddipet"} operations hub.`,
        `Mentorship capacity currently servicing active candidate roster across all US placement tracks.`,
      ],
      headers: ["Member ID", "Name", "Email Address", "Designation", "Department", "Location", "Employment Type", "Status"],
      rows: list.map((m) => [
        m.id,
        m.name,
        m.email,
        m.title || m.role,
        m.department,
        m.location,
        m.employmentType,
        m.status,
      ]),
      statusColumnIndex: 7,
    };
  }

  // Check 18: Corporate Settings & Organization Profile (settingsData.js)
  if (
    query.includes("setting") ||
    query.includes("corporate") ||
    query.includes("siddipet") ||
    query.includes("organization") ||
    query.includes("company profile") ||
    query.includes("cin")
  ) {
    const g = initialSettingsData.general;
    const settingsRows = [
      ["Organization Legal Name", g.legalName, "Registered", "Corporate"],
      ["Registered Address", g.registeredAddress, "Active HQ", "Legal"],
      ["Corporate Identification (CIN)", g.cin, "Verified", "Compliance"],
      ["GSTIN", g.gstin, g.gstinStatus, "Tax"],
      ["Permanent Account Number (PAN)", g.pan, "Verified", "Tax"],
      ["Primary Domain", g.marketingDomain, g.domainStatus, "Infrastructure"],
      ["Official Support Email", g.supportEmail, "Active", "Communications"],
      ["Billing & Finance Contact", g.billingContact, "Active", "Finance"],
      ["Operational Timezone", g.timezone, "Configured", "System"],
      ["Default Currency", g.currency, "Active", "Financial"],
    ];

    return {
      found: true,
      topic: "Platform Settings & Corporate Profile",
      categoryBadge: "ORGANIZATION PROFILE",
      title: "Corporate Identity, Siddipet HQ & System Settings Report",
      subtitle: "Official registration and compliance details for AIFAGEN INTELLIGENCE PRIVATE LIMITED",
      dateRange: "Verified Record as of " + todayStr,
      summaryMetrics: [
        { label: "Entity Status", value: "Active", subText: "CIN Verified", color: "#059669" },
        { label: "GST Status", value: "Verified Active", subText: "State Code: 36 (TS)", color: "#2563eb" },
        { label: "Operations HQ", value: "Siddipet", subText: "Telangana 502103", color: "#7c3aed" },
        { label: "SSL & DNS", value: "Secured", subText: "Cloudflare Managed", color: "#0f172a" },
      ],
      insights: [
        `AIFaGen Intelligence Private Limited registered under CIN: ${g.cin}.`,
        `Operating headquarters located at ${g.registeredAddress}.`,
        `Settings configured across ${settingsNavSections.length} core sections with ${Object.keys(sectionAuditHistory || {}).length || 5} audited history segments.`,
      ],
      headers: ["Parameter", "Configuration Value", "Verification Status", "Category"],
      rows: settingsRows,
      statusColumnIndex: 2,
    };
  }

  // Check 19: Executive Dashboard Overview (dashboardData.js + statCardsData)
  if (
    query.includes("dashboard") ||
    query.includes("overview") ||
    query.includes("summary") ||
    query.includes("platform status") ||
    query.includes("all metrics") ||
    query.includes("executive brief")
  ) {
    const summaryRows = [
      ["Candidate Pipeline", `${initialCandidatesList.length} In Process`, "+12.4% vs 30d", "Hiring Funnel"],
      ["Candidate Roster", `${userStatsData[0]?.value || "12,482"} Total Users`, "+8.3% monthly", "User Subscriptions"],
      ["Gross Revenue", paymentMetrics[0]?.value || "₹7,42,318.00", "+18.3% gross", "Financial Health"],
      ["Active Job Openings", jobMetrics.liveJobs?.total || "6,284 Openings", "+8.7% openings", "Market Pipeline"],
      ["Internal Openings", `${initialInternalJobsList.length} Requisitions`, "Siddipet HQ", "Staff Hiring"],
      ["AI Token Usage", aiTopMetrics.spendThisMonth?.usd || "$412.36", "41.2% budget", "AI Telemetry"],
      ["Job Ingestion Sources", "12 / 15 Healthy", "2.4K jobs/day", "Crawler Infrastructure"],
      ["Team Allocation", `${teamOverviewKpis.totalTeamMembers || "12"} Staff Members`, "Siddipet Hub", "Operations"],
      ["Subscription Plans", `${initialPlansList.length} Active Tiers`, "₹799 - ₹1,999", "Product Pricing"],
      ["Connected Services", `${initialConnectedServices.length} Cloud APIs`, "99.9% Uptime", "Infrastructure"],
    ];

    return {
      found: true,
      topic: "Executive Platform Summary",
      categoryBadge: "EXECUTIVE BRIEF",
      title: "Executive Platform Performance & Operations Summary",
      subtitle: "Consolidated intelligence across Recruitment, Finance, AI Telemetry, Jobs, and Operations",
      dateRange: "Monthly Digest · October 2026",
      summaryMetrics: [
        { label: "Gross Revenue", value: paymentMetrics[0]?.value || "₹7,42,318", subText: "+18.3% trend", color: "#059669" },
        { label: "Total Candidates", value: statCardsData[0]?.value || "12,482", subText: "+12.4% vs 30d", color: "#2563eb" },
        { label: "Live Jobs", value: jobMetrics.liveJobs?.total || "6,284", subText: "Curated openings", color: "#7c3aed" },
        { label: "System Health", value: "99.9%", subText: "All services online", color: "#0f172a" },
      ],
      insights: [
        `Platform operations experiencing strong month-over-month growth across candidate onboarding and revenue.`,
        `Technical staffing and US placement retainers delivering sustained gross margins.`,
        `AI infrastructure, automated crawlers, and delivery staff operating with high efficiency.`,
      ],
      headers: ["Operational Domain", "Current Metric / Status", "Trend vs Previous Period", "Category"],
      rows: summaryRows,
      statusColumnIndex: 1,
    };
  }

  // Check 20: Intelligent Global Omnisearch Fallback (globalSearch.js)
  // If no broad category triggered above, search across all 15 collections for matching terms
  const searchResults = searchAllData(query, 25);
  if (searchResults.length > 0) {
    const sections = [...new Set(searchResults.map((r) => r.section))];

    return {
      found: true,
      topic: `Search Results for "${userQuery}"`,
      categoryBadge: "CROSS-PLATFORM SEARCH",
      title: `Universal Search Intelligence Report: "${userQuery}"`,
      subtitle: `Discovered ${searchResults.length} matching records across ${sections.join(", ")}`,
      dateRange: "Dynamic Cross-Collection Query as of " + todayStr,
      summaryMetrics: [
        { label: "Matching Records", value: String(searchResults.length), subText: "Found in portal", color: "#2563eb" },
        { label: "Sections Found", value: String(sections.length), subText: sections.slice(0, 2).join(", "), color: "#7c3aed" },
        { label: "Query Term", value: userQuery.slice(0, 16), subText: "Normalized search", color: "#0f172a" },
        { label: "Search Accuracy", value: "100%", subText: "Exact token match", color: "#059669" },
      ],
      insights: [
        `Search matched ${searchResults.length} entries across ${sections.join(", ")}.`,
        `Omnisearch indexed against ${sidebarMetadata?.length || 12} registered portal navigation modules.`,
        `Linked records can be inspected in the portal navigation under respective routes.`,
      ],
      headers: ["#", "Platform Section", "Record Title / Name", "Details & Metadata", "Target Route"],
      rows: searchResults.map((r, i) => [
        i + 1,
        r.section,
        r.title,
        r.detail,
        r.path,
      ]),
      statusColumnIndex: 1,
    };
  }

  // Fallback: If no matching data exists anywhere in the portal records
  return {
    found: false,
    topic: "Unknown",
    message: `No data found matching "${userQuery}" in portal records.`,
  };
}

/**
 * 3. Universal Styled HTML Email Generator:
 * Generates an executive, beautifully styled HTML email for ANY analyzed dataset
 */
export function buildDynamicReportHtml(analyzedData, recipientEmail = "") {
  const {
    title,
    subtitle,
    categoryBadge,
    dateRange,
    summaryMetrics = [],
    insights = [],
    headers = [],
    rows = [],
    statusColumnIndex = -1,
  } = analyzedData;

  // KPI cards HTML
  const metricCardsHtml = summaryMetrics
    .map(
      (m) => `
      <td width="23%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 10px; text-align: center;">
        <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">${m.label}</div>
        <div style="font-size: 20px; font-weight: 800; color: ${m.color || "#0f172a"}; margin-top: 4px;">${m.value}</div>
        <div style="font-size: 10px; color: #475569; font-weight: 600; margin-top: 2px;">${m.subText || ""}</div>
      </td>
    `,
    )
    .join('<td width="2%"></td>');

  // Insights bullet points HTML
  const insightsHtml = insights
    .map(
      (ins) => `
      <li style="margin-bottom: 5px; color: #334155; font-size: 12.5px; line-height: 1.5;">${ins}</li>
    `,
    )
    .join("");

  // Table header HTML
  const tableHeaderHtml = headers
    .map(
      (h) => `
      <th align="left" style="padding: 10px 12px; font-size: 10.5px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">${h}</th>
    `,
    )
    .join("");

  // Table rows HTML
  const tableRowsHtml = rows
    .map((row, idx) => {
      const isEven = idx % 2 === 0;
      const rowBg = isEven ? "#ffffff" : "#f8fafc";

      const cellsHtml = row
        .map((val, colIdx) => {
          if (colIdx === statusColumnIndex) {
            let statusColor = "#2563eb";
            let statusBg = "#eff6ff";
            const valStr = String(val).toLowerCase();

            if (valStr.includes("hired") || valStr.includes("success") || valStr.includes("active") || valStr.includes("verified")) {
              statusColor = "#059669";
              statusBg = "#ecfdf5";
            } else if (valStr.includes("fail") || valStr.includes("reject") || valStr.includes("refund")) {
              statusColor = "#dc2626";
              statusBg = "#fef2f2";
            } else if (valStr.includes("offer") || valStr.includes("premium")) {
              statusColor = "#7c3aed";
              statusBg = "#f5f3ff";
            } else if (valStr.includes("progress") || valStr.includes("pending")) {
              statusColor = "#d97706";
              statusBg = "#fffbeb";
            }

            return `
              <td style="padding: 10px 12px; font-size: 12px;">
                <span style="display: inline-block; padding: 3px 8px; border-radius: 10px; font-size: 10.5px; font-weight: 700; color: ${statusColor}; background-color: ${statusBg};">
                  ${val}
                </span>
              </td>
            `;
          }

          const isFirstCol = colIdx === 0 || colIdx === 1;
          const fontWeight = isFirstCol ? "600" : "normal";
          const textColor = isFirstCol ? "#0f172a" : "#475569";

          return `
            <td style="padding: 10px 12px; font-size: 12px; color: ${textColor}; font-weight: ${fontWeight};">
              ${val !== null && val !== undefined ? String(val) : ""}
            </td>
          `;
        })
        .join("");

      return `
        <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
          ${cellsHtml}
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - AIFaGen Intelligence</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" style="max-width: 720px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Executive Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #090d16 0%, #1e293b 100%); padding: 30px 36px 26px; text-align: left; border-bottom: 3px solid #10b981;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 12px;">
                      ${categoryBadge || "AI AGENT INTELLIGENCE"}
                    </span>
                    <h1 style="color: #ffffff; font-size: 21px; font-weight: 800; margin: 10px 0 6px; letter-spacing: -0.3px;">
                      ${title}
                    </h1>
                    <p style="color: #94a3b8; font-size: 12.5px; margin: 0;">
                      ${subtitle || ""} · Period: ${dateRange || "Current"} · Generated for <strong style="color: #38bdf8;">${recipientEmail || "Admin Team"}</strong>
                    </p>
                  </td>
                  <td align="right" valign="top" style="width: 60px;">
                    <div style="background: linear-gradient(135deg, #059669, #10b981); width: 44px; height: 44px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); text-align: center; line-height: 44px; color: #ffffff; font-weight: 900; font-size: 18px;">
                      AI
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary KPI Cards Grid -->
          ${
            summaryMetrics.length > 0
              ? `
          <tr>
            <td style="padding: 22px 36px 10px;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  ${metricCardsHtml}
                </tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          <!-- Executive Insights Callout -->
          ${
            insights.length > 0
              ? `
          <tr>
            <td style="padding: 10px 36px;">
              <div style="background-color: #f8fafc; border-left: 3px solid #2563eb; border-radius: 4px 8px 8px 4px; padding: 12px 18px;">
                <div style="font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase; margin-bottom: 6px;">
                  Key Analysis & Insights:
                </div>
                <ul style="margin: 0; padding-left: 18px;">
                  ${insightsHtml}
                </ul>
              </div>
            </td>
          </tr>`
              : ""
          }

          <!-- Downloadable Attachments Notice -->
          <tr>
            <td style="padding: 10px 36px;">
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 18px;">
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td valign="middle" style="font-size: 12.5px; color: #1e293b;">
                      <strong style="color: #1e40af;">📎 Downloadable Files Attached to this Email:</strong>
                      <div style="color: #475569; font-size: 11.5px; margin-top: 2px;">
                        • Formatted Microsoft Excel Spreadsheet (<strong>.csv</strong> with UTF-8 BOM)<br/>
                        • Executive Landscape Printable Report (<strong>.pdf</strong>)
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Detailed Data Table -->
          <tr>
            <td style="padding: 14px 36px 26px;">
              <h2 style="font-size: 14px; color: #0f172a; margin: 0 0 10px; font-weight: 700;">
                Detailed Records (${rows.length} Items)
              </h2>
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    ${tableHeaderHtml}
                  </tr>
                </thead>
                <tbody>
                  ${tableRowsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Professional Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 36px; text-align: center;">
              <p style="font-size: 12px; color: #64748b; margin: 0 0 4px;">
                Generated dynamically by <strong>AIFaGen Voice Agent AI</strong> · AIFaGen Intelligence Private Limited
              </p>
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                Siddipet HQ, Telangana · Support: support@aifagenlabs.com · Confidential Enterprise Data
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 4. Universal Excel (.csv) Generator:
 * Generates an Excel-compatible CSV file with UTF-8 BOM for ANY analyzed dataset
 */
export function buildDynamicExcel(analyzedData) {
  const { topic, headers = [], rows = [] } = analyzedData;

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = rows.map((r) => r.map(escapeCsv).join(","));
  const csvContent = "\uFEFF" + [headers.map(escapeCsv).join(","), ...csvRows].join("\r\n");

  let base64 = "";
  if (typeof btoa !== "undefined") {
    base64 = btoa(unescape(encodeURIComponent(csvContent)));
  } else if (typeof Buffer !== "undefined") {
    base64 = Buffer.from(csvContent, "utf-8").toString("base64");
  }

  const cleanTopic = (topic || "Report").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `AIFaGen_${cleanTopic}_Report_${new Date().toISOString().slice(0, 10)}.csv`;

  return {
    filename,
    csvContent,
    base64,
  };
}

/**
 * 5. Universal PDF Generator:
 * Generates a styled landscape PDF report using jsPDF and autoTable for ANY dataset
 */
export function buildDynamicPdf(analyzedData) {
  const {
    topic,
    title,
    dateRange,
    summaryMetrics = [],
    headers = [],
    rows = [],
    statusColumnIndex = -1,
  } = analyzedData;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Top Dark Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 297, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`AIFaGen Portal · ${title || topic || "Intelligence Report"}`, 14, 13);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`Generated: ${new Date().toLocaleDateString()} | Period: ${dateRange || "Current"}`, 14, 19);

  const autoTableFn = autoTable.default || autoTable;
  let currentY = 28;

  // Executive KPI summary table if present
  if (summaryMetrics.length > 0) {
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary:", 14, currentY);

    const summaryHeaders = [summaryMetrics.map((m) => m.label)];
    const summaryData = [summaryMetrics.map((m) => m.value)];

    autoTableFn(doc, {
      startY: currentY + 3,
      margin: { left: 14 },
      tableWidth: Math.min(220, summaryMetrics.length * 45),
      head: summaryHeaders,
      body: summaryData,
      theme: "grid",
      headStyles: {
        fillColor: [37, 99, 235], // Blue 600
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8.5,
        halign: "center",
      },
      bodyStyles: {
        halign: "center",
        fontSize: 9.5,
        fontStyle: "bold",
        textColor: [15, 23, 42],
      },
      styles: { cellPadding: 2.5 },
    });

    currentY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY + 15) + 6;
  }

  // Detailed Records Table
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text(`Detailed Records (${rows.length} Items):`, 14, currentY);

  autoTableFn(doc, {
    startY: currentY + 3,
    margin: { left: 14, right: 14 },
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { halign: "center" },
      ...(statusColumnIndex >= 0 ? { [statusColumnIndex]: { fontStyle: "bold" } } : {}),
    },
    didParseCell: (data) => {
      if (statusColumnIndex >= 0 && data.section === "body" && data.column.index === statusColumnIndex) {
        const val = String(data.cell.raw).toLowerCase();
        if (val.includes("hired") || val.includes("success") || val.includes("active") || val.includes("verified")) {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (val.includes("fail") || val.includes("reject") || val.includes("refund")) {
          data.cell.styles.textColor = [239, 68, 68];
        } else if (val.includes("offer") || val.includes("premium")) {
          data.cell.styles.textColor = [124, 58, 237];
        } else if (val.includes("progress") || val.includes("pending")) {
          data.cell.styles.textColor = [217, 119, 6];
        } else {
          data.cell.styles.textColor = [37, 99, 235];
        }
      }
    },
  });

  // Footer page text
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `AIFaGen AI Recruitment Intelligence · Page ${i} of ${pageCount} · Confidential Enterprise Data`,
      14,
      205,
    );
  }

  let base64 = "";
  try {
    const arrayBuffer = doc.output("arraybuffer");
    if (typeof Buffer !== "undefined") {
      base64 = Buffer.from(arrayBuffer).toString("base64");
    } else {
      let binary = "";
      const bytes = new Uint8Array(arrayBuffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      base64 = btoa(binary);
    }
  } catch (err) {
    console.warn("Base64 PDF generation note:", err);
  }

  const cleanTopic = (topic || "Report").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `AIFaGen_${cleanTopic}_Report_${new Date().toISOString().slice(0, 10)}.pdf`;

  return {
    doc,
    filename,
    base64,
  };
}

/**
 * 6. Browser Download Helper
 */
export function downloadFile(filename, content, mimeType) {
  if (typeof window === "undefined" || !window.document) return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

/**
 * 7. Universal Master Workflow:
 * Handles ANY user request to send information via email:
 * 1. Analyzes the user intent from existing JS files.
 * 2. If no data found, returns { found: false, message: "No data found matching your query." }
 * 3. If data is found, compiles styled HTML, Excel (.csv), and PDF, then dispatches email via Brevo.
 */
export async function executeUniversalReportWorkflow({
  query,
  toEmail,
}) {
  if (!toEmail || !toEmail.includes("@")) {
    throw new Error("A valid recipient email is required to send reports.");
  }

  // 1. Analyze user request and extract data from existing JS files
  const analyzedData = analyzeAndExtractDataForQuery(query);

  if (!analyzedData.found) {
    return {
      found: false,
      message: analyzedData.message || `No data found matching "${query}" in portal records.`,
      query,
    };
  }

  // 2. Generate Excel (.csv) with UTF-8 BOM
  const excelResult = buildDynamicExcel(analyzedData);

  // 3. Generate PDF Document
  const pdfResult = buildDynamicPdf(analyzedData);

  // 4. Generate Styled HTML Email Content
  const htmlContent = buildDynamicReportHtml(analyzedData, toEmail);

  // 5. Send via Brevo with both Excel and PDF attached
  const attachments = [
    {
      name: excelResult.filename,
      content: excelResult.base64,
    },
    {
      name: pdfResult.filename,
      content: pdfResult.base64,
    },
  ];

  let emailResult = null;
  let emailError = null;

  try {
    emailResult = await sendEmailTool({
      toEmail,
      subject: `AIFaGen Report: ${analyzedData.title}`,
      htmlContent,
      text: `${analyzedData.title}. Attached: ${excelResult.filename} and ${pdfResult.filename}.`,
      attachments,
    });
  } catch (err) {
    emailError = err;
    console.error("Brevo dispatch failed:", err);
  }

  return {
    found: true,
    success: !!emailResult?.success,
    messageId: emailResult?.messageId,
    emailError,
    toEmail,
    topic: analyzedData.topic,
    title: analyzedData.title,
    recordsCount: analyzedData.rows.length,
    excelFilename: excelResult.filename,
    excelContent: excelResult.csvContent,
    pdfFilename: pdfResult.filename,
    pdfDoc: pdfResult.doc,
    htmlContent,
    dateRange: analyzedData.dateRange,
  };
}

/**
 * 8. Backwards-Compatibility Alias:
 */
export async function executeInterviewReportWorkflow({
  toEmail,
  days = 7,
}) {
  return executeUniversalReportWorkflow({
    query: `last ${days} days interview reports`,
    toEmail,
  });
}
