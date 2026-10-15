import { useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiChevronDown,
  FiDownload,
  FiPlus,
  FiX,
  FiColumns,
  FiFilter,
  FiMoreHorizontal,
  FiChevronLeft,
  FiChevronRight,
  FiTrendingUp,
  FiEyeOff,
  FiSlash,
  FiRefreshCw,
  FiArrowUpRight,
  FiCalendar,
} from "react-icons/fi";
import { BsLinkedin } from "react-icons/bs";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { jobMetrics, initialJobsList } from "../data/jobsData";
import { matchesGlobalSearch } from "../data/globalSearch";
import JobDetailsDrawer from "../components/JobDetailsDrawer/JobDetailsDrawer";
import JobSources from "./JobSources";
import InternalJobs from "./InternalJobs";
import "./Jobs.css";

export default function Jobs({ globalSearchTerm = "" }) {
  const navigate = useNavigate();
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const activeCategory =
    category ?? {
      all: "all",
      public: "public",
      internal: "internal",
      sources: "sources",
    }[tabFromUrl] ?? "all";
  const activeTab =
    activeCategory === "public"
      ? "Public Jobs"
      : activeCategory === "internal"
        ? "Internal Openings"
        : activeCategory === "sources"
          ? "Job Sources"
          : "All Jobs";
  const selectTab = (tab) => {
    const tabValue = {
      "All Jobs": "all",
      "Public Jobs": "public",
      "Internal Openings": "internal",
      "Job Sources": "sources",
    }[tab];
    navigate(`/jobs/${tabValue}`);
    setSelectedJobIds([]);
    setInspectingJobId(null);
  };
  const [jobs, setJobs] = useState(initialJobsList);
  const [selectedJobIds, setSelectedJobIds] = useState([]);

  // By default, NO job is open in the inspection drawer unless clicked
  const [inspectingJobId, setInspectingJobId] = useState(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [workModeFilter, setWorkModeFilter] = useState("All");
  const [employmentFilter, setEmploymentFilter] = useState("All");
  const [columns, setColumns] = useState({
    company: true, source: true, location: true, experience: true,
    salary: true, added: true, status: true, quality: true, apps: true, actions: true,
  });
  const [showColumns, setShowColumns] = useState(false);
  const [sort, setSort] = useState({ field: "addedTimestamp", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [dialogJob, setDialogJob] = useState(null);
  const [showSavedViews, setShowSavedViews] = useState(false);
  const [savedViews, setSavedViews] = useState([]);
  const [viewName, setViewName] = useState("");
  const [rowMenuId, setRowMenuId] = useState(null);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(null);

  const notify = (message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3500);
  };

  const filteredJobs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const dateValue = (job) => {
      const match = (job.postedOnSource ?? job.addedTimestamp)?.match(/([A-Za-z]{3})\s+(\d{1,2})(?:,\s*(\d{4}))?/);
      if (match) return new Date(`${match[1]} ${match[2]}, ${match[3] ?? "2026"}`).getTime();
      return 0;
    };
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : 0;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : Infinity;
    return jobs.filter((job) => {
      if (job.status === "Hidden" && statusFilter !== "Hidden") return false;
      if (activeTab === "Public Jobs" && job.type !== "public") return false;
      if (activeTab === "Internal Openings" && job.type !== "internal") return false;
      const searchable = [job.title, job.company, job.location, job.experience, job.source].join(" ").toLowerCase();
      return (!query || searchable.includes(query)) &&
        matchesGlobalSearch(job, globalSearchTerm) &&
        (locationFilter === "All" || job.location.toLowerCase().includes(locationFilter.toLowerCase())) &&
        (sourceFilter === "All" || job.source.toLowerCase() === sourceFilter.toLowerCase()) &&
        (statusFilter === "All" || job.status.toLowerCase() === statusFilter.toLowerCase()) &&
        (workModeFilter === "All" || job.workMode.toLowerCase() === workModeFilter.toLowerCase()) &&
        (employmentFilter === "All" || job.employmentType.toLowerCase().includes(employmentFilter.toLowerCase())) &&
        (!dateFrom && !dateTo || dateValue(job) >= from && dateValue(job) <= to);
    });
  }, [jobs, activeTab, searchTerm, globalSearchTerm, locationFilter, sourceFilter, statusFilter, workModeFilter, employmentFilter, dateFrom, dateTo]);

  const sortedJobs = useMemo(() => {
    const sign = sort.direction === "asc" ? 1 : -1;
    return [...filteredJobs].sort((a, b) => {
      const left = a[sort.field] ?? "";
      const right = b[sort.field] ?? "";
      const comparison = sort.field === "quality" || sort.field === "appsCount"
        ? Number(left || 0) - Number(right || 0)
        : String(left).localeCompare(String(right), undefined, { numeric: true });
      return comparison * sign;
    });
  }, [filteredJobs, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageJobs = sortedJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageSelected = pageJobs.length > 0 && pageJobs.every((job) => selectedJobIds.includes(job.id));
  const selectedJobs = jobs.filter((job) => selectedJobIds.includes(job.id));

  // Active Job computation for Drawer
  const activeJob = jobs.find((j) => j.id === inspectingJobId) || null;
  const currentInspectIndex = sortedJobs.findIndex(
    (j) => j.id === inspectingJobId,
  );

  // Selection Checkboxes
  const handleSelectAll = (e) => {
    setSelectedJobIds((current) => e.target.checked
      ? [...new Set([...current, ...pageJobs.map((job) => job.id)])]
      : current.filter((id) => !pageJobs.some((job) => job.id === id)));
  };

  const handleSelectOne = (id) => {
    setSelectedJobIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  };

  // Drawer Next/Prev Navigation
  const handleNextJob = () => {
    if (currentInspectIndex < sortedJobs.length - 1) {
      setInspectingJobId(sortedJobs[currentInspectIndex + 1].id);
    }
  };

  const handlePrevJob = () => {
    if (currentInspectIndex > 0) {
      setInspectingJobId(sortedJobs[currentInspectIndex - 1].id);
    }
  };

  // Job Actions
  const handleExpireJob = (targetJob) => {
    setJobs((current) => current.map((job) => job.id === targetJob.id ? { ...job, status: "Expired" } : job));
    notify(`"${targetJob.title}" marked as expired.`);
  };

  const handleHideJob = (targetJob) => {
    setJobs((current) => current.map((job) => job.id === targetJob.id ? { ...job, status: "Hidden" } : job));
    setInspectingJobId(null);
    setSelectedJobIds((current) => current.filter((id) => id !== targetJob.id));
    notify(`"${targetJob.title}" archived.`);
  };

  const handleRefetchJob = (targetJob) => {
    const updated = { ...targetJob, fetchedOn: `Just now (${targetJob.source})`, sourceDetails: { ...targetJob.sourceDetails, lastFetched: new Date().toLocaleString() } };
    setJobs((current) => current.map((job) => job.id === targetJob.id ? updated : job));
    if (inspectingJobId === targetJob.id) setInspectingJobId(targetJob.id);
    notify(`Latest demo record refreshed for "${targetJob.title}".`);
  };

  const openJobForm = (job = null) => setDialogJob(job
    ? { ...job }
    : { title: "", company: "AiFAGen", employmentType: "Full-time · Remote", location: "", workMode: "Remote", experience: "", salary: "", applicationLink: "", status: "Active" });

  const saveJob = (event) => {
    event.preventDefault();
    if (!dialogJob?.title.trim() || !dialogJob?.company.trim()) return;
    if (dialogJob.id) {
      setJobs((current) => current.map((job) => job.id === dialogJob.id ? dialogJob : job));
      notify("Job changes saved.");
    } else {
      const newJobId = `job-${globalThis.crypto.randomUUID()}`;
      const newJob = {
        ...dialogJob,
        id: newJobId, logo: "", isInternal: true, source: "AiFAGen",
        sourceIcon: "internal", authorInitials: "RP", duplicatesCount: null,
        salaryNote: "", addedRelative: "Just now", addedTimestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        postedOnSource: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), fetchedOn: "Internal Draft", quality: null,
        appsCount: 0, savesCount: "0", viewsCount: "0", conversionRate: "0%",
        type: "internal",
        applicationLink: dialogJob.applicationLink || "https://aifagen.internal/careers",
        sourceDetails: { sourceName: "AiFAGen Internal", sourceJobId: `INT-${newJobId}`, sourceUrl: dialogJob.applicationLink || "https://aifagen.internal/careers", status: "Healthy", lastFetched: "Internal Job", nextScheduled: "N/A" },
        duplicates: [],
      };
      setJobs((current) => [newJob, ...current]);
      selectTab("All Jobs");
      setPage(1);
      notify(`Internal job ${newJob.status === "Draft" ? "saved as a draft" : "posted locally"}.`);
    }
    setDialogJob(null);
  };

  const handleExport = (rows = sortedJobs) => {
    const fields = ["id", "title", "company", "source", "location", "workMode", "experience", "salary", "status", "appsCount"];
    const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [fields.join(","), ...rows.map((job) => fields.map((field) => quote(job[field])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "jobs.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${rows.length} job(s) to CSV.`);
  };

  const updateFilters = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm(""); setLocationFilter("All"); setSourceFilter("All");
    setStatusFilter("All"); setWorkModeFilter("All"); setEmploymentFilter("All");
    setDateFrom(""); setDateTo(""); setPage(1);
  };

  const saveCurrentView = (event) => {
    event.preventDefault();
    if (!viewName.trim()) return;
    setSavedViews((current) => [...current, { name: viewName.trim(), activeTab, searchTerm, locationFilter, sourceFilter, statusFilter, workModeFilter, employmentFilter, dateFrom, dateTo }]);
    setViewName("");
    notify("Job view saved.");
  };

  const applyView = (view) => {
    selectTab(view.activeTab); setSearchTerm(view.searchTerm);
    setLocationFilter(view.locationFilter); setSourceFilter(view.sourceFilter);
    setStatusFilter(view.statusFilter); setWorkModeFilter(view.workModeFilter);
    setEmploymentFilter(view.employmentFilter); setDateFrom(view.dateFrom);
    setDateTo(view.dateTo); setPage(1); setShowSavedViews(false);
  };

  const expireSelected = () => {
    setJobs((current) => current.map((job) => selectedJobIds.includes(job.id) ? { ...job, status: "Expired" } : job));
    notify(`${selectedJobIds.length} job(s) marked expired.`);
    setSelectedJobIds([]);
  };

  const archiveSelected = () => {
    setJobs((current) => current.map((job) => selectedJobIds.includes(job.id) ? { ...job, status: "Hidden" } : job));
    notify(`${selectedJobIds.length} job(s) archived.`);
    setSelectedJobIds([]);
    setInspectingJobId(null);
  };

  const refetchSelected = () => {
    const fetchedAt = new Date().toLocaleString();
    setJobs((current) => current.map((job) => selectedJobIds.includes(job.id)
      ? { ...job, fetchedOn: `Just now (${job.source})`, sourceDetails: { ...job.sourceDetails, lastFetched: fetchedAt } }
      : job));
    notify(`Refreshed ${selectedJobIds.length} job record(s) locally. Source connections are not configured.`);
    setSelectedJobIds([]);
  };

  return (
    <div className="jobs-page-layout">
      <div className="jobs-main-content">
        {/* Page Top Header */}
        <div className="jobs-header-row">
          <div>
            <h1 className="jobs-page-title">Jobs</h1>
            <div className="sub-count-line">
              <strong>8,432 added in last 30 days</strong>
            </div>
            <p className="jobs-page-desc">
              Manage public jobs aggregated from multiple sources and internal
              openings posted by your team.
            </p>
          </div>

          {activeTab !== "Job Sources" && activeTab !== "Internal Openings" && <div className="header-actions-group">
            <button
              className="btn-export-white"
              onClick={() => handleExport()}
            >
              <FiDownload size={13} />
              <span>Export</span>
              <FiChevronDown size={12} />
            </button>
            <button
              className="btn-primary-post"
              onClick={() => selectTab("Internal Openings")}
            >
              <FiPlus size={15} />
              <span>Post Internal Job</span>
            </button>
          </div>}
        </div>

        {/* 4 Metric Cards */}
        {activeTab !== "Job Sources" && activeTab !== "Internal Openings" && <div className="jobs-metric-grid">
          {/* Card 1: Jobs Added (30d) */}
          <div className="metric-box">
            <span className="metric-header-title">Jobs Added (30d)</span>
            <div className="metric-body-split">
              <div className="metric-big-number">
                {jobMetrics.jobsAdded30d.total}
              </div>
              <div className="metric-breakdown-sub">
                <div className="breakdown-col">
                  <span className="bd-label">Public</span>
                  <span className="bd-val">
                    {jobMetrics.jobsAdded30d.public}
                  </span>
                  <span className="bd-pct">
                    {jobMetrics.jobsAdded30d.publicPct}
                  </span>
                </div>
                <div className="breakdown-divider"></div>
                <div className="breakdown-col">
                  <span className="bd-label">Internal</span>
                  <span className="bd-val">
                    {jobMetrics.jobsAdded30d.internal}
                  </span>
                  <span className="bd-pct">
                    {jobMetrics.jobsAdded30d.internalPct}
                  </span>
                </div>
              </div>
            </div>
            <div className="metric-trend-row">
              <span className="trend-green">
                <FiTrendingUp /> {jobMetrics.jobsAdded30d.change}
              </span>
              <span className="trend-period">
                {jobMetrics.jobsAdded30d.vsText}
              </span>
            </div>
          </div>

          {/* Card 2: Live Jobs */}
          <div className="metric-box">
            <span className="metric-header-title">
              Live Jobs <span className="sub-gray">(currently active)</span>
            </span>
            <div className="metric-big-number solo">
              {jobs.filter((job) => job.status === "Active").length}
            </div>
            <div className="metric-trend-row">
              <span className="trend-green">
                <FiTrendingUp /> {jobMetrics.liveJobs.change}
              </span>
              <span className="trend-period">{jobMetrics.liveJobs.vsText}</span>
            </div>
          </div>

          {/* Card 3: Jobs Added Today */}
          <div className="metric-box">
            <span className="metric-header-title">Jobs Added Today</span>
            <div className="metric-big-number solo">
              {jobMetrics.jobsAddedToday.total}
            </div>
            <div className="metric-trend-row">
              <span className="trend-green">
                <FiTrendingUp /> {jobMetrics.jobsAddedToday.change}
              </span>
              <span className="trend-period">
                {jobMetrics.jobsAddedToday.vsText}
              </span>
            </div>
            <span className="metric-timestamp-footer">
              {jobMetrics.jobsAddedToday.timestamp}
            </span>
          </div>

          {/* Card 4: Job Sources */}
          <div className="metric-box">
            <span className="metric-header-title">Job Sources</span>
            <div className="metric-big-number solo">
              {jobMetrics.jobSources.total}{" "}
              <span className="healthy-word">healthy</span>
            </div>
            <div className="sources-status-breakdown">
              <span className="source-dot-text">
                <span className="dot-g"></span> 12 Healthy
              </span>
              <span className="source-dot-text">
                <span className="dot-a"></span> 2 Issues
              </span>
              <span className="source-dot-text">
                <span className="dot-m"></span> 1 Paused
              </span>
            </div>
            <button
              className="view-sources-link"
              onClick={() => selectTab("Job Sources")}
            >
              <span>View sources</span>
              <FiArrowUpRight size={13} />
            </button>
          </div>
        </div>}

        {/* Top Category Tabs */}
        <div className="jobs-category-tabs-row">
          <div className="tabs-left">
            <button
              className={`job-nav-tab ${activeTab === "All Jobs" ? "active" : ""}`}
              onClick={() => selectTab("All Jobs")}
            >
              <span>All Positions</span>
              <span className="tab-counter">{jobs.filter((job) => job.status !== "Hidden").length}</span>
            </button>
            <button
              className={`job-nav-tab ${activeTab === "Public Jobs" ? "active" : ""}`}
              onClick={() => selectTab("Public Jobs")}
            >
              <span>Market Feeds</span>
              <span className="tab-counter">{jobs.filter((job) => job.type === "public" && job.status !== "Hidden").length}</span>
            </button>
            <button
              className={`job-nav-tab ${activeTab === "Internal Openings" ? "active" : ""}`}
              onClick={() => selectTab("Internal Openings")}
            >
              <span>Internal Openings</span>
              <span className="tab-counter">{jobs.filter((job) => job.type === "internal" && job.status !== "Hidden").length}</span>
            </button>
            <button
              className={`job-nav-tab ${activeTab === "Job Sources" ? "active" : ""}`}
              onClick={() => selectTab("Job Sources")}
            >
              <span>Crawler Sources</span>
              <span className="tab-counter">15</span>
            </button>
          </div>

          {activeTab !== "Job Sources" && activeTab !== "Internal Openings" && <div className="tabs-right">
            <button
              className="btn-saved-views"
              onClick={() => setShowSavedViews((visible) => !visible)}
              aria-expanded={showSavedViews}
            >
              <span>Saved Views</span>
              <FiChevronDown size={12} />
            </button>
            <button className="btn-more-icon" aria-label="Job page options" onClick={() => setShowColumns((visible) => !visible)}>
              <FiMoreHorizontal size={14} />
            </button>
          </div>}
        </div>

        {activeTab === "Job Sources" && <JobSources globalSearchTerm={globalSearchTerm} />}
        {activeTab === "Internal Openings" && <InternalJobs globalSearchTerm={globalSearchTerm} />}

        {/* Table & Filtering Card */}
        {activeTab !== "Job Sources" && activeTab !== "Internal Openings" && <div className="jobs-table-card">
          {/* Controls Bar */}
          <div className="table-controls-top">
            <div className="search-field-box">
              <FiSearch className="search-icon-left" />
              <input
                type="text"
                placeholder="Search jobs by title, company or skills..."
                value={searchTerm}
                onChange={(e) => updateFilters(setSearchTerm, e.target.value)}
              />
            </div>

            <div className="filters-dropdowns-group">
              <select
                className="table-dropdown-select"
                value={locationFilter}
                onChange={(e) => updateFilters(setLocationFilter, e.target.value)}
              >
                <option value="All">Location</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
                <option value="Remote">Remote</option>
              </select>

              <select
                className="table-dropdown-select"
                value={sourceFilter}
                onChange={(e) => updateFilters(setSourceFilter, e.target.value)}
              >
                <option value="All">Source</option>
                <option value="linkedin">LinkedIn</option>
                <option value="naukri">Naukri</option>
                <option value="indeed">Indeed</option>
                <option value="glassdoor">Glassdoor</option>
                <option value="aifagen">AiFAGen</option>
              </select>

              <select
                className="table-dropdown-select"
                value={statusFilter}
                onChange={(e) => updateFilters(setStatusFilter, e.target.value)}
              >
                <option value="All">Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
                <option value="hidden">Hidden (archived)</option>
              </select>

              <button
                className="table-btn-select"
                onClick={() => setShowMoreFilters((visible) => !visible)}
                aria-expanded={showMoreFilters}
              >
                <FiCalendar size={12} />
                <span>{dateFrom || dateTo ? `${dateFrom || "Any"} – ${dateTo || "Any"}` : "Posted Date"}</span>
                <FiChevronDown size={11} />
              </button>

              <button
                className="table-btn-select"
                onClick={() => setShowMoreFilters((visible) => !visible)}
                aria-expanded={showMoreFilters}
              >
                <FiFilter size={12} />
                <span>More filters</span>
              </button>

              <button
                className="table-btn-select"
                onClick={() => setShowColumns((visible) => !visible)}
                aria-expanded={showColumns}
              >
                <FiColumns size={12} />
                <span>Columns</span>
                <FiChevronDown size={11} />
              </button>
            </div>
          </div>

          {/* Active Filter Pills Strip */}
          <div className="active-filters-strip">
            <div className="pills-left-group">
              {(dateFrom || dateTo) && (
                <span className="date-filter-bubble">
                  Posted: {dateFrom || "Any"} – {dateTo || "Any"}
                  <button aria-label="Remove date filter" className="cross-icon" onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}><FiX size={12} /></button>
                </span>
              )}
              <button
                className="clear-all-link"
                onClick={clearFilters}
              >
                Clear all
              </button>
            </div>

            <div className="sort-pages-group">
              <label className="sort-dropdown-wrap">Sort:
                <select value={`${sort.field}:${sort.direction}`} onChange={(event) => { const [field, direction] = event.target.value.split(":"); setSort({ field, direction }); setPage(1); }}>
                  <option value="addedTimestamp:desc">Newest first</option><option value="addedTimestamp:asc">Oldest first</option><option value="title:asc">Title A–Z</option><option value="title:desc">Title Z–A</option><option value="appsCount:desc">Most applications</option><option value="quality:desc">Highest quality</option>
                </select>
              </label>
              <label className="per-page-wrap">Rows:
                <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                  <option value={5}>5 per page</option><option value={10}>10 per page</option><option value={25}>25 per page</option>
                </select>
              </label>
            </div>
          </div>

          {showMoreFilters && <div className="jobs-extra-filters">
            <label>Posted from<input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} /></label>
            <label>Posted to<input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} /></label>
            <label>Work mode<select value={workModeFilter} onChange={(event) => updateFilters(setWorkModeFilter, event.target.value)}><option value="All">All work modes</option>{[...new Set(jobs.map((job) => job.workMode))].map((mode) => <option key={mode}>{mode}</option>)}</select></label>
            <label>Employment type<select value={employmentFilter} onChange={(event) => updateFilters(setEmploymentFilter, event.target.value)}><option value="All">All employment types</option>{[...new Set(jobs.map((job) => job.employmentType.split(" · ")[0]))].map((type) => <option key={type}>{type}</option>)}</select></label>
          </div>}
          {showColumns && <div className="jobs-columns-menu">{Object.entries(columns).map(([key, visible]) => <label key={key}><input type="checkbox" checked={visible} onChange={() => setColumns((current) => ({ ...current, [key]: !current[key] }))} />{key[0].toUpperCase() + key.slice(1)}</label>)}</div>}
          {showSavedViews && <div className="jobs-saved-views">
            <form onSubmit={saveCurrentView}><label>View name<input value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder="Name this filter view" required /></label><button type="submit">Save current view</button></form>
            {savedViews.map((view, index) => <button type="button" key={`${view.name}-${index}`} onClick={() => applyView(view)}>{view.name}</button>)}
            {!savedViews.length && <span>No saved views yet.</span>}
          </div>}

          {/* Jobs Data Table */}
          <div className="table-scroll-container">
            <table className="jobs-table">
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
                  <th><button className="jobs-sort-header" onClick={() => { setSort((current) => ({ field: "title", direction: current.field === "title" && current.direction === "asc" ? "desc" : "asc" })); setPage(1); }}>Job Title {sort.field === "title" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  {columns.company && <th>Company</th>}
                  {columns.source && <th>Source</th>}
                  {columns.location && <th>Location</th>}
                  {columns.experience && <th>Experience</th>}
                  {columns.salary && <th>Salary</th>}
                  {columns.added && <th>Added</th>}
                  {columns.status && <th>Status</th>}
                  {columns.quality && <th>Quality</th>}
                  {columns.apps && <th>Apps</th>}
                  {columns.actions && <th>Actions</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {!pageJobs.length && <tr><td className="jobs-empty-state" colSpan={Object.values(columns).filter(Boolean).length + 3}>No jobs match these filters.</td></tr>}
                {pageJobs.map((job) => {
                  const isChecked = selectedJobIds.includes(job.id);
                  const isSelected = inspectingJobId === job.id;

                  return (
                    <tr
                      key={job.id}
                      className={`job-table-row ${isSelected ? "row-active-highlight" : ""}`}
                      onClick={() => setInspectingJobId(job.id)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(job.id)}
                        />
                      </td>

                      <td>
                        <div className="job-title-cell">
                          <div className="company-table-logo">
                            {job.logo ? (
                              <img
                                src={job.logo}
                                alt={job.company}
                                className="tbl-logo-img"
                              />
                            ) : job.isInternal || job.source === "AiFAGen" || job.company?.toLowerCase().includes("aifagen") ? (
                              <img
                                src="/aifagenlogo-icon.png"
                                alt="AiFAGen"
                                className="tbl-logo-img"
                              />
                            ) : (
                              <div className="tbl-logo-placeholder">
                                <svg
                                  width="15"
                                  height="15"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    d="M12 2L2 7L12 12L22 7L12 2Z"
                                    fill="#3b82f6"
                                  />
                                  <path
                                    d="M2 17L12 22L22 17"
                                    stroke="#3b82f6"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="job-title-stack">
                            <span className="job-main-name">{job.title}</span>
                            <span className="job-sub-type">
                              {job.employmentType}
                            </span>
                          </div>
                        </div>
                      </td>

                      {columns.company && <td className="company-text">{job.company}</td>}

                      {columns.source && <td>
                        <div className="source-tag-combo">
                          {job.sourceIcon === "linkedin" && (
                            <span className="icon-source-box linkedin">
                              <BsLinkedin size={11} />
                            </span>
                          )}
                          {job.sourceIcon === "naukri" && (
                            <span className="icon-source-box naukri">n</span>
                          )}
                          {job.sourceIcon === "indeed" && (
                            <span className="icon-source-box indeed">i</span>
                          )}
                          {job.sourceIcon === "glassdoor" && (
                            <span className="icon-source-box glassdoor">G</span>
                          )}
                          {job.sourceIcon === "internal" && (
                            <span className="icon-source-box internal">
                              {job.authorInitials}
                            </span>
                          )}
                          {job.duplicatesCount && (
                            <span className="dup-counter-pill">
                              {job.duplicatesCount}
                            </span>
                          )}
                        </div>
                      </td>}

                      {columns.location && <td>
                        <div className="location-cell-stack">
                          <span className="loc-main">{job.location}</span>
                          <span className="loc-sub">{job.workMode}</span>
                        </div>
                      </td>}

                      {columns.experience && <td className="exp-cell">{job.experience}</td>}

                      {columns.salary && <td className="salary-cell">{job.salary}</td>}

                      {columns.added && <td>
                        <div className="added-time-cell">
                          <span>{job.addedRelative}</span>
                          <span className="time-muted">
                            {job.addedTimestamp}
                          </span>
                        </div>
                      </td>}

                      {columns.status && <td>
                        <span
                          className={`status-badge-pill ${job.status.toLowerCase()}`}
                        >
                          {job.status}
                        </span>
                      </td>}

                      {columns.quality && <td className="quality-cell">
                        {job.quality !== null ? job.quality : "—"}
                      </td>}

                      {columns.apps && <td className="apps-count-cell">{job.appsCount}</td>}

                      {columns.actions && <td onClick={(e) => e.stopPropagation()}>
                        {job.status === "Draft" ? (
                          <button
                            className="btn-edit-action"
                            onClick={() => openJobForm(job)}
                          >
                            Edit
                          </button>
                        ) : (
                          <button
                            className="btn-view-action"
                            onClick={() => setInspectingJobId(job.id)}
                          >
                            View
                          </button>
                        )}
                      </td>}

                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="row-options-btn"
                          aria-label={`Actions for ${job.title}`}
                          aria-expanded={rowMenuId === job.id}
                          onClick={() => setRowMenuId((current) => current === job.id ? null : job.id)}
                        >
                          <FiMoreHorizontal size={14} />
                        </button>
                        {rowMenuId === job.id && <div className="jobs-row-menu">
                          <button onClick={() => { setInspectingJobId(job.id); setRowMenuId(null); }}>View details</button>
                          <button onClick={() => { openJobForm(job); setRowMenuId(null); }}>Edit job</button>
                          <button onClick={() => { handleRefetchJob(job); setRowMenuId(null); }}>Re-fetch</button>
                          <button onClick={() => { handleExpireJob(job); setRowMenuId(null); }}>Mark expired</button>
                          <button onClick={() => { handleHideJob(job); setRowMenuId(null); }}>Archive job</button>
                        </div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Navigation Footer */}
          <div className="jobs-pagination-footer">
            <span className="showing-entries-text">
              Showing {sortedJobs.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, sortedJobs.length)} of {sortedJobs.length} jobs
            </span>

            <div className="page-numbers-cluster">
              <button className="page-arrow" disabled={currentPage <= 1} onClick={() => setPage((value) => value - 1)}>
                <FiChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} className={`page-num ${pageNumber === currentPage ? "active" : ""}`} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}
              <button className="page-arrow" disabled={currentPage >= totalPages} onClick={() => setPage((value) => value + 1)}>
                <FiChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>}
      </div>

      {/* On-Demand Right Drawer (Opens only when a user clicks a row or View) */}
      {activeTab !== "Job Sources" && activeTab !== "Internal Openings" && activeJob && (
        <JobDetailsDrawer
          job={activeJob}
          currentIndex={Math.max(0, currentInspectIndex)}
          totalCount={sortedJobs.length}
          onNext={handleNextJob}
          onPrev={handlePrevJob}
          onClose={() => setInspectingJobId(null)}
          onExpire={handleExpireJob}
          onHide={handleHideJob}
          onRefetch={handleRefetchJob}
          onEdit={openJobForm}
          onNotify={notify}
          onCopy={async (text) => {
            try {
              await navigator.clipboard.writeText(text);
              notify("Copied to clipboard.");
            } catch {
              notify("Clipboard access is unavailable in this browser.");
            }
          }}
        />
      )}

      {/* Floating Multi-Selection Action Bar */}
      {activeTab !== "Job Sources" && activeTab !== "Internal Openings" && selectedJobIds.length > 0 && (
        <div className="floating-job-actions">
          <div className="selected-counter-box">
            <input
              type="checkbox"
              checked={true}
              onChange={() => setSelectedJobIds([])}
              className="table-checkbox"
            />
            <span>
              <strong>{selectedJobIds.length} job selected</strong>
            </span>
          </div>

          <div className="selected-buttons-row">
            <button
              className="bulk-action-btn"
              onClick={expireSelected}
            >
              <FiSlash size={12} />
              <span>Mark as expired</span>
            </button>

            <button
              className="bulk-action-btn"
              onClick={archiveSelected}
            >
              <FiEyeOff size={12} />
              <span>Hide job</span>
            </button>

            <button
              className="bulk-action-btn"
              onClick={() => handleExport(selectedJobs)}
            >
              <FiDownload size={12} />
              <span>Export (selected)</span>
            </button>

            <button
              className="bulk-action-btn"
              onClick={refetchSelected}
            >
              <FiRefreshCw size={12} />
              <span>Re-fetch</span>
            </button>

            <button
              className="bulk-action-btn icon-only"
              onClick={() => setSelectedJobIds([])}
            >
              <FiX size={13} />
            </button>
          </div>
        </div>
      )}
      {activeTab !== "Job Sources" && dialogJob && <div className="jobs-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogJob(null); }}>
        <section className="jobs-dialog" role="dialog" aria-modal="true" aria-labelledby="jobs-dialog-title">
          <button className="jobs-dialog-close" aria-label="Close dialog" onClick={() => setDialogJob(null)}><FiX /></button>
          <h2 id="jobs-dialog-title">{dialogJob.id ? "Edit job" : "Post internal job"}</h2>
          {!dialogJob.id && <p>New jobs are added to this local demo. No external publishing service is connected.</p>}
          <form onSubmit={saveJob}>
            <label>Job title<input required value={dialogJob.title} onChange={(event) => setDialogJob((job) => ({ ...job, title: event.target.value }))} /></label>
            <label>Company<input required value={dialogJob.company} onChange={(event) => setDialogJob((job) => ({ ...job, company: event.target.value }))} /></label>
            <label>Employment type<input value={dialogJob.employmentType} onChange={(event) => setDialogJob((job) => ({ ...job, employmentType: event.target.value }))} /></label>
            <label>Location<input required value={dialogJob.location} onChange={(event) => setDialogJob((job) => ({ ...job, location: event.target.value }))} /></label>
            <label>Work mode<select value={dialogJob.workMode} onChange={(event) => setDialogJob((job) => ({ ...job, workMode: event.target.value }))}><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label>
            <label>Experience<input value={dialogJob.experience} onChange={(event) => setDialogJob((job) => ({ ...job, experience: event.target.value }))} /></label>
            <label>Salary<input value={dialogJob.salary} onChange={(event) => setDialogJob((job) => ({ ...job, salary: event.target.value }))} /></label>
            <label>Application URL<input type="url" value={dialogJob.applicationLink} onChange={(event) => setDialogJob((job) => ({ ...job, applicationLink: event.target.value }))} /></label>
            <label>Status<select value={dialogJob.status} onChange={(event) => setDialogJob((job) => ({ ...job, status: event.target.value }))}><option>Draft</option><option>Active</option><option>Expired</option></select></label>
            <div className="jobs-dialog-actions"><button type="button" onClick={() => setDialogJob(null)}>Cancel</button><button type="submit">{dialogJob.id ? "Save changes" : dialogJob.status === "Draft" ? "Save draft" : "Post job"}</button></div>
          </form>
        </section>
      </div>}
      {notice && <div className="jobs-notice" role="status">{notice}</div>}
    </div>
  );
}
