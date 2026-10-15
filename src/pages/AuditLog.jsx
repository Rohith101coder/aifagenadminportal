import { useState } from "react";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiSettings,
} from "react-icons/fi";
import { initialAuditLogs } from "../data/auditLogData";
import { matchesGlobalSearch } from "../data/globalSearch";
import AuditEventDetailsDrawer from "../components/AuditEventDetailsDrawer/AuditEventDetailsDrawer";
import "./AuditLog.css";

export default function AuditLog({ searchTerm = "" }) {
  const logs = initialAuditLogs;
  const [activeTab, setActiveTab] = useState("All");
  const [includeSystemEvents, setIncludeSystemEvents] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actorTypeFilter, setActorTypeFilter] = useState("All");
  const [actorFilter, setActorFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [resourceFilter, setResourceFilter] = useState("All");

  // Drawer state: opens ONLY when a row is clicked
  const [inspectingEventId, setInspectingEventId] = useState(null);

  // Multi-Filter Application
  const filteredLogs = logs.filter((item) => {
    // Top Tabs
    if (activeTab === "Security" && item.category !== "Security") return false;
    if (activeTab === "Admin changes" && item.category !== "Admin changes")
      return false;
    if (activeTab === "Failed" && item.category !== "Failed") return false;

    // Include System Events Checkbox
    if (!includeSystemEvents && item.actorType === "system") return false;

    // Search query
    const matchSearch =
      item.eventSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetId.toLowerCase().includes(searchQuery.toLowerCase());

    // Dropdowns
    const matchActorType =
      actorTypeFilter === "All"
        ? true
        : item.actorType === actorTypeFilter.toLowerCase();
    const matchActor =
      actorFilter === "All" ? true : item.actor === actorFilter;
    const matchAction =
      actionFilter === "All"
        ? true
        : item.eventTitle.toLowerCase().includes(actionFilter.toLowerCase());
    const matchResource =
      resourceFilter === "All" ? true : item.targetType === resourceFilter;

    return (
      matchSearch && matchesGlobalSearch(item, searchTerm) &&
      matchActorType &&
      matchActor &&
      matchAction &&
      matchResource
    );
  });

  const activeInspectedEvent =
    logs.find((e) => e.id === inspectingEventId) || null;

  return (
    <div className="audit-log-page-layout">
      <div className="audit-log-main-content">
        {/* Header Bar */}
        <div className="audit-page-header">
          <div>
            <h1 className="audit-title">Audit Log</h1>
            <p className="audit-subtitle">Retained 12 months · Read-only</p>
          </div>

          <div className="audit-header-actions">
            <button
              className="btn-export-outline"
              onClick={() => alert("Exporting audit trail (CSV/JSON)")}
            >
              <FiDownload size={13} />
              <span>Export</span>
              <FiChevronDown size={11} />
            </button>
          </div>
        </div>

        {/* Top Underlined Tabs */}
        <div className="audit-nav-tabs-bar">
          {["All", "Security", "Admin changes", "Failed"].map((tab) => (
            <button
              key={tab}
              className={`audit-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters Toolbar */}
        <div className="audit-filters-toolbar">
          <div className="search-box-wrap">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="dropdowns-filter-group">
            <div className="filter-select-pill">
              <span className="select-prefix">Actor type</span>
              <select
                value={actorTypeFilter}
                onChange={(e) => setActorTypeFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="user">User</option>
                <option value="system">System</option>
              </select>
              <FiChevronDown size={11} className="arrow" />
            </div>

            <div className="filter-select-pill">
              <span className="select-prefix">Actor</span>
              <select
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Rohith P">Rohith P</option>
                <option value="Priya Desai">Priya Desai</option>
                <option value="Sarah Chen">Sarah Chen</option>
                <option value="Michael Tan">Michael Tan</option>
                <option value="AiFAGen System">AiFAGen System</option>
              </select>
              <FiChevronDown size={11} className="arrow" />
            </div>

            <div className="filter-select-pill">
              <span className="select-prefix">Action</span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="status">Status Change</option>
                <option value="delete">Delete</option>
                <option value="invite">Invite</option>
                <option value="rotated">Rotate</option>
              </select>
              <FiChevronDown size={11} className="arrow" />
            </div>

            <div className="filter-select-pill">
              <span className="select-prefix">Resource</span>
              <select
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Job">Job</option>
                <option value="User">User</option>
                <option value="API Key">API Key</option>
                <option value="Job Source">Job Source</option>
              </select>
              <FiChevronDown size={11} className="arrow" />
            </div>

            <button
              className="btn-more-filters-outline"
              onClick={() => alert("Advanced Filter Drawer")}
            >
              <FiFilter size={12} />
              <span>More filters</span>
            </button>
          </div>
        </div>

        {/* Include System Events Toggle Row */}
        <div className="system-events-toggle-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeSystemEvents}
              onChange={(e) => setIncludeSystemEvents(e.target.checked)}
              className="audit-checkbox"
            />
            <span>Include system events</span>
          </label>

          <span className="new-events-indicator-pill">
            <span className="blue-dot"></span>
            <span>3 new events</span>
          </span>
        </div>

        {/* Audit Log Data Table */}
        <div className="audit-table-card">
          <div className="table-responsive-scroll">
            <table className="audit-data-table">
              <thead>
                <tr>
                  <th style={{ width: "20px" }}></th>
                  <th>Time (IST) ↓</th>
                  <th>Actor</th>
                  <th>Event</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const isInspected = inspectingEventId === log.id;

                  return (
                    <tr
                      key={log.id}
                      className={`audit-row ${isInspected ? "active-inspect" : ""}`}
                      onClick={() => setInspectingEventId(log.id)}
                    >
                      <td className="severity-indicator-col">
                        {log.severityDot && (
                          <span
                            className={`severity-dot ${log.severityDot}`}
                          ></span>
                        )}
                      </td>

                      <td>
                        <div className="time-stack">
                          <span className="time-date">{log.date}</span>
                          <span className="time-clock">{log.time}</span>
                        </div>
                      </td>

                      <td>
                        <div className="actor-stack">
                          <div className="actor-name-line">
                            {log.actorType === "system" && (
                              <FiSettings
                                size={12}
                                color="#64748b"
                                className="actor-gear"
                              />
                            )}
                            <span className="actor-bold">{log.actor}</span>
                          </div>
                          <span className="actor-sub">{log.actorRole}</span>
                        </div>
                      </td>

                      <td>
                        <span className="event-summary-text">
                          {log.eventSummary}
                        </span>
                      </td>

                      <td>
                        <div className="target-stack">
                          <span className="target-name">{log.targetName}</span>
                          <span className="target-id-muted">
                            {log.targetId}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination */}
          <div className="audit-table-footer">
            <span className="showing-records-text">
              Showing 1–15 of 12,843 events
            </span>

            <div className="pagination-numbers-cluster">
              <button className="nav-arrow-btn" disabled>
                <FiChevronLeft size={13} />
              </button>
              <button className="page-num-pill active">1</button>
              <button className="page-num-pill">2</button>
              <button className="page-num-pill">3</button>
              <button className="page-num-pill">4</button>
              <button className="page-num-pill">5</button>
              <span className="page-dots-sub">...</span>
              <button className="page-num-pill">857</button>
              <button className="nav-arrow-btn">
                <FiChevronRight size={13} />
              </button>

              <div className="per-page-select-pill">
                <span>15 per page</span>
                <FiChevronDown size={11} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* On-Demand Right Drawer (Opens only when an event row is clicked) */}
      {activeInspectedEvent && (
        <AuditEventDetailsDrawer
          event={activeInspectedEvent}
          onClose={() => setInspectingEventId(null)}
        />
      )}
    </div>
  );
}
