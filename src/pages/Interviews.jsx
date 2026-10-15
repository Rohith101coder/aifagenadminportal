import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiDownload,
  FiPlus,
  FiMoreHorizontal,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiSlash,
  FiAward,
  FiChevronLeft,
  FiChevronRight,
  FiTrendingUp,
  FiCheck,
} from "react-icons/fi";
import { initialCandidatesList } from "../data/interviewsData";
import { matchesGlobalSearch } from "../data/globalSearch";
import InterviewDetailsDrawer from "../components/InterviewDetailsDrawer/InterviewDetailsDrawer";
import "./Interviews.css";

const parseInterviewDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDateInput = (value) => parseInterviewDate(value);

const formatInterviewDate = (value) => value
  ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  : "Not scheduled";

const formatTime = (value) => {
  if (!value) return "11:00 AM";
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  return `${(hour % 12) || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
};

const stageClass = (stage) => {
  const normalized = stage.toLowerCase();
  if (normalized.includes("offer")) return "offer";
  if (normalized.includes("hired")) return "hired";
  if (normalized.includes("screen")) return "screening";
  if (normalized.includes("hr")) return "hr";
  if (normalized.includes("manager")) return "manager";
  return "technical";
};

export default function Interviews({ globalSearchTerm = "" }) {
  const [candidates, setCandidates] = useState(initialCandidatesList);
  const [activeTab, setActiveTab] = useState("All Candidates");
  const [selectedIds, setSelectedIds] = useState([]);
  const [inspectingCandId, setInspectingCandId] = useState(null); // Drawer closed by default

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [jobTitleFilter, setJobTitleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [interviewerFilter, setInterviewerFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState("All");
  const [savedViews, setSavedViews] = useState([]);
  const [showSavedViews, setShowSavedViews] = useState(false);
  const [viewName, setViewName] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState({ field: "name", direction: "asc" });
  const [candidateDialog, setCandidateDialog] = useState(null);
  const [rowMenuId, setRowMenuId] = useState(null);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const notify = (message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3500);
  };

  // Filter Computation
  const filteredCandidates = useMemo(() => candidates.filter((c) => {
    // Top Tabs
    if (
      activeTab === "In Interview" &&
      c.status !== "In Progress" &&
      c.status !== "Scheduled"
    )
      return false;
    if (activeTab === "Offers" && c.status !== "Offer Extended") return false;
    if (activeTab === "Hired" && c.status !== "Hired") return false;
    if (activeTab === "Rejected" && c.status !== "Rejected") return false;
    if (activeTab === "Withdrawn" && c.status !== "Withdrawn") return false;

    // Search query
    const matchSearch =
      [c.name, c.email, c.jobTitle, c.company, c.department].some((value) => value?.toLowerCase().includes(searchQuery.trim().toLowerCase()));

    // Dropdowns
    const matchJob =
      jobTitleFilter === "All" ? true : c.jobTitle === jobTitleFilter;
    const matchDept = deptFilter === "All" ? true : c.department === deptFilter;
    const matchStage =
      stageFilter === "All" ? true : c.currentStage === stageFilter;
    const matchInterviewer =
      interviewerFilter === "All"
        ? true
        : c.interviewers.some((i) => i.initials === interviewerFilter);
    const dateValue = parseInterviewDate(c.interviewDate);
    const matchDate = (!dateFilter.from || dateValue >= dateFilter.from) && (!dateFilter.to || dateValue <= dateFilter.to);
    const matchLocation = locationFilter === "All" || c.location.toLowerCase().includes(locationFilter.toLowerCase());

    return (
      matchSearch && matchesGlobalSearch(c, globalSearchTerm) && matchJob && matchDept && matchStage && matchInterviewer && matchDate && matchLocation
    );
  }), [candidates, activeTab, searchQuery, globalSearchTerm, jobTitleFilter, deptFilter, stageFilter, interviewerFilter, dateFilter, locationFilter]);

  const sortedCandidates = useMemo(() => {
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...filteredCandidates].sort((a, b) => String(a[sort.field] ?? "").localeCompare(String(b[sort.field] ?? ""), undefined, { numeric: true }) * factor);
  }, [filteredCandidates, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedCandidates.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageCandidates = sortedCandidates.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedCandidates = candidates.filter((candidate) => selectedIds.includes(candidate.id));
  const pageSelected = pageCandidates.length > 0 && pageCandidates.every((candidate) => selectedIds.includes(candidate.id));
  const tabCounts = {
    "All Candidates": candidates.length,
    "In Interview": candidates.filter((candidate) => ["In Progress", "Scheduled"].includes(candidate.status)).length,
    Offers: candidates.filter((candidate) => candidate.status === "Offer Extended").length,
    Hired: candidates.filter((candidate) => candidate.status === "Hired").length,
    Rejected: candidates.filter((candidate) => candidate.status === "Rejected").length,
    Withdrawn: candidates.filter((candidate) => candidate.status === "Withdrawn").length,
  };
  const metricCards = [
    { title: "Total Candidates", value: candidates.length, iconType: "candidates", iconColor: "#2563eb", iconBg: "#eff6ff" },
    { title: "In Interview", value: tabCounts["In Interview"], iconType: "in_interview", iconColor: "#d97706", iconBg: "#fffbeb" },
    { title: "Offers Extended", value: tabCounts.Offers, iconType: "offers", iconColor: "#7c3aed", iconBg: "#f5f3ff" },
    { title: "Hired / Placed", value: tabCounts.Hired, iconType: "hired", iconColor: "#10b981", iconBg: "#ecfdf5" },
    { title: "Declined / Rejected", value: tabCounts.Rejected, iconType: "rejected", iconColor: "#ef4444", iconBg: "#fef2f2" },
  ];
  const outcomeCounts = [
    { label: "Hired", count: tabCounts.Hired, color: "#10b981" },
    { label: "In Process", count: tabCounts["In Interview"], color: "#2563eb" },
    { label: "Offer Extended", count: tabCounts.Offers, color: "#7c3aed" },
    { label: "Completed", count: candidates.filter((candidate) => candidate.status === "Completed").length, color: "#64748b" },
    { label: "Rejected", count: tabCounts.Rejected, color: "#ef4444" },
    { label: "Withdrawn", count: tabCounts.Withdrawn, color: "#94a3b8" },
  ].map((item) => ({ ...item, pct: candidates.length ? `${((item.count / candidates.length) * 100).toFixed(1)}%` : "0%" }));
  const livePipelineStages = [
    ["Applied", () => candidates.length],
    ["Screening", (candidate) => candidate.currentStage.toLowerCase().includes("screen")],
    ["Technical", (candidate) => candidate.currentStage.toLowerCase().includes("technical")],
    ["Manager", (candidate) => candidate.currentStage.toLowerCase().includes("manager")],
    ["HR", (candidate) => candidate.currentStage.toLowerCase().includes("hr")],
    ["Offer", (candidate) => candidate.status === "Offer Extended"],
    ["Hired", (candidate) => candidate.status === "Hired"],
  ].map(([stage, predicate]) => {
    const count = stage === "Applied" ? predicate() : candidates.filter(predicate).length;
    return { stage, count, pct: candidates.length ? `${((count / candidates.length) * 100).toFixed(1)}%` : "0%" };
  });

  const activeCandidate =
    sortedCandidates.find((c) => c.id === inspectingCandId) || null;
  const currentInspectIndex = sortedCandidates.findIndex(
    (c) => c.id === inspectingCandId,
  );

  // Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds((current) => [...new Set([...current, ...pageCandidates.map((c) => c.id)])]);
    } else {
      setSelectedIds((current) => current.filter((id) => !pageCandidates.some((candidate) => candidate.id === id)));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  // Actions
  const openCandidateDialog = (candidate = null) => setCandidateDialog(candidate
    ? { ...candidate, interviewersText: candidate.interviewers.map((interviewer) => interviewer.name).join(", "), interviewDateInput: toDateInput(candidate.interviewDate) }
    : { name: "", email: "", phone: "", jobTitle: "", company: "", department: "Engineering", location: "", currentStage: "Technical Round 1", interviewDateInput: "", interviewTimeInput: "11:00", mode: "Video call", meetingUrl: "", duration: "45 minutes", focusAreas: "", status: "Scheduled", interviewersText: "" });

  const saveCandidate = (event) => {
    event.preventDefault();
    if (!candidateDialog?.name.trim() || !candidateDialog?.email.trim() || !candidateDialog?.jobTitle.trim()) return;
    const interviewers = (candidateDialog.interviewersText || "").split(",").map((name) => name.trim()).filter(Boolean).map((name) => ({
      name, initials: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), title: "", bg: "#dbeafe",
    }));
    const statusClass = candidateDialog.status.toLowerCase().replaceAll(" ", "-");
    const stage = candidateDialog.currentStage || "Technical Round 1";
    const candidate = {
      ...candidateDialog,
      id: candidateDialog.id || `cand-${Date.now()}`,
      initials: candidateDialog.name.split(/\s+/).map((part) => part[0]).join("").toUpperCase(),
      avatarBg: candidateDialog.avatarBg || "#dbeafe",
      interviewDate: formatInterviewDate(candidateDialog.interviewDateInput),
      interviewTime: `${formatTime(candidateDialog.interviewTimeInput)} IST`,
      interviewers,
      stagePillClass: stageClass(stage),
      statusClass,
      progressIndex: candidateDialog.progressIndex || 1,
      pastRounds: candidateDialog.pastRounds || [],
      hiringProgress: candidateDialog.hiringProgress || [],
      employmentType: candidateDialog.employmentType || "Full-time",
      company: candidateDialog.company || "—",
      mode: candidateDialog.mode || "Video call",
      duration: candidateDialog.duration || "45 minutes",
      focusAreas: candidateDialog.focusAreas || "Not specified",
    };
    setCandidates((current) => candidateDialog.id ? current.map((item) => item.id === candidate.id ? candidate : item) : [candidate, ...current]);
    setPage(1);
    notify(candidateDialog.id ? `Updated interview for ${candidate.name}.` : `Interview scheduled for ${candidate.name}.`);
    setCandidateDialog(null);
  };

  const handleMoveToNextRound = (c) => {
    const stages = ["Screening", "Technical Round 1", "Technical Round 2", "Manager Round", "HR Round", "Offer", "Hired"];
    const nextStage = stages[Math.min(stages.indexOf(c.currentStage) + 1, stages.length - 1)] || "Technical Round 1";
    const nextStatus = nextStage === "Offer" ? "Offer Extended" : nextStage === "Hired" ? "Hired" : "Scheduled";
    setCandidates((current) =>
      current.map((item) =>
        item.id === c.id
          ? {
              ...item,
              currentStage: nextStage,
              status: nextStatus,
              statusClass: nextStatus.toLowerCase().replaceAll(" ", "-"),
              stagePillClass: stageClass(nextStage),
              progressIndex: Math.min((item.progressIndex || 0) + 1, 5),
              pastRounds: [...(item.pastRounds || []), { round: item.currentStage, date: item.interviewDate, interviewer: item.interviewers.map((i) => i.name).join(", ") || "Unassigned", feedback: "Pending", status: "Completed" }],
              hiringProgress: [...(item.hiringProgress || []), { stage: item.currentStage, date: `${item.interviewDate} · ${item.interviewTime}`, completed: true }, { stage: nextStage, date: "", current: true }],
            }
          : item,
      ),
    );
    notify(`${c.name} moved to Offer stage.`);
  };

  const handleRejectCandidate = (c) => {
    setCandidates((current) =>
      current.map((item) =>
        item.id === c.id
          ? { ...item, status: "Rejected", statusClass: "rejected", hiringProgress: [...(item.hiringProgress || []), { stage: "Rejected", date: new Date().toLocaleDateString(), current: true }] }
          : item,
      ),
    );
    notify(`${c.name} marked as rejected.`);
  };

  const handleReschedule = (c) => {
    openCandidateDialog(c);
  };

  const handleCancelInterview = (c) => {
    if (window.confirm(`Cancel interview for ${c.name}?`)) {
      setCandidates((current) =>
        current.map((item) =>
          item.id === c.id
            ? { ...item, status: "Withdrawn", statusClass: "withdrawn" }
            : item,
        ),
      );
      notify(`Interview cancelled for ${c.name}.`);
    }
  };

  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const toggleSort = (field) => {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setJobTitleFilter("All");
    setDeptFilter("All");
    setStageFilter("All");
    setInterviewerFilter("All");
    setDateFilter({ from: "", to: "" });
    setLocationFilter("All");
    setActiveTab("All Candidates");
    setPage(1);
  };

  const exportCandidates = (rows = sortedCandidates) => {
    const fields = ["name", "email", "jobTitle", "company", "department", "currentStage", "interviewDate", "interviewTime", "status"];
    const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [fields.join(","), ...rows.map((candidate) => fields.map((field) => quote(candidate[field])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "interviews.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(`Exported ${rows.length} candidate(s).`);
  };

  const saveView = (event) => {
    event.preventDefault();
    if (!viewName.trim()) return;
    setSavedViews((current) => [...current, { name: viewName.trim(), activeTab, searchQuery, jobTitleFilter, deptFilter, stageFilter, interviewerFilter, dateFilter, locationFilter }]);
    setViewName("");
    notify("Saved the current interview view.");
  };

  const applySavedView = (view) => {
    setActiveTab(view.activeTab);
    setSearchQuery(view.searchQuery);
    setJobTitleFilter(view.jobTitleFilter);
    setDeptFilter(view.deptFilter);
    setStageFilter(view.stageFilter);
    setInterviewerFilter(view.interviewerFilter);
    setDateFilter(view.dateFilter);
    setLocationFilter(view.locationFilter);
    setPage(1);
    setShowSavedViews(false);
  };

  const bulkSetStatus = (status) => {
    setCandidates((current) => current.map((candidate) => selectedIds.includes(candidate.id) ? { ...candidate, status, statusClass: status.toLowerCase().replaceAll(" ", "-") } : candidate));
    notify(`Updated status for ${selectedIds.length} candidate(s).`);
    setSelectedIds([]);
  };

  const saveCandidateNotes = (candidate, notes) => {
    setCandidates((current) => current.map((item) => item.id === candidate.id ? { ...item, notes } : item));
    notify("Notes saved for this session.");
  };

  const renderIcon = (type) => {
    switch (type) {
      case "candidates":
        return <FiUsers size={16} />;
      case "in_interview":
        return <FiClock size={16} />;
      case "offers":
        return <FiAward size={16} />;
      case "hired":
        return <FiCheckCircle size={16} />;
      case "rejected":
        return <FiSlash size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="interviews-page-layout">
      <div className="interviews-main-content">
        {/* Page Header */}
        <div className="interviews-header-row">
          <div>
            <h1 className="interviews-page-title">
              Interviews <span className="title-count-pill">· {candidates.length}</span>
            </h1>
            <p className="interviews-page-subtitle">
              Track candidates through interview stages, manage schedules and
              measure hiring outcomes.
            </p>
          </div>

          <div className="header-right-actions">
            <button
              className="btn-export-outline"
              onClick={() => exportCandidates()}
            >
              <FiDownload size={13} />
              <span>Export</span>
              <FiChevronDown size={11} />
            </button>
            <button
              className="btn-schedule-primary"
              onClick={() => openCandidateDialog()}
            >
              <FiPlus size={15} />
              <span>Schedule Interview</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="interviews-kpis-grid">
          {metricCards.map((kpi, idx) => (
            <div key={idx} className="interview-kpi-card">
              <div
                className="kpi-icon-square"
                style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}
              >
                {renderIcon(kpi.iconType)}
              </div>
              <div className="kpi-text-stack">
                <span className="kpi-label">{kpi.title}</span>
                <span className="kpi-val-bold">{kpi.value}</span>
                <div className="kpi-trend-row">
                  <span className="kpi-sub-text">Current candidate records</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Analytics: Funnel Pipeline, Donut & Time to Hire */}
        <div className="interviews-middle-analytics-row">
          {/* Interview Pipeline Funnel */}
          <div className="analytics-box pipeline-box">
            <div className="analytics-box-head">
              <span className="box-title-bold">
                Interview Pipeline (Overall)
              </span>
              <div className="dropdown-small">
                <span>Overall</span>
                <FiChevronDown size={11} />
              </div>
            </div>

            <div className="pipeline-funnel-flow">
              {livePipelineStages.map((stg, i) => (
                <React.Fragment key={stg.stage}>
                  <div
                    className={`funnel-step-box step-${stg.stage.toLowerCase()}`}
                  >
                    <span className="step-name">{stg.stage}</span>
                    <span className="step-count">{stg.count}</span>
                    <span className="step-pct">{stg.pct}</span>
                  </div>
                  {i < livePipelineStages.length - 1 && (
                    <span className="funnel-chevron">›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Interview Outcome Donut */}
          <div className="analytics-box donut-box">
            <div className="analytics-box-head">
              <span className="box-title-bold">
                Interview Outcome <span className="sub-gray">(30 days)</span>
              </span>
            </div>

            <div className="donut-content-split">
              <div className="donut-graphic-wrap">
                <svg width="110" height="110" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#2563eb"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="238.76"
                    strokeDashoffset="150"
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#10b981"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="238.76"
                    strokeDashoffset="210"
                    transform="rotate(60 50 50)"
                  />
                </svg>
                <div className="donut-center-digits">
                  <span className="center-bold">{candidates.length}</span>
                  <span className="center-sub">Candidates</span>
                </div>
              </div>

              <div className="donut-legend-stack">
                {outcomeCounts.map((it, idx) => (
                  <div key={idx} className="legend-row-entry">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: it.color }}
                    ></span>
                    <div className="legend-text-cluster">
                      <span className="legend-label-bold">{it.label}</span>
                      <span className="legend-val">
                        {it.count} ({it.pct})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Time to Hire & Conversion */}
          <div className="analytics-box stats-summary-box">
            <div className="summary-stat-half">
              <span className="stat-title-label">Time to Hire</span>
              <div className="stat-big-line">
                <span className="stat-huge-number">—</span>
              </div>
              <span className="stat-muted-sub">
                Hire-date history is not available in current records.
              </span>
            </div>

            <div className="horizontal-sep"></div>

            <div className="summary-stat-half">
              <span className="stat-title-label">Conversion Rate</span>
              <div className="stat-big-line">
                <span className="stat-huge-number">{candidates.length ? `${((tabCounts.Hired / candidates.length) * 100).toFixed(1)}%` : "0%"}</span>
                <span className="trend-green">
                  <FiTrendingUp /> Current
                </span>
              </div>
              <span className="stat-muted-sub">Hired / Applied</span>
            </div>
          </div>
        </div>

        {/* Tab Filter Strip */}
        <div className="interviews-nav-tabs-bar">
          <div className="tabs-cluster">
            {[
              { label: "All Candidates", count: tabCounts["All Candidates"] },
              { label: "In Interview", count: tabCounts["In Interview"] },
              { label: "Offers", count: tabCounts.Offers },
              { label: "Hired", count: tabCounts.Hired },
              { label: "Rejected", count: tabCounts.Rejected },
              { label: "Withdrawn", count: tabCounts.Withdrawn },
            ].map((tab) => (
              <button
                key={tab.label}
                className={`tab-btn-pill ${activeTab === tab.label ? "active" : ""}`}
                onClick={() => updateFilter(setActiveTab, tab.label)}
              >
                <span>{tab.label}</span>
                <span className="count-tag">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="tabs-right-actions">
            <button
              className="btn-saved-views-pill"
              onClick={() => setShowSavedViews((shown) => !shown)}
            >
              <span>Saved Views</span>
              <FiChevronDown size={11} />
            </button>
            <button className="btn-tab-more" aria-label="Export filtered interviews" title="Export filtered interviews" onClick={() => exportCandidates()}>
              <FiDownload size={14} />
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="interviews-table-card">
          <div className="table-filter-controls-row">
            <div className="search-input-wrapper">
              <FiSearch className="search-icon-svg" />
              <input
                type="text"
                placeholder="Search by name, job title, company, email..."
                value={searchQuery}
                onChange={(e) => updateFilter(setSearchQuery, e.target.value)}
              />
            </div>

            <div className="select-dropdowns-group">
              <select
                className="filter-select-input"
                value={jobTitleFilter}
                onChange={(e) => setJobTitleFilter(e.target.value)}
              >
                <option value="All">Job Title</option>
                {[...new Set(candidates.map((candidate) => candidate.jobTitle))].sort().map((jobTitle) => <option key={jobTitle}>{jobTitle}</option>)}
              </select>

              <select
                className="filter-select-input"
                value={deptFilter}
                onChange={(e) => updateFilter(setDeptFilter, e.target.value)}
              >
                <option value="All">Department</option>
                {[...new Set(candidates.map((candidate) => candidate.department))].sort().map((department) => <option key={department}>{department}</option>)}
              </select>

              <select
                className="filter-select-input"
                value={stageFilter}
                onChange={(e) => updateFilter(setStageFilter, e.target.value)}
              >
                <option value="All">Stage</option>
                {[...new Set(candidates.map((candidate) => candidate.currentStage))].sort().map((stage) => <option key={stage}>{stage}</option>)}
              </select>

              <select
                className="filter-select-input"
                value={interviewerFilter}
                onChange={(e) => updateFilter(setInterviewerFilter, e.target.value)}
              >
                <option value="All">Interviewer</option>
                {[...new Map(candidates.flatMap((candidate) => candidate.interviewers).map((interviewer) => [interviewer.initials, interviewer])).values()].filter((interviewer) => interviewer.name !== "Not Assigned").map((interviewer) => <option key={interviewer.initials} value={interviewer.initials}>{interviewer.name}</option>)}
              </select>

              <button
                className="filter-select-input"
                onClick={() => setShowDateFilter((shown) => !shown)}
              >
                <span>Date</span>
                <FiChevronDown size={11} />
              </button>

              <button
                className="btn-more-filters"
                onClick={() => setShowMoreFilters((shown) => !shown)}
              >
                <FiFilter size={12} />
                <span>More filters</span>
              </button>
            </div>
          </div>

          {showDateFilter && <div className="interview-filter-panel">
            <label>From <input type="date" value={dateFilter.from} onChange={(event) => { setDateFilter((current) => ({ ...current, from: event.target.value })); setPage(1); }} /></label>
            <label>To <input type="date" value={dateFilter.to} onChange={(event) => { setDateFilter((current) => ({ ...current, to: event.target.value })); setPage(1); }} /></label>
            <button onClick={() => setDateFilter({ from: "", to: "" })}>Clear dates</button>
          </div>}
          {showMoreFilters && <div className="interview-filter-panel">
            <label>Location <select value={locationFilter} onChange={(event) => updateFilter(setLocationFilter, event.target.value)}>
              <option value="All">All locations</option>
              {[...new Set(candidates.map((candidate) => candidate.location).filter(Boolean))].sort().map((location) => <option key={location}>{location}</option>)}
            </select></label>
            <button onClick={clearFilters}>Clear all filters</button>
          </div>}
          {showSavedViews && <div className="interview-saved-views">
            <strong>Saved views</strong>
            {!savedViews.length && <span>No saved views yet.</span>}
            {savedViews.map((view, index) => <button key={`${view.name}-${index}`} onClick={() => applySavedView(view)}>{view.name}</button>)}
            <form onSubmit={saveView}><input aria-label="Saved view name" placeholder="View name" value={viewName} onChange={(event) => setViewName(event.target.value)} required /><button type="submit">Save current</button></form>
          </div>}
          {selectedIds.length > 0 && <div className="interview-bulk-toolbar">
            <strong>{selectedIds.length} selected</strong>
            <button onClick={() => bulkSetStatus("Scheduled")}>Mark scheduled</button>
            <button onClick={() => bulkSetStatus("Rejected")}>Reject</button>
            <button onClick={() => exportCandidates(selectedCandidates)}><FiDownload size={13} /> Export selected</button>
            <button aria-label="Clear selection" onClick={() => setSelectedIds([])}>×</button>
          </div>}

          {/* Table Container */}
          <div className="table-responsive-scroll">
            <table className="interviews-data-table">
              <thead>
                <tr>
                  <th style={{ width: "38px" }}>
                    <input
                      type="checkbox"
                      className="table-checkbox"
                      checked={pageSelected}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th><button className="interview-sort-button" onClick={() => toggleSort("name")}>Candidate {sort.field === "name" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th><button className="interview-sort-button" onClick={() => toggleSort("jobTitle")}>Job Title {sort.field === "jobTitle" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th><button className="interview-sort-button" onClick={() => toggleSort("department")}>Department {sort.field === "department" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th><button className="interview-sort-button" onClick={() => toggleSort("currentStage")}>Current Stage {sort.field === "currentStage" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th>Interviewer(s)</th>
                  <th><button className="interview-sort-button" onClick={() => toggleSort("interviewDate")}>Interview Date {sort.field === "interviewDate" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Actions</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageCandidates.map((cand) => {
                  const isChecked = selectedIds.includes(cand.id);
                  const isInspected = inspectingCandId === cand.id;

                  return (
                    <tr
                      key={cand.id}
                      className={`candidate-table-row ${isInspected ? "inspected-active" : ""}`}
                      onClick={() => setInspectingCandId(cand.id)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(cand.id)}
                        />
                      </td>

                      <td>
                        <div className="candidate-cell-flex">
                          <div
                            className="candidate-avatar-chip"
                            style={{ backgroundColor: cand.avatarBg }}
                          >
                            {cand.initials}
                          </div>
                          <div className="name-email-col">
                            <span className="cand-name-bold">{cand.name}</span>
                            <span className="cand-email-muted">
                              {cand.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="job-title-cell-bold">{cand.jobTitle}</td>
                      <td className="dept-cell-muted">{cand.department}</td>

                      <td>
                        <span className={`stage-tag ${cand.stagePillClass}`}>
                          {cand.currentStage}
                        </span>
                      </td>

                      <td>
                        <div className="interviewers-overlap-stack">
                          {cand.interviewers.map((int, i) => (
                            <span
                              key={i}
                              className="int-micro-avatar"
                              style={{ backgroundColor: int.bg }}
                              title={int.name}
                            >
                              {int.initials}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td>
                        <div className="interview-date-stack">
                          <span className="date-bold">
                            {cand.interviewDate}
                          </span>
                          <span className="time-sub">
                            {cand.interviewTime.split(" ")[0]}{" "}
                            {cand.interviewTime.split(" ")[1]}
                          </span>
                        </div>
                      </td>

                      <td>
                        {/* 5 Progress dots indicator */}
                        <div className="progress-dots-row">
                          {[1, 2, 3, 4, 5].map((step) => (
                            <span
                              key={step}
                              className={`progress-dot-node ${step <= cand.progressIndex ? (cand.statusClass === "rejected" ? "rejected" : "active") : ""}`}
                            ></span>
                          ))}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`status-state-pill ${cand.statusClass}`}
                        >
                          {cand.status}
                        </span>
                      </td>

                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-view-cand"
                          onClick={() => setInspectingCandId(cand.id)}
                        >
                          View
                        </button>
                      </td>

                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="btn-options-more" aria-label={`Actions for ${cand.name}`} onClick={() => setRowMenuId((id) => id === cand.id ? null : cand.id)}>
                          <FiMoreHorizontal size={14} />
                        </button>
                        {rowMenuId === cand.id && <div className="interview-row-menu">
                          <button onClick={() => { setInspectingCandId(cand.id); setRowMenuId(null); }}>View details</button>
                          <button onClick={() => { openCandidateDialog(cand); setRowMenuId(null); }}>Edit / reschedule</button>
                          <button onClick={() => { handleMoveToNextRound(cand); setRowMenuId(null); }}>Move to next stage</button>
                          <button onClick={() => { handleRejectCandidate(cand); setRowMenuId(null); }}>Reject candidate</button>
                          <button onClick={() => { handleCancelInterview(cand); setRowMenuId(null); }}>Cancel / withdraw</button>
                        </div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Pagination Bar */}
          <div className="interviews-table-footer">
            <span className="showing-entries-label">
              Showing {sortedCandidates.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, sortedCandidates.length)} of {sortedCandidates.length} candidates
            </span>

            <div className="footer-pagination-cluster">
              <button className="page-nav-arrow" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous page">
                <FiChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} className={`page-number-box ${pageNumber === currentPage ? "active" : ""}`} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}
              <button className="page-nav-arrow" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="Next page">
                <FiChevronRight size={13} />
              </button>

              <label className="per-page-select-box">Rows
                <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                  {[5, 10, 25].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* On-Demand Right Drawer (Opens only when a candidate row is clicked) */}
      {activeCandidate && (
        <InterviewDetailsDrawer
          key={activeCandidate.id}
          candidate={activeCandidate}
          currentIndex={currentInspectIndex}
          totalCount={sortedCandidates.length}
          onNext={() =>
            currentInspectIndex < sortedCandidates.length - 1 &&
            setInspectingCandId(sortedCandidates[currentInspectIndex + 1].id)
          }
          onPrev={() =>
            currentInspectIndex > 0 &&
            setInspectingCandId(sortedCandidates[currentInspectIndex - 1].id)
          }
          onClose={() => setInspectingCandId(null)}
          onMoveToNextRound={handleMoveToNextRound}
          onRejectCandidate={handleRejectCandidate}
          onReschedule={handleReschedule}
          onCancelInterview={handleCancelInterview}
          onEditCandidate={openCandidateDialog}
          onSaveNotes={saveCandidateNotes}
        />
      )}
      {!pageCandidates.length && <div className="interviews-empty-state"><strong>No candidates found</strong><span>Change the search or filters to see candidates.</span><button onClick={clearFilters}>Clear filters</button></div>}
      {candidateDialog && <div className="interview-dialog-backdrop" onClick={() => setCandidateDialog(null)}>
        <form className="interview-dialog" onSubmit={saveCandidate} onClick={(event) => event.stopPropagation()}>
          <h2>{candidateDialog.id ? "Edit / reschedule interview" : "Schedule interview"}</h2>
          <label>Candidate name<input autoFocus required value={candidateDialog.name} onChange={(event) => setCandidateDialog((current) => ({ ...current, name: event.target.value }))} /></label>
          <label>Email<input type="email" required value={candidateDialog.email} onChange={(event) => setCandidateDialog((current) => ({ ...current, email: event.target.value }))} /></label>
          <label>Phone<input value={candidateDialog.phone || ""} onChange={(event) => setCandidateDialog((current) => ({ ...current, phone: event.target.value }))} /></label>
          <label>Job title<input required value={candidateDialog.jobTitle} onChange={(event) => setCandidateDialog((current) => ({ ...current, jobTitle: event.target.value }))} /></label>
          <label>Company<input value={candidateDialog.company || ""} onChange={(event) => setCandidateDialog((current) => ({ ...current, company: event.target.value }))} /></label>
          <label>Department<input value={candidateDialog.department || ""} onChange={(event) => setCandidateDialog((current) => ({ ...current, department: event.target.value }))} /></label>
          <label>Location<input value={candidateDialog.location || ""} onChange={(event) => setCandidateDialog((current) => ({ ...current, location: event.target.value }))} /></label>
          <label>Stage<select value={candidateDialog.currentStage} onChange={(event) => setCandidateDialog((current) => ({ ...current, currentStage: event.target.value }))}>{["Screening", "Technical Round 1", "Technical Round 2", "Manager Round", "HR Round", "Offer", "Hired"].map((stage) => <option key={stage}>{stage}</option>)}</select></label>
          <div className="interview-dialog-two-col">
            <label>Date<input type="date" required value={candidateDialog.interviewDateInput || ""} onChange={(event) => setCandidateDialog((current) => ({ ...current, interviewDateInput: event.target.value }))} /></label>
            <label>Time<input type="time" required value={candidateDialog.interviewTimeInput || ""} onChange={(event) => setCandidateDialog((current) => ({ ...current, interviewTimeInput: event.target.value }))} /></label>
          </div>
          <label>Mode<input value={candidateDialog.mode || ""} onChange={(event) => setCandidateDialog((current) => ({ ...current, mode: event.target.value }))} /></label>
          <label>Meeting URL<input type="url" value={candidateDialog.meetingUrl || ""} onChange={(event) => setCandidateDialog((current) => ({ ...current, meetingUrl: event.target.value }))} placeholder="https://meet.example.com/..." /></label>
          <label>Duration<input value={candidateDialog.duration || ""} onChange={(event) => setCandidateDialog((current) => ({ ...current, duration: event.target.value }))} /></label>
          <label>Interviewers (comma-separated)<input value={candidateDialog.interviewersText || ""} onChange={(event) => setCandidateDialog((current) => ({ ...current, interviewersText: event.target.value }))} placeholder="Sarah Chen, Michael Tan" /></label>
          <label>Focus areas<input value={candidateDialog.focusAreas || ""} onChange={(event) => setCandidateDialog((current) => ({ ...current, focusAreas: event.target.value }))} /></label>
          <label>Status<select value={candidateDialog.status} onChange={(event) => setCandidateDialog((current) => ({ ...current, status: event.target.value }))}>{["Scheduled", "In Progress", "Completed", "Offer Extended", "Hired", "Rejected", "Withdrawn"].map((status) => <option key={status}>{status}</option>)}</select></label>
          <div className="interview-dialog-actions"><button type="button" onClick={() => setCandidateDialog(null)}>Cancel</button><button className="primary" type="submit">{candidateDialog.id ? "Save interview" : "Schedule interview"}</button></div>
        </form>
      </div>}
      {notice && <div className="interview-toast" role="status"><FiCheck size={15} />{notice}</div>}
    </div>
  );
}
