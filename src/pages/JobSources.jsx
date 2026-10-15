import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiDownload,
  FiPlus,
  FiPlay,
  FiPause,
  FiRefreshCw,
  FiX,
  FiColumns,
  FiMoreHorizontal,
  FiList,
  FiGrid,
  FiAlertTriangle,
  FiCheck,
  FiClock,
  FiActivity,
} from "react-icons/fi";
import {
  initialJobSourcesList,
  jobSourcesOverviewMetrics,
  PROBLEM_STATUSES,
} from "../data/jobSourcesData";
import { matchesGlobalSearch } from "../data/globalSearch";
import { logAuditAction } from "../data/auditLogData";
import JobSourceDetailsDrawer from "../components/JobSourceDetailsDrawer/JobSourceDetailsDrawer";
import "./JobSources.css";

export default function JobSources({ globalSearchTerm = "" }) {
  const [sources, setSources] = useState(() => {
    try {
      const stored = window.localStorage.getItem("aifagen-job-sources");
      return stored ? JSON.parse(stored) : initialJobSourcesList;
    } catch {
      return initialJobSourcesList;
    }
  });

  const [activeStatusTab, setActiveStatusTab] = useState("All");
  const [selectedIds, setSelectedIds] = useState([]);
  const [inspectingSourceId, setInspectingSourceId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [runHistoryModal, setRunHistoryModal] = useState(false);
  const [sourceDialog, setSourceDialog] = useState(null);
  const [notice, setNotice] = useState("");
  const [recentRuns, setRecentRuns] = useState([
    {
      id: "run-101",
      source: "LinkedIn Talent",
      time: "Oct 14, 01:24 PM IST",
      duration: "5m 28s",
      status: "Working",
      jobsSaved: "348 (+112 new)",
      note: "Scheduled crawl completed cleanly.",
    },
    {
      id: "run-102",
      source: "Google Careers",
      time: "Oct 14, 12:15 PM IST",
      duration: "3m 10s",
      status: "Working",
      jobsSaved: "165 (+48 new)",
      note: "Career portal sync successful.",
    },
    {
      id: "run-103",
      source: "Naukri",
      time: "Oct 14, 07:55 AM IST",
      duration: "4m 12s",
      status: "Failed",
      jobsSaved: "0 (0 new)",
      note: "Cloudflare challenge triggered.",
    },
  ]);
  const noticeTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const notify = (message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3500);
  };

  const persistSources = (next) => {
    setSources(next);
    try {
      window.localStorage.setItem("aifagen-job-sources", JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  };

  // Header line counts (Page 6: "X working · Y need attention")
  const workingCount = useMemo(
    () => sources.filter((s) => s.status === "Working" || s.status === "Running").length,
    [sources]
  );
  const needAttentionCount = useMemo(
    () => sources.filter((s) => PROBLEM_STATUSES.includes(s.status)).length,
    [sources]
  );

  // Filter & sort: Problem sources listed first as required by Page 6!
  const filteredSources = useMemo(() => {
    const q = (searchQuery || globalSearchTerm).trim().toLowerCase();

    const filtered = sources.filter((item) => {
      if (activeStatusTab === "Working" && item.status !== "Working") return false;
      if (activeStatusTab === "Needs attention" && !PROBLEM_STATUSES.includes(item.status)) return false;
      if (activeStatusTab !== "All" && activeStatusTab !== "Working" && activeStatusTab !== "Needs attention" && item.status !== activeStatusTab) return false;

      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.domain.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q));

      const matchCategory = categoryFilter === "All" || item.category === categoryFilter;
      const matchRegion = regionFilter === "All" || item.region === regionFilter;

      return matchSearch && matchCategory && matchRegion;
    });

    // Page 6 Rule: "Problem sources are listed first."
    return [...filtered].sort((a, b) => {
      const aProblem = PROBLEM_STATUSES.includes(a.status) ? 0 : 1;
      const bProblem = PROBLEM_STATUSES.includes(b.status) ? 0 : 1;
      if (aProblem !== bProblem) return aProblem - bProblem;
      return a.name.localeCompare(b.name);
    });
  }, [sources, activeStatusTab, searchQuery, globalSearchTerm, categoryFilter, regionFilter]);

  const activeInspectedSource = sources.find((s) => s.id === inspectingSourceId) || null;

  // Actions
  const handleRunFetchNow = (source) => {
    const originalStatus = source.status;
    const updated = sources.map((s) => (s.id === source.id ? { ...s, status: "Running" } : s));
    persistSources(updated);
    notify(`Started ingestion crawler for ${source.name}...`);

    setTimeout(() => {
      const nowStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      const completed = sources.map((s) =>
        s.id === source.id
          ? {
              ...s,
              status: "Working",
              lastRunTime: `Today, ${nowStr} IST`,
              lastRunAgo: "Just now",
              duration: "3m 42s",
              jobsSavedRun: "128",
              newJobsBracket: "(+42 new)",
              jobs24h: (s.jobs24h || 100) + 42,
              note: "Completed live refresh run cleanly.",
              hasProblem: false,
            }
          : s
      );
      persistSources(completed);

      setRecentRuns((prev) => [
        {
          id: `run-${Date.now()}`,
          source: source.name,
          time: `Today, ${nowStr} IST`,
          duration: "3m 42s",
          status: "Working",
          jobsSaved: "128 (+42 new)",
          note: "Manual refresh completed.",
        },
        ...prev,
      ]);

      logAuditAction({
        category: "Admin changes",
        eventTitle: "Job source refreshed",
        eventSummary: `Manual collection run for ${source.name}`,
        targetName: source.name,
        targetType: "Job Source",
        targetId: source.id,
        field: "sync",
        previousValue: originalStatus,
        newValue: "Working",
        reason: "Admin triggered manual crawler refresh",
      });

      notify(`Refreshed ${source.name}: 42 new candidate jobs added.`);
    }, 1500);
  };

  // Start Refresh All (Page 6: "Start refresh button that starts a new collection run")
  const handleStartRefreshAll = () => {
    setIsRefreshingAll(true);
    notify("Initiating full collection run across all connected job sources...");

    const running = sources.map((s) => ({ ...s, status: "Running" }));
    persistSources(running);

    setTimeout(() => {
      const refreshed = sources.map((s) => {
        if (s.name.includes("Glassdoor")) {
          return {
            ...s,
            status: "Blocked",
            note: "HTTP 403 Forbidden. Proxy rotation in progress.",
            hasProblem: true,
          };
        }
        return {
          ...s,
          status: "Working",
          lastRunTime: "Just now",
          lastRunAgo: "Just now",
          duration: "4m 10s",
          jobsSavedRun: "215",
          newJobsBracket: "(+68 new)",
          jobs24h: (s.jobs24h || 200) + 68,
          note: "Collection run finished without errors.",
          hasProblem: false,
        };
      });

      persistSources(refreshed);
      setIsRefreshingAll(false);

      logAuditAction({
        category: "Admin changes",
        eventTitle: "Full job sources refresh",
        eventSummary: `Completed global crawler collection across ${sources.length} sources`,
        targetName: "All Job Sources",
        targetType: "System",
        targetId: "src_all",
        field: "batch_run",
        previousValue: `${needAttentionCount} issues`,
        newValue: "Refreshed",
        reason: "Full automated ingestion sync run",
      });

      notify("Collection run complete: 9 sources working, 1 source needs attention.");
    }, 2000);
  };

  const handleExport = (rows = filteredSources) => {
    const fields = ["name", "domain", "status", "lastRunTime", "duration", "jobsSavedRun", "jobs24h", "note"];
    const quote = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const csv = [
      fields.join(","),
      ...rows.map((row) => fields.map((f) => quote(row[f])).join(",")),
    ].join("\r\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `aifagen-job-sources-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${rows.length} source records to CSV.`);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((curr) => (curr.includes(id) ? curr.filter((i) => i !== id) : [...curr, id]));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredSources.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  return (
    <div className="job-sources-page-container">
      {/* Page Header */}
      <div className="sources-header-row">
        <div>
          <h1 className="sources-page-title">
            Job Sources <span className="sources-total-num">· {sources.length} sources</span>
          </h1>
          {/* Header Line (Page 6 Spec): "X working · Y need attention" */}
          <div className="sources-status-headline">
            <span className="headline-badge working">
              <span className="dot online"></span>
              <strong>{workingCount} working</strong>
            </span>
            <span className="headline-divider">·</span>
            <span className="headline-badge attention">
              <span className="dot red"></span>
              <strong>{needAttentionCount} need attention</strong>
            </span>
            <span className="headline-note">Problem sources are listed first</span>
          </div>
        </div>

        <div className="header-right-btns">
          <button className="btn-history" onClick={() => setRunHistoryModal(true)}>
            <FiClock size={14} />
            <span>Run History</span>
          </button>
          <button
            className="btn-refresh-all"
            onClick={handleStartRefreshAll}
            disabled={isRefreshingAll}
          >
            <FiRefreshCw size={14} className={isRefreshingAll ? "spin" : ""} />
            <span>{isRefreshingAll ? "Running Collection..." : "Start Refresh"}</span>
          </button>
          <button className="btn-export-sources" onClick={() => handleExport()}>
            <FiDownload size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="sources-filter-card">
        <div className="filter-tabs-row">
          <div className="filter-tabs-left">
            {[
              { label: "All", count: sources.length },
              { label: "Needs attention", count: needAttentionCount },
              { label: "Working", count: workingCount },
              { label: "Failed", count: sources.filter((s) => s.status === "Failed").length },
              { label: "Blocked", count: sources.filter((s) => s.status === "Blocked").length },
            ].map((tab) => (
              <button
                key={tab.label}
                className={`source-tab-btn ${activeStatusTab === tab.label ? "active" : ""}`}
                onClick={() => setActiveStatusTab(tab.label)}
              >
                <span>{tab.label}</span>
                <span className="tab-pill-count">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="filter-search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search source name or problem note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Selected Batch Bar */}
        {selectedIds.length > 0 && (
          <div className="selected-batch-bar">
            <span>
              <strong>{selectedIds.length}</strong> sources selected
            </span>
            <div className="batch-actions">
              <button
                onClick={() => {
                  sources.filter((s) => selectedIds.includes(s.id)).forEach(handleRunFetchNow);
                  setSelectedIds([]);
                }}
              >
                <FiPlay size={12} /> Refresh Selected
              </button>
              <button onClick={() => setSelectedIds([])}>Clear Selection</button>
            </div>
          </div>
        )}

        {/* Table (Page 6: name, status, last run time, how long it took, jobs saved with new in brackets, jobs 24h, note) */}
        <div className="table-responsive">
          <table className="sources-spec-table">
            <thead>
              <tr>
                <th style={{ width: "36px" }}>
                  <input
                    type="checkbox"
                    checked={filteredSources.length > 0 && selectedIds.length === filteredSources.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Source Name &amp; Domain</th>
                <th>Status</th>
                <th>Last Run Time &amp; Duration</th>
                <th>Jobs Saved in Run</th>
                <th>Jobs (24h)</th>
                <th>Problem / Health Note</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSources.map((source) => {
                const isProblem = PROBLEM_STATUSES.includes(source.status);
                const isSelected = selectedIds.includes(source.id);
                const isInspecting = inspectingSourceId === source.id;

                return (
                  <tr
                    key={source.id}
                    className={`source-row ${isProblem ? "problem-row" : ""} ${isInspecting ? "inspecting" : ""}`}
                    onClick={() => setInspectingSourceId(source.id)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(source.id)}
                      />
                    </td>
                    <td>
                      <div className="source-title-block">
                        <strong className="source-main-name">{source.name}</strong>
                        <span className="source-domain-link">{source.domain}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`source-status-badge ${source.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        <span className="status-dot"></span>
                        {source.status}
                      </span>
                    </td>
                    <td>
                      <div className="time-duration-cell">
                        <span className="time-text">{source.lastRunTime}</span>
                        <small className="duration-tag">
                          Took {source.duration || "3m"} · {source.lastRunAgo || "Recent"}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="jobs-saved-cell">
                        <span className="saved-number">{source.jobsSavedRun || "0"}</span>
                        <span className="new-bracket-text">{source.newJobsBracket || "(0 new)"}</span>
                      </div>
                    </td>
                    <td>
                      <span className="jobs-24h-badge">{(source.jobs24h || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <div className={`problem-note-cell ${isProblem ? "is-problem" : ""}`}>
                        {source.note || "Operating normally."}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons-group">
                        <button
                          className="btn-fetch-now"
                          title="Start refresh for this source"
                          onClick={() => handleRunFetchNow(source)}
                          disabled={source.status === "Running"}
                        >
                          <FiRefreshCw size={13} className={source.status === "Running" ? "spin" : ""} />
                          <span>Run</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSources.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-sources-cell">
                    No job sources found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Drawer for Inspection */}
      {activeInspectedSource && (
        <JobSourceDetailsDrawer
          source={activeInspectedSource}
          onClose={() => setInspectingSourceId(null)}
          onRunNow={() => handleRunFetchNow(activeInspectedSource)}
          onNotify={notify}
        />
      )}

      {/* Recent Run History Modal (Page 6: "plus a history of recent runs") */}
      {runHistoryModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-box large">
            <div className="modal-header">
              <div className="modal-icon-wrap">
                <FiActivity size={20} />
              </div>
              <div>
                <h3>Recent Collection Runs History</h3>
                <p>Log of automated and manual job ingestion runs.</p>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setRunHistoryModal(false)}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <table className="history-modal-table">
                <thead>
                  <tr>
                    <th>Job Source</th>
                    <th>Execution Time</th>
                    <th>Duration</th>
                    <th>Result</th>
                    <th>Jobs Captured</th>
                    <th>Log Message</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((run) => (
                    <tr key={run.id}>
                      <td><strong>{run.source}</strong></td>
                      <td>{run.time}</td>
                      <td>{run.duration}</td>
                      <td>
                        <span className={`source-status-badge ${run.status.toLowerCase()}`}>
                          {run.status}
                        </span>
                      </td>
                      <td>{run.jobsSaved}</td>
                      <td className="log-msg-cell">{run.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setRunHistoryModal(false)}>
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notice && (
        <div className="sources-toast" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <FiX size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
