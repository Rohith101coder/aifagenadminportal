import { useState } from "react";
import {
  FiX,
  FiExternalLink,
  FiEdit2,
  FiPlay,
  FiPause,
  FiSlash,
  FiMoreHorizontal,
  FiArrowUpRight,
} from "react-icons/fi";
import { weeklyTrendChartData } from "../../data/jobSourcesData";
import "./JobSourceDetailsDrawer.css";

export default function JobSourceDetailsDrawer({
  source,
  onClose,
  onRunFetch,
  onPauseSource,
  onDisableSource,
  onEditSource,
  runHistory = [],
}) {
  const [activeTab, setActiveTab] = useState("Overview");

  if (!source) return null;

  return (
    <aside className="source-details-drawer">
      {/* Drawer Top Header */}
      <div className="drawer-header-row">
        <div className="drawer-brand-block">
          <div
            className="drawer-source-avatar"
            style={{ backgroundColor: source.iconColor }}
          >
            {source.iconLetter}
          </div>
          <div className="drawer-source-names">
            <div className="title-status-line">
              <h2>{source.name}</h2>
              <span className={`status-pill ${source.status.toLowerCase()}`}>
                <span className="dot"></span>
                {source.status}
              </span>
            </div>
            <a
              href={`https://${source.domain.split(" ")[0]}`}
              target="_blank"
              rel="noreferrer"
              className="source-domain-link"
            >
              {source.domain}
            </a>
          </div>
        </div>

        <button
          className="drawer-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="drawer-nav-tabs">
        {["Overview", "Configuration", "Fetch Logs", "Activity"].map((tab) => (
          <button
            key={tab}
            className={`drawer-tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Scrollable Body */}
      <div className="drawer-body-scroll">
        {activeTab === "Overview" && <>
        {/* Section: Key Metrics */}
        <section className="drawer-card-section">
          <div className="section-title-bar">
            <h4>
              Key Metrics <span className="sub-tag">(Last 30 days) :</span>
            </h4>
            <button
              className="icon-ext-btn"
              onClick={() => setActiveTab("Fetch Logs")}
            >
              <FiExternalLink size={13} />
            </button>
          </div>

          <div className="kpis-three-col-grid">
            <div className="kpi-cell">
              <span className="kpi-number">{source.jobsFetched}</span>
              <span className="kpi-title">Jobs fetched</span>
            </div>
            <div className="kpi-cell">
              <span className="kpi-number">
                {source.netNewJobs.split(" ")[0]}
              </span>
              <span className="kpi-title">Net new jobs</span>
              <span className="kpi-sub-pct">
                ({source.netNewJobs.split(" ")[1] || "90.1%"})
              </span>
            </div>
            <div className="kpi-cell">
              <span className="kpi-number">{source.failureRate}</span>
              <span className="kpi-title">Failure rate</span>
              <span className="kpi-sub-pct">({source.failureFraction})</span>
            </div>
          </div>

          <div className="kpis-four-col-grid">
            <div className="kpi-cell-mini">
              <span className="kpi-val-bold">{source.duplicateRate}</span>
              <span className="kpi-sub-desc">Duplicate rate</span>
            </div>
            <div className="kpi-cell-mini">
              <span className="kpi-val-bold">{source.appliesEst}</span>
              <span className="kpi-sub-desc">Applies (estimate)</span>
            </div>
            <div className="kpi-cell-mini">
              <span className="kpi-val-bold">{source.savesEst}</span>
              <span className="kpi-sub-desc">Saves (estimate)</span>
            </div>
            <div className="kpi-cell-mini">
              <span className="kpi-val-bold">{source.viewsEst}</span>
              <span className="kpi-sub-desc">Views (estimate)</span>
            </div>
          </div>
        </section>

        {/* Section: Health & Status */}
        <section className="drawer-card-section">
          <div className="section-title-bar">
            <h4>Health & Status</h4>
            <button
              className="btn-edit-outline"
              onClick={() => onEditSource(source)}
            >
              <FiEdit2 size={11} />
              <span>Edit</span>
            </button>
          </div>

          <div className="attributes-kv-stack">
            <div className="kv-item-row">
              <span className="kv-label">Status</span>
              <span className="status-val-pill">
                <span className="dot-green"></span>
                {source.status}
              </span>
            </div>

            <div className="kv-item-row">
              <span className="kv-label">Last attempt</span>
              <span className="kv-val">
                {source.lastAttempt} IST ({source.lastAttemptAgo})
              </span>
            </div>

            <div className="kv-item-row">
              <span className="kv-label">Last success</span>
              <span className="kv-val">
                {source.lastSuccess} IST ({source.lastAttemptAgo})
              </span>
            </div>

            <div className="kv-item-row">
              <span className="kv-label">Next scheduled fetch</span>
              <span className="kv-val">{source.nextScheduledFetch}</span>
            </div>

            <div className="kv-item-row">
              <span className="kv-label">Uptime (30d)</span>
              <span className="kv-val">{source.uptime}</span>
            </div>

            <div className="kv-item-row">
              <span className="kv-label">Fetch frequency</span>
              <span className="kv-val">{source.frequency}</span>
            </div>

            <div className="kv-item-row">
              <span className="kv-label">Category</span>
              <span className="kv-val">{source.category}</span>
            </div>

            <div className="kv-item-row">
              <span className="kv-label">Owner</span>
              <div className="owner-avatar-line">
                <span className="avatar-chip">{source.ownerInitials}</span>
                <span className="kv-val">{source.owner}</span>
              </div>
            </div>

            <div className="kv-item-row">
              <span className="kv-label">Alert rule</span>
              <span className="kv-val alert-rule-text">{source.alertRule}</span>
            </div>
          </div>
        </section>

        {/* Section: Jobs Added Trend (7 days) */}
        <section className="drawer-card-section">
          <div className="section-title-bar">
            <h4>
              Jobs Added Trend <span className="sub-tag">(Last 7 days) :</span>
            </h4>
            <div className="chart-legend-stack">
              <span className="legend-indicator">
                <span className="legend-box blue"></span> Jobs added
              </span>
              <span className="legend-indicator">
                <span className="legend-box red"></span> Failed runs
              </span>
            </div>
          </div>

          {/* Bar Chart Canvas */}
          <div className="trend-bar-chart-wrap">
            <div className="chart-y-axis">
              <span>400</span>
              <span>300</span>
              <span>200</span>
              <span>100</span>
              <span>0</span>
            </div>

            <div className="chart-bars-area">
              <div className="chart-bars-flex">
                {weeklyTrendChartData.map((d, i) => (
                  <div key={i} className="chart-col-group">
                    <div className="stacked-bars">
                      <div
                        className="bar-primary"
                        style={{ height: `${(d.added / 400) * 100}%` }}
                      ></div>
                      <div
                        className="bar-danger"
                        style={{ height: `${(d.failed / 100) * 100}%` }}
                      ></div>
                    </div>
                    <span className="x-label-day">{d.day}</span>
                    {d.partial && (
                      <span className="x-label-sub">(partial)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-summary-foot">
            {source.chartSummary ||
              "324 jobs added on Oct 12 (so far) • 1 failed run\nAverage 287 jobs/day, 0.7% failure rate over last 7 days."}
          </div>
        </section>
        </>}

        {activeTab === "Configuration" && <section className="drawer-card-section drawer-tab-panel">
          <div className="section-title-bar"><h4>Source configuration</h4><button className="btn-edit-outline" onClick={() => onEditSource(source)}><FiEdit2 size={11} /><span>Edit</span></button></div>
          {[["Name", source.name], ["Domain", source.domain], ["Category", source.category], ["Region", source.region], ["Fetch frequency", source.frequency], ["Owner", source.owner], ["Alert rule", source.alertRule], ["Mapped fields", source.mappedFields], ["Version", source.version]].map(([label, value]) => <div className="kv-item-row" key={label}><span className="kv-label">{label}</span><span className="kv-val">{value || "Not configured"}</span></div>)}
        </section>}

        {activeTab === "Fetch Logs" && <section className="drawer-card-section drawer-tab-panel">
          <div className="section-title-bar"><h4>Fetch history</h4><button className="btn-edit-outline" onClick={() => onRunFetch(source)}><FiPlay size={11} /><span>Run demo sync</span></button></div>
          {runHistory.length ? runHistory.map((entry) => <div className="source-log-entry" key={entry.id}><strong>{entry.status}</strong><span>{entry.started}</span><p>{entry.message}</p></div>) : <div className="source-empty-tab">No sync runs recorded in this session. Run demo sync to add an entry. External fetch is not configured.</div>}
        </section>}

        {activeTab === "Activity" && <section className="drawer-card-section drawer-tab-panel">
          <div className="section-title-bar"><h4>Recent activity</h4></div>
          {[...runHistory].map((entry) => <div className="source-log-entry" key={entry.id}><strong>{entry.status === "Completed" ? "Sync completed" : "Sync requested"}</strong><span>{entry.started}</span><p>{entry.message}</p></div>)}
          {!runHistory.length && <div className="source-empty-tab">No activity recorded for this source in this session.</div>}
        </section>}

        {activeTab === "Overview" && <>
        {/* Section: Data Mapping */}
        <section className="drawer-card-section">
          <div className="section-title-bar">
            <h4>
              Data Mapping <span className="sub-tag">(summary) :</span>
            </h4>
            <button
              className="link-view-config"
              onClick={() => setActiveTab("Configuration")}
            >
              <span>View in Configuration</span>
              <FiArrowUpRight size={12} />
            </button>
          </div>

          <div className="attributes-kv-stack">
            <div className="kv-item-row">
              <span className="kv-label">Mapped fields</span>
              <span className="kv-val bold">{source.mappedFields}</span>
            </div>
            <div className="kv-item-row">
              <span className="kv-label">Last updated</span>
              <span className="kv-val">{source.lastUpdatedMapping}</span>
            </div>
            <div className="kv-item-row">
              <span className="kv-label">Version</span>
              <span className="kv-val bold">{source.version}</span>
            </div>
          </div>
        </section>
        </>}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="drawer-bottom-actions-bar">
        <button
          className="btn-quick-action primary"
          onClick={() => onRunFetch(source)}
        >
          <FiPlay size={12} fill="#ffffff" />
          <span>Run fetch now</span>
        </button>
        <button
          className="btn-quick-action outline"
          onClick={() => onPauseSource(source)}
        >
          <FiPause size={12} />
          <span>{source.status === "Paused" ? "Resume source" : "Pause source"}</span>
        </button>
        <button
          className="btn-quick-action danger"
          onClick={() => onDisableSource(source)}
        >
          <FiSlash size={12} />
          <span>Disable source</span>
        </button>
        <button
          className="btn-more-icon-sq"
          onClick={() => setActiveTab("Configuration")}
        >
          <FiMoreHorizontal size={14} />
        </button>
      </div>
    </aside>
  );
}
