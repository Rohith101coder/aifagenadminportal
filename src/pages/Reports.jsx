import { useMemo, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronDown,
  FiDownload,
  FiFileText,
  FiMoreHorizontal,
  FiPlus,
  FiSearch,
  FiSettings,
  FiStar,
  FiUser,
  FiX,
} from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { initialAiFeaturesList } from "../data/aiUsageData";
import { initialCandidatesList } from "../data/interviewsData";
import { initialJobSourcesList } from "../data/jobSourcesData";
import { initialJobsList } from "../data/jobsData";
import { initialPaymentsList } from "../data/paymentsData";
import { initialUsersList } from "../data/usersData";
import {
  initialReportsList,
  reportsActivityTimeline,
} from "../data/reportsData";
import { matchesGlobalSearch } from "../data/globalSearch";
import "./Reports.css";

const categories = ["Finance", "Users", "Hiring", "AI", "Jobs", "System"];
const scheduleOptions = [
  "Daily · 09:00 IST",
  "Weekly · Monday, 09:00 IST",
  "Monthly · 1st, 09:00 IST",
  "Not scheduled",
];
const reportColumns = [
  { key: "title", label: "Report" },
  { key: "category", label: "Category" },
  { key: "schedule", label: "Schedule" },
  { key: "lastRun", label: "Last run (IST)" },
  { key: "owner", label: "Owner" },
  { key: "status", label: "Status" },
];

const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const toLocalDateTime = () => {
  const now = new Date();
  return {
    date: now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }),
    time: now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }),
    timestamp: now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      timeZoneName: "short",
    }),
  };
};

const getLastRunTimestamp = (report) =>
  report.lastRunValue ||
  Date.parse(`${report.lastRunDate} ${report.lastRunTime}`) ||
  0;

function createReportRows(report) {
  if (report.category === "Finance") {
    return initialPaymentsList.map((payment) => ({
      date: payment.paymentDate,
      invoice: payment.invoiceNo,
      plan: payment.plan,
      amount: payment.amount,
      status: payment.status,
    }));
  }
  if (report.category === "Users") {
    const plans = new Map();
    initialUsersList.forEach((user) => {
      const entry = plans.get(user.plan) || {
        plan: user.plan,
        users: 0,
        activeAccounts: 0,
        aiCalls: 0,
        savedJobs: 0,
      };
      entry.users += 1;
      entry.activeAccounts += user.accountStatus === "Active" ? 1 : 0;
      entry.aiCalls += user.aiCalls || 0;
      entry.savedJobs += user.savedJobs || 0;
      plans.set(user.plan, entry);
    });
    return [...plans.values()];
  }
  if (report.category === "Hiring") {
    const stages = new Map();
    initialCandidatesList.forEach((candidate) => {
      const stage = candidate.currentStage || candidate.status;
      stages.set(stage, (stages.get(stage) || 0) + 1);
    });
    return [...stages].map(([stage, candidates]) => ({ stage, candidates }));
  }
  if (report.category === "Jobs") {
    const sources = new Map();
    initialJobsList.forEach((job) => {
      const entry = sources.get(job.source) || {
        source: job.source,
        jobs: 0,
        active: 0,
        applications: 0,
        averageQuality: 0,
      };
      entry.jobs += 1;
      entry.active += job.status === "Active" ? 1 : 0;
      entry.applications += Number(job.appsCount) || 0;
      entry.averageQuality += Number(job.quality) || 0;
      sources.set(job.source, entry);
    });
    return [...sources.values()].map((source) => ({
      ...source,
      averageQuality: source.jobs
        ? `${(source.averageQuality / source.jobs).toFixed(1)}%`
        : "0%",
    }));
  }
  if (report.category === "AI") {
    return initialAiFeaturesList.map((feature) => ({
      feature: feature.name,
      model: feature.primaryModel,
      runs30d: feature.runs30d,
      costUSD: feature.cost,
      successRate: feature.successPct,
      status: feature.status,
    }));
  }
  return initialJobSourcesList.map((source) => ({
    source: source.name,
    status: source.status,
    jobsFetched: source.jobsFetched,
    netNewJobs: source.netNewJobs,
    failureRate: source.failureRate,
    nextRun: source.nextRun,
  }));
}

