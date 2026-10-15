const AUDIT_STORAGE_KEY = "aifagen-audit-log-events";

export const initialAuditLogs = [
  {
    id: "evt_01HBK3Z9F2Q5V7D4M1",
    date: "Oct 14, 2026",
    time: "05:24 PM",
    actor: "Rohith P",
    actorRole: "Super Admin",
    actorEmail: "rohith.p@aifagenlabs.com",
    actorType: "user",
    actorInitials: "RP",
    category: "Plan changes",
    eventTitle: "Candidate plan changed",
    eventSummary: "Upgraded candidate plan: Basic → Premium",
    targetName: "Arjun Kumar",
    targetType: "User",
    targetId: "usr_101",
    whatChanged: {
      field: "plan",
      previousValue: "Basic",
      newValue: "Premium",
      reason: "Candidate upgraded to Full-Service US Placement Bundle ($1,299/mo retainer)",
    },
    status: "Success",
  },
  {
    id: "evt_01HBK3Z9F2Q5V7D4M2",
    date: "Oct 14, 2026",
    time: "03:15 PM",
    actor: "Rohith P",
    actorRole: "Super Admin",
    actorEmail: "rohith.p@aifagenlabs.com",
    actorType: "user",
    actorInitials: "RP",
    category: "Profile edits",
    eventTitle: "Candidate profile edited",
    eventSummary: "Updated candidate area of interest and mobile number",
    targetName: "Deepa Nair",
    targetType: "User",
    targetId: "usr_104",
    whatChanged: {
      field: "areaOfInterest & mobile",
      previousValue: "Software Engineer",
      newValue: "AI / ML",
      reason: "Admin verified candidate's MS thesis in Generative AI; ATS keywords updated",
    },
    status: "Success",
  },
  {
    id: "evt_01HBK3Z9F2Q5V7D4M3",
    date: "Oct 14, 2026",
    time: "01:10 PM",
    actor: "Rohith P",
    actorRole: "Super Admin",
    actorEmail: "rohith.p@aifagenlabs.com",
    actorType: "user",
    actorInitials: "RP",
    category: "Refunds",
    eventTitle: "Refund issued",
    eventSummary: "Processed partial refund: $189.00",
    targetName: "Karan Malhotra",
    targetType: "Payment",
    targetId: "pay_K8372",
    whatChanged: {
      field: "refundAmount",
      previousValue: "$0.00",
      newValue: "$189.00",
      reason: "Duplicate charge refunded per candidate request",
    },
    status: "Success",
  },
  {
    id: "evt_01HBK3Z9F2Q5V7D4M4",
    date: "Oct 14, 2026",
    time: "11:05 AM",
    actor: "Rohith P",
    actorRole: "Super Admin",
    actorEmail: "rohith.p@aifagenlabs.com",
    actorType: "user",
    actorInitials: "RP",
    category: "Internal job changes",
    eventTitle: "Internal opening posted",
    eventSummary: "Created internal job: US Technical Recruiter (Siddipet HQ)",
    targetName: "US Technical Recruiter",
    targetType: "Internal Job",
    targetId: "ijob_902",
    whatChanged: {
      field: "posting",
      previousValue: "None",
      newValue: "Active (Visible)",
      reason: "Expanding candidate marketing operations team in Siddipet",
    },
    status: "Success",
  },
  {
    id: "evt_01HBK3Z9F2Q5V7D4M5",
    date: "Oct 13, 2026",
    time: "04:30 PM",
    actor: "Rohith P",
    actorRole: "Super Admin",
    actorEmail: "rohith.p@aifagenlabs.com",
    actorType: "user",
    actorInitials: "RP",
    category: "Admin changes",
    eventTitle: "New admin added",
    eventSummary: "Added new admin: operations@aifagenlabs.com",
    targetName: "operations@aifagenlabs.com",
    targetType: "Admin",
    targetId: "adm_03",
    whatChanged: {
      field: "admin_access",
      previousValue: "None",
      newValue: "Operations Admin",
      reason: "Appointed Operations Head for Siddipet Delivery Center",
    },
    status: "Success",
  },
];

export function getStoredAuditLogs() {
  try {
    const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return initialAuditLogs;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialAuditLogs;
  } catch {
    return initialAuditLogs;
  }
}

export function logAuditAction({
  admin = "Rohith P",
  adminEmail = "rohith.p@aifagenlabs.com",
  category = "Admin changes",
  eventTitle,
  eventSummary,
  targetName,
  targetType,
  targetId = `tgt_${Date.now()}`,
  field = "record",
  previousValue = "-",
  newValue = "-",
  reason = "Administrative update",
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const newEntry = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    date: dateStr,
    time: timeStr,
    actor: admin,
    actorRole: "Super Admin",
    actorEmail: adminEmail,
    actorType: "user",
    actorInitials: admin.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
    category,
    eventTitle,
    eventSummary,
    targetName,
    targetType,
    targetId,
    whatChanged: {
      field,
      previousValue: String(previousValue),
      newValue: String(newValue),
      reason,
    },
    status: "Success",
  };

  try {
    const existing = getStoredAuditLogs();
    const updated = [newEntry, ...existing];
    window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to persist audit log", e);
  }

  return newEntry;
}
