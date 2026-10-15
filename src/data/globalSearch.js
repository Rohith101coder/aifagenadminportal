import { adminActivities, expiringPlans, jobSources as dashboardSources } from "./dashboardData.js";
import { initialUsersList } from "./usersData.js";
import { initialJobsList } from "./jobsData.js";
import { initialPaymentsList } from "./paymentsData.js";
import { initialTeamMembersList } from "./teamData.js";
import { initialCandidatesList } from "./interviewsData.js";
import { initialAiFeaturesList } from "./aiUsageData.js";
import { initialAuditLogs } from "./auditLogData.js";
import { initialPlansList, initialPlanSubscribers } from "./plansData.js";
import { initialReportsList } from "./reportsData.js";
import { initialJobSourcesList } from "./jobSourcesData.js";
import { settingsNavSections } from "./settingsData.js";

const collections = [
  { section: "Users", path: "/users", rows: initialUsersList, title: ["name"], detail: ["email", "phone", "plan"] },
  { section: "Jobs", path: "/jobs/all", rows: initialJobsList, title: ["title"], detail: ["company", "location", "source", "status"] },
  { section: "Payments", path: "/payments", rows: initialPaymentsList, title: ["userName", "customerName", "name", "invoiceNo", "paymentId"], detail: ["email", "status", "plan", "amount", "method"] },
  { section: "Team members", path: "/team-members", rows: initialTeamMembersList, title: ["name"], detail: ["email", "role", "department", "status"] },
  { section: "Interviews", path: "/interviews", rows: initialCandidatesList, title: ["name"], detail: ["email", "jobTitle", "company", "stage", "status"] },
  { section: "AI usage", path: "/ai-usage", rows: initialAiFeaturesList, title: ["name", "feature", "featureName"], detail: ["category", "model", "audience", "status"] },
  { section: "Audit log", path: "/audit-log", rows: initialAuditLogs, title: ["eventSummary", "action"], detail: ["actor", "targetName", "targetId"] },
  { section: "Plans", path: "/plans", rows: initialPlansList, title: ["name", "planName"], detail: ["description", "status", "price"] },
  { section: "Subscribers", path: "/plans", rows: initialPlanSubscribers, title: ["name", "userName"], detail: ["email", "plan", "status"] },
  { section: "Reports", path: "/reports", rows: initialReportsList, title: ["name", "title", "reportName"], detail: ["category", "owner", "status"] },
  { section: "Job sources", path: "/jobs/sources", rows: initialJobSourcesList, title: ["name"], detail: ["domain", "category", "region", "status"] },
  { section: "Job sources", path: "/jobs/sources", rows: dashboardSources, title: ["source"], detail: ["status", "lastRun", "nextRun"] },
  { section: "Expiring plans", path: "/dashboard", rows: expiringPlans, title: ["name"], detail: ["email", "plan", "expiryDate"] },
  { section: "Admin activity", path: "/dashboard", rows: adminActivities, title: ["actionText", "adminName"], detail: ["detail", "badge", "timestamp"] },
  { section: "Settings", path: "/settings", rows: settingsNavSections, title: ["name"], detail: ["desc"] },
];

const valuesOf = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(valuesOf);
  if (typeof value === "object") return Object.values(value).flatMap(valuesOf);
  return [String(value)];
};

const fieldValues = (row, fields) => fields.flatMap((field) => valuesOf(row[field]));

export function matchesGlobalSearch(row, query) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const searchableText = valuesOf(row).join(" ").toLocaleLowerCase();
  return terms.every((term) => searchableText.includes(term));
}

export function searchAllData(query, limit = 20) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const results = [];
  for (const collection of collections) {
    for (const [index, row] of collection.rows.entries()) {
      if (!matchesGlobalSearch(row, normalizedQuery)) continue;

      const title = fieldValues(row, collection.title).find(Boolean) ?? `${collection.section} result`;
      const detail = fieldValues(row, collection.detail).find(Boolean) ?? collection.section;
      results.push({
        id: `${collection.section}-${row.id ?? index}`,
        section: collection.section,
        title,
        detail,
        path: collection.path,
      });
    }
  }

  return results.slice(0, limit);
}