function getReportRows(report) {
  const values = createReportRows(report);
  if (report.title.toLowerCase().includes("summary")) {
    return [
      { metric: "Total users", value: "12,482" },
      { metric: "Paying users", value: "3,842" },
      { metric: "Monthly recurring revenue", value: "₹28,432.50" },
      { metric: "Jobs added (30d)", value: "8,432" },
      { metric: "AI requests (30d)", value: "48,762" },
    ];
  }
  if (report.title.toLowerCase().includes("pipeline")) {
    return [
      { stage: "Applied", candidates: initialCandidatesList.length },
      ...createReportRows({ ...report, title: "candidate stages" }),
    ];
  }
  if (report.title.toLowerCase().includes("source")) {
    return createReportRows({ ...report, category: "System" });
  }
  return values;
}

function downloadCsv(report, rows, period) {
  const fields = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const csv = [
    [ ...fields, "Report period" ].map(escapeCsv).join(","),
    ...rows.map((row) =>
      [...fields.map((field) => row[field]), period].map(escapeCsv).join(","),
    ),
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function createBlankReport() {
  return {
    title: "",
    description: "",
    category: "Finance",
    schedule: "Not scheduled",
  };
}

export default function Reports({ searchTerm = "", dateRange = "Last 30 days" }) {
  const [reports, setReports] = useState(initialReportsList);
  const [activity, setActivity] = useState(reportsActivityTimeline);
  const [topTab, setTopTab] = useState("Library");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Recently run");
  const [menuReportId, setMenuReportId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(createBlankReport);
  const [previewRows, setPreviewRows] = useState([]);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(null);
  const nextReportId = useRef(initialReportsList.length + 1);

  const notify = (message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3500);
  };

  const addActivity = (action, report, extra = {}) => {
    const now = toLocalDateTime();
    setActivity((current) => [
      {
        id: `activity-${Date.now()}-${Math.random()}`,
        actor: "Rohith P",
        action,
        target: report.title,
        timestamp: `${now.date}, ${now.time} IST`,
        iconType: action === "exported" ? "download" : "file",
        iconBg: "#eff6ff",
        iconColor: "#2563eb",
        ...extra,
      },
      ...current,
    ]);
  };

  const matchingReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return reports
      .filter((report) => {
        const matchesCategory =
          selectedCategory === "All" || report.category === selectedCategory;
        const matchesOwner =
          ownerFilter === "All" || report.owner === ownerFilter;
        const matchesQuery = (!query || `${report.title} ${report.description} ${report.category} ${report.owner}`
          .toLowerCase().includes(query)) && matchesGlobalSearch(report, searchTerm);
        const matchesTab =
          topTab !== "Scheduled" || report.schedule !== "Not scheduled";
        return matchesCategory && matchesOwner && matchesQuery && matchesTab;
      })
      .sort((first, second) => {
        if (sortBy === "Name") return first.title.localeCompare(second.title);
        if (sortBy === "Category") return first.category.localeCompare(second.category);
        return getLastRunTimestamp(second) - getLastRunTimestamp(first) ||
          reports.indexOf(first) - reports.indexOf(second);
      });
  }, [reports, searchTerm, searchQuery, selectedCategory, ownerFilter, topTab, sortBy]);

  const pinnedReports = matchingReports.filter((report) => report.isPinned);
  const otherReports = matchingReports.filter((report) => !report.isPinned);
  const owners = [...new Set(reports.map((report) => report.owner))];
  const pinnedCount = reports.filter((report) => report.isPinned).length;
  const scheduledCount = reports.filter(
    (report) => report.schedule !== "Not scheduled",
  ).length;
  const generatedMonthCount =
    12 + activity.filter((item) => item.id.startsWith("activity-") && item.action === "generated").length;
  const deliveryIssuesCount = activity.filter(
    (item) => item.badgeType === "error",
  ).length;

  const togglePin = (reportId) => {
    const report = reports.find((item) => item.id === reportId);
    setReports((current) =>
      current.map((item) =>
        item.id === reportId ? { ...item, isPinned: !item.isPinned } : item,
      ),
    );
    notify(`${report?.title || "Report"} ${report?.isPinned ? "unpinned" : "pinned"}.`);
  };

  const runReport = (report) => {
    const now = toLocalDateTime();
    const rows = getReportRows(report);
    setReports((current) =>
      current.map((item) =>
        item.id === report.id
          ? {
              ...item,
              lastRunDate: now.date,
              lastRunTime: now.time,
              lastRunValue: Date.now(),
              status: "Completed",
            }
          : item,
      ),
    );
    setPreviewRows(rows);
    setDialog({ type: "preview", report });
    addActivity("generated", report);
    setMenuReportId(null);
  };

  const exportReport = (report, rows = getReportRows(report)) => {
    downloadCsv(report, rows, dateRange);
    addActivity("exported", report, { target: `${report.title} (CSV)` });
    setMenuReportId(null);
    notify(`${report.title} exported as CSV.`);
  };

  const saveReport = (event) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    if (dialog?.type === "edit") {
      setReports((current) =>
        current.map((report) =>
          report.id === dialog.report.id
            ? {
                ...report,
                title,
                description: form.description.trim(),
                category: form.category,
                schedule: form.schedule,
              }
            : report,
        ),
      );
      addActivity("updated", { title });
      notify(`${title} updated.`);
    } else {
      const ownerInitials = "RP";
      const newReport = {
        id: `report-${nextReportId.current++}`,
        title,
        description: form.description.trim(),
        category: form.category,
        schedule: form.schedule,
        lastRunDate: "Never",
        lastRunTime: "—",
        owner: "Rohith P",
        ownerType: "user",
        ownerInitials,
        status: "Not run",
        isPinned: false,
      };
      setReports((current) => [newReport, ...current]);
      addActivity("created", newReport);
      notify(`${title} created.`);
    }
    setDialog(null);
  };

  const openCreateDialog = () => {
    setForm(createBlankReport());
    setDialog({ type: "create" });
  };

  const openEditDialog = (report) => {
    setForm({
      title: report.title,
      description: report.description,
      category: report.category,
      schedule: report.schedule,
    });
    setDialog({ type: "edit", report });
    setMenuReportId(null);
  };

  const removeSchedule = (report) => {
    setReports((current) =>
      current.map((item) =>
        item.id === report.id ? { ...item, schedule: "Not scheduled" } : item,
      ),
    );
    addActivity("unscheduled", report);
    setMenuReportId(null);
    notify(`${report.title} removed from the schedule.`);
  };

  const handleHistoryAction = (entry) => {
    const targetTitle = entry.target.replace(/ \(.*\)$/, "");
    const report = reports.find((item) => item.title === targetTitle);
    if (report) runReport(report);
    else notify(`No report named "${targetTitle}" is available in the library.`);
  };

  const exportHistory = () => {
    const fields = ["timestamp", "actor", "action", "target", "badge"];
    const csv = [
      fields.map(escapeCsv).join(","),
      ...visibleActivity.map((item) =>
        fields.map((field) => escapeCsv(item[field])).join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "reports-history.csv";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    notify(`Exported ${visibleActivity.length} history events.`);
  };

  const renderTimelineIcon = (type) => {
    if (type === "user") return <FiUser size={13} />;
    if (type === "download") return <FiDownload size={13} />;
    if (type === "gear") return <FiSettings size={13} />;
    if (type === "alert") return <FiAlertTriangle size={13} />;
    return <FiFileText size={13} />;
  };

  const renderReportRow = (report) => (
    <tr key={report.id} className="report-row">
      <td>
        <button
          className="star-toggle-btn"
          aria-label={`${report.isPinned ? "Unpin" : "Pin"} ${report.title}`}
          aria-pressed={report.isPinned}
          onClick={() => togglePin(report.id)}
        >
          {report.isPinned ? (
            <FaStar className="star-active" size={13} />
          ) : (
            <FiStar className="star-inactive" size={13} />
          )}
        </button>
      </td>
      <td>
        <div className="report-title-cell">
          <div className="rep-icon-box"><FiFileText size={15} color="#2563eb" /></div>
          <div className="title-desc-stack">
            <button className="rep-name-bold report-title-action" onClick={() => runReport(report)}>{report.title}</button>
            <span className="rep-desc-sub">{report.description}</span>
          </div>
        </div>
      </td>
      <td><span className="category-tag-badge">{report.category}</span></td>
      <td className="schedule-cell">{report.schedule}</td>
      <td><div className="last-run-stack"><span className="date-line">{report.lastRunDate}</span><span className="time-line">{report.lastRunTime}</span></div></td>
      <td>
        <div className="owner-cell-wrap">
          {report.ownerType === "system" ? <div className="system-gear-box"><FiSettings size={12} color="#64748b" /></div> : <div className="user-avatar-micro">{report.ownerInitials}</div>}
          <span className="owner-name-text">{report.owner}</span>
        </div>
      </td>
      <td><span className={`status-completed-pill ${report.status === "Not run" ? "status-not-run" : ""}`}><FiCheckCircle size={11} /><span>{report.status}</span></span></td>
      <td>
        <div className="report-action-wrap">
          <button className="btn-actions-dots" aria-label={`Actions for ${report.title}`} aria-expanded={menuReportId === report.id} onClick={() => setMenuReportId((current) => current === report.id ? null : report.id)}><FiMoreHorizontal size={15} /></button>
          {menuReportId === report.id && <div className="report-action-menu">
            <button onClick={() => runReport(report)}>Run report</button>
            <button onClick={() => exportReport(report)}>Export CSV</button>
            <button onClick={() => openEditDialog(report)}>Edit report</button>
            {report.schedule !== "Not scheduled" ? <button onClick={() => removeSchedule(report)}>Remove schedule</button> : <button onClick={() => openEditDialog(report)}>Schedule report</button>}
            <button onClick={() => { togglePin(report.id); setMenuReportId(null); }}>{report.isPinned ? "Unpin report" : "Pin report"}</button>
          </div>}
        </div>
      </td>
    </tr>
  );

  const renderReportTable = (items, label) => (
    <section className="reports-section-block">
      <div className="section-title-wrap">
        {label === "Pinned reports" ? <FaStar className="star-icon-gold" size={13} /> : <FiStar className="star-icon-muted" size={13} />}
        <span className="section-title-bold">{label} ({items.length})</span>
      </div>
      <div className="table-wrapper-card">
        <div className="reports-table-scroll">
          <table className="reports-data-table">
            <thead><tr><th className="pin-column"><FiStar size={13} className="th-star-muted" /></th>{reportColumns.map((column) => <th key={column.key}>{column.label}</th>)}<th>Actions</th></tr></thead>
            <tbody>{items.length ? items.map(renderReportRow) : <tr><td colSpan={reportColumns.length + 2} className="reports-empty-cell">No reports here yet. Try another filter or create a report.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </section>
  );

  const visibleActivity = activity.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = (!query || `${item.actor} ${item.action} ${item.target} ${item.badge || ""}`.toLowerCase().includes(query)) && matchesGlobalSearch(item, searchTerm);
    const matchesCategory = selectedCategory === "All" || reports.some((report) => report.title === item.target.replace(/ \(.*\)$/, "") && report.category === selectedCategory);
    const matchesOwner = ownerFilter === "All" || item.actor === ownerFilter || (ownerFilter === "System" && item.actor === "System");
    return matchesQuery && matchesCategory && matchesOwner;
  });

  return (
    <div className="reports-page-layout">
      <main className="reports-main-content">
        <header className="reports-header-row">
          <div><h1 className="reports-title">Reports</h1><p className="reports-subtitle">Create, schedule, run, and export platform reports.</p></div>
          <button className="btn-create-report" onClick={openCreateDialog}><FiPlus size={15} /><span>Create report</span></button>
        </header>

        <nav className="reports-top-nav-tabs" aria-label="Report views">
          {["Library", "Scheduled", "History"].map((tab) => <button key={tab} className={`rep-nav-tab ${topTab === tab ? "active" : ""}`} onClick={() => { setTopTab(tab); setMenuReportId(null); }}>{tab}{tab === "Scheduled" && <span className="tab-count">{scheduledCount}</span>}</button>)}
        </nav>

        <section className="reports-overview-strip" aria-label="Report summary">
          <div className="rep-stat-col"><span className="rep-stat-digit">{pinnedCount}</span><span className="rep-stat-desc">Pinned reports</span></div>
          <div className="rep-stat-col"><span className="rep-stat-digit">{scheduledCount}</span><span className="rep-stat-desc">Scheduled</span></div>
          <div className="rep-stat-col"><span className="rep-stat-digit">{generatedMonthCount}</span><span className="rep-stat-desc">Generated this month</span></div>
          <div className="rep-stat-col"><span className="rep-stat-digit danger-color">{deliveryIssuesCount}</span><span className="rep-stat-desc">Delivery issues</span></div>
        </section>

        <section className="reports-filter-toolbar">
          <label className="search-input-wrap"><FiSearch className="search-icon" /><input type="search" placeholder="Search report name..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} aria-label="Search reports" /></label>
          <div className="category-pills-row">{["All", ...categories].map((category) => <button key={category} className={`cat-pill-btn ${selectedCategory === category ? "active" : ""}`} onClick={() => setSelectedCategory(category)}>{category}</button>)}</div>
          <div className="filters-right-side">
            <label className="select-pill-wrapper"><span className="select-label">Owner</span><select className="select-raw-input" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} aria-label="Filter by owner"><option value="All">All</option>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select><FiChevronDown size={11} className="arrow-down" /></label>
            <label className="select-pill-wrapper"><span className="select-label">Sort</span><select className="select-raw-input" value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort reports"><option>Recently run</option><option>Name</option><option>Category</option></select><FiChevronDown size={11} className="arrow-down" /></label>
          </div>
        </section>
        <div className="reports-period-note">Report period: {dateRange}{searchTerm && <span> · Dashboard search: “{searchTerm}”</span>}</div>

        {topTab === "Library" && <>
          {renderReportTable(pinnedReports, "Pinned reports")}
          {renderReportTable(otherReports, "Other reports")}
        </>}
        {topTab === "Scheduled" && renderReportTable(matchingReports, "Scheduled reports")}
        {topTab === "History" && <section className="reports-section-block">
          <div className="history-section-heading"><div className="section-title-wrap"><FiFileText className="star-icon-muted" size={13} /><span className="section-title-bold">Report activity ({visibleActivity.length})</span></div><button className="btn-secondary-report" onClick={exportHistory}><FiDownload size={13} /> Export history</button></div>
          <div className="table-wrapper-card reports-history-table-wrap"><table className="reports-data-table reports-history-table">
            <thead><tr><th>Activity</th><th>Report</th><th>Details</th><th>Time (IST)</th><th>Action</th></tr></thead>
            <tbody>{visibleActivity.length ? visibleActivity.map((item) => <tr key={item.id}><td>{item.actor} {item.action}</td><td>{item.target}</td><td>{item.badge || "—"}</td><td>{item.timestamp}</td><td>{reports.some((report) => report.title === item.target.replace(/ \(.*\)$/, "")) && <button className="text-action" onClick={() => handleHistoryAction(item)}>Run again</button>}</td></tr>) : <tr><td colSpan={5} className="reports-empty-cell">No activity matches these filters.</td></tr>}</tbody>
          </table></div>
        </section>}
      </main>

      <aside className="reports-activity-sidebar">
        <div className="activity-sidebar-header"><div><h3>Recent activity</h3><span className="activity-count">{activity.length} events</span></div><button className="btn-more-activity" aria-label="View report history" onClick={() => setTopTab("History")}><FiMoreHorizontal size={15} /></button></div>
        <div className="activity-items-stack">
          {activity.slice(0, 10).map((item) => <div key={item.id} className="activity-feed-entry">
            <div className="activity-icon-bubble" style={{ backgroundColor: item.iconBg, color: item.iconColor }}>{renderTimelineIcon(item.iconType)}</div>
            <div className="activity-details-col">
              <div className="activity-main-line"><span className={`actor-bold ${item.actor === "Delivery failed" ? "danger-actor" : ""}`}>{item.actor}</span>{item.action && <span className="action-verb">{item.action}</span>}</div>
              <button className="activity-target-link" onClick={() => handleHistoryAction(item)}>{item.target}</button>
              {item.badge && <div className={`activity-status-badge ${item.badgeType}`}><span className="dot-mini" /><span>{item.badge}</span></div>}
              <span className="activity-timestamp">{item.timestamp}</span>
            </div>
          </div>)}
        </div>
      </aside>

      {notice && <div className="reports-toast" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notification"><FiX size={14} /></button></div>}

      {dialog && <div className="reports-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
        <section className="reports-modal" role="dialog" aria-modal="true" aria-labelledby="reports-modal-title">
          <div className="reports-modal-heading"><div><h2 id="reports-modal-title">{dialog.type === "preview" ? dialog.report.title : dialog.type === "edit" ? "Edit report" : "Create report"}</h2><p>{dialog.type === "preview" ? `${dialog.report.description} · ${dateRange}` : "Set up the report and its delivery schedule."}</p></div><button aria-label="Close dialog" onClick={() => setDialog(null)}><FiX size={18} /></button></div>
          {dialog.type === "preview" ? <div className="report-preview">
            <div className="preview-summary"><span>{previewRows.length} rows</span><span>{dialog.report.category}</span><span>Period: {dateRange}</span></div>
            <div className="report-preview-table-wrap"><table className="reports-data-table"><thead><tr>{[...new Set(previewRows.flatMap((row) => Object.keys(row)))].map((key) => <th key={key}>{key.replaceAll(/([A-Z])/g, " $1")}</th>)}</tr></thead><tbody>{previewRows.slice(0, 8).map((row, index) => <tr key={index}>{Object.values(row).map((value, cellIndex) => <td key={cellIndex}>{value ?? "—"}</td>)}</tr>)}</tbody></table></div>
            <div className="reports-modal-actions"><button className="btn-secondary-report" onClick={() => setDialog(null)}>Close</button><button className="btn-create-report" onClick={() => exportReport(dialog.report, previewRows)}><FiDownload size={14} /> Download CSV</button></div>
          </div> : <form className="reports-form" onSubmit={saveReport}>
            <label>Report name<input autoFocus required maxLength={80} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Weekly hiring analytics" /></label>
            <label>Description<textarea required maxLength={200} rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="What should this report cover?" /></label>
            <div className="reports-form-row"><label>Category<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Schedule<select value={form.schedule} onChange={(event) => setForm((current) => ({ ...current, schedule: event.target.value }))}>{scheduleOptions.map((schedule) => <option key={schedule}>{schedule}</option>)}</select></label></div>
            <div className="reports-modal-actions"><button type="button" className="btn-secondary-report" onClick={() => setDialog(null)}>Cancel</button><button type="submit" className="btn-create-report">{dialog.type === "edit" ? "Save report" : "Create report"}</button></div>
          </form>}
        </section>
      </div>}
    </div>
  );
}
