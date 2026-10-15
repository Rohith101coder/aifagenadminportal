import { useState } from "react";
import {
  FiX,
  FiEdit2,
  FiExternalLink,
  FiPlay,
  FiSlash,
  FiMoreHorizontal,
  FiTrendingUp,
  FiTrendingDown,
  FiLayers,
} from "react-icons/fi";
import "./AIFeatureDetailsDrawer.css";

export default function AIFeatureDetailsDrawer({
  feature,
  onClose,
  onTestRun,
  onToggleFeature,
  onEditLimits,
  onEditRouting,
  onAction,
  onOpenLogs,
}) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [moreOpen, setMoreOpen] = useState(false);

  if (!feature) return null;

  return (
    <aside className="ai-drawer-container">
      {/* Top Header */}
      <div className="ai-drawer-header">
        <div className="ai-brand-line">
          <div className="ai-feature-icon-square">{feature.iconText}</div>
          <div className="ai-title-wrap">
            <div className="ai-heading-pill">
              <h2>{feature.name}</h2>
              <span
                className={`badge-status-pill ${feature.status.toLowerCase()}`}
              >
                <span className="status-dot"></span>
                {feature.status}
              </span>
            </div>
            <span className="ai-sub-tag">{feature.subName}</span>
          </div>
        </div>
        <button className="ai-close-btn" onClick={onClose} aria-label="Close">
          <FiX size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="ai-drawer-tabs">
        {["Overview", "Usage", "Configuration", "Limits", "Activity"].map(
          (tab) => (
            <button
              key={tab}
              className={`ai-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      {/* Scrollable Content */}
      <div className="ai-drawer-scroll">
        {/* Key Metrics Grid */}
        {["Overview", "Usage"].includes(activeTab) && (
        <section className="ai-drawer-section">
          <div className="section-head-line">
            <h4>
              Key Metrics <span className="sub-period">(Last 30 days)</span>
            </h4>
            <button
              className="btn-link-action"
              onClick={() => setActiveTab("Usage")}
            >
              <span>View full analytics</span>
              <FiExternalLink size={11} />
            </button>
          </div>

          <div className="metrics-six-grid">
            <div className="metric-box">
              <span className="val-bold">{feature.runs30d}</span>
              <span className="lbl-muted">Runs</span>
              <span className="trend-lbl green">
                <FiTrendingUp size={10} /> {feature.runsChange}
              </span>
            </div>
            <div className="metric-box">
              <span className="val-bold">{feature.usersCount}</span>
              <span className="lbl-muted">Users</span>
              {feature.usersChange && (
                <span className="trend-lbl green">
                  <FiTrendingUp size={10} /> {feature.usersChange}
                </span>
              )}
            </div>
            <div className="metric-box">
              <span className="val-bold">{feature.cost}</span>
              <span className="lbl-muted">Cost</span>
              <span className="trend-lbl green">
                <FiTrendingUp size={10} /> {feature.costChange}
              </span>
            </div>
            <div className="metric-box">
              <span className="val-bold">{feature.costPerRun}</span>
              <span className="lbl-muted">Cost / run</span>
              <span className="trend-lbl green">
                <FiTrendingDown size={10} /> {feature.costPerRunChange}
              </span>
            </div>
            <div className="metric-box">
              <span className="val-bold">{feature.successPct}</span>
              <span className="lbl-muted">Success rate</span>
              <span className="trend-lbl red">
                <FiTrendingDown size={10} /> {feature.successPctChange}
              </span>
            </div>
            <div className="metric-box">
              <span className="val-bold">{feature.p95Latency}</span>
              <span className="lbl-muted">p95 latency</span>
              <span className="trend-lbl green">
                <FiTrendingDown size={10} /> {feature.p95LatencyChange}
              </span>
            </div>
          </div>

          <div className="metrics-tri-grid">
            <div className="sub-metric-row">
              <span className="sub-val">{feature.cacheHitPct}</span>
              <span className="sub-lbl">Cache hit rate</span>
              <span className="trend-lbl green">
                <FiTrendingUp size={9} /> {feature.cacheHitChange}
              </span>
            </div>
            <div className="sub-metric-row">
              <span className="sub-val">{feature.failedRuns}</span>
              <span className="sub-lbl">Failed runs</span>
              <span className="trend-lbl green">
                <FiTrendingDown size={9} /> {feature.failedRunsChange}
              </span>
            </div>
            <div className="sub-metric-row">
              <span className="sub-val">{feature.fallbackRate}</span>
              <span className="sub-lbl">Fallback rate</span>
              <span className="trend-lbl red">
                <FiTrendingUp size={9} /> {feature.fallbackRateChange}
              </span>
            </div>
          </div>
        </section>
        )}

        {/* Model Routing */}
        {["Overview", "Configuration"].includes(activeTab) && (
        <section className="ai-drawer-section">
          <div className="section-head-line">
            <h4>Model Routing</h4>
            <button
              className="btn-edit-badge"
              onClick={() => onEditRouting(feature)}
            >
              <FiEdit2 size={11} />
              <span>Edit</span>
            </button>
          </div>

          <div className="kv-attributes-list">
            <div className="kv-row">
              <span className="kv-label">Primary Model</span>
              <span className="kv-val bold">{feature.primaryModel}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Fallback Model</span>
              <span className="kv-val">{feature.fallbackModel}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Fallback Triggers</span>
              <span className="kv-val small-text">
                {feature.fallbackTriggers}
              </span>
            </div>
          </div>
        </section>
        )}

        {/* Prompt & Version */}
        {["Overview", "Configuration", "Activity"].includes(activeTab) && (
        <section className="ai-drawer-section">
          <div className="section-head-line">
            <h4>Prompt & Version</h4>
            <button
              className="btn-link-action"
              onClick={() => onAction(`Current prompt version: ${feature.promptVersion} (${feature.promptUpdated}). ${feature.promptChanges}`)}
            >
              View history
            </button>
          </div>

          <div className="kv-attributes-list">
            <div className="kv-row">
              <span className="kv-label">Current Version</span>
              <span className="kv-val">
                {feature.promptVersion}{" "}
                <span className="sub-date">({feature.promptUpdated})</span>
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Changes</span>
              <span className="kv-val">{feature.promptChanges}</span>
            </div>
          </div>

          <button
            className="btn-compare-versions"
            onClick={() => onAction(`Current version ${feature.promptVersion}: ${feature.promptChanges}`)}
          >
            <FiLayers size={12} />
            <span>Compare Versions</span>
          </button>
        </section>
        )}

        {/* Limits (Per User Plan) */}
        {["Overview", "Configuration", "Limits"].includes(activeTab) && (
        <section className="ai-drawer-section">
          <div className="section-head-line">
            <h4>Limits (Per User Plan)</h4>
            <button
              className="btn-edit-badge"
              onClick={() => onEditLimits(feature)}
            >
              <FiEdit2 size={11} />
              <span>Edit</span>
            </button>
          </div>

          <div className="limits-table-wrap">
            <table className="limits-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Monthly Runs</th>
                  <th>Tokens / Run</th>
                </tr>
              </thead>
              <tbody>
                {(feature.limits && feature.limits.length > 0
                  ? feature.limits
                  : [
                      { plan: "Free", runs: "5", tokens: "8K" },
                      { plan: "Basic", runs: "50", tokens: "12K" },
                      { plan: "Premium", runs: "200", tokens: "16K" },
                    ]
                ).map((lim, idx) => (
                  <tr key={idx}>
                    <td className="bold">{lim.plan}</td>
                    <td>{lim.runs}</td>
                    <td>{lim.tokens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="limit-behavior-note">
            <span className="note-lbl">Current behavior on limit hit:</span>
            <span className="note-val">Block request with upgrade message</span>
          </div>
        </section>
        )}

        {/* Failure Reasons */}
        {["Overview", "Usage", "Activity"].includes(activeTab) && (
        <section className="ai-drawer-section">
          <div className="section-head-line">
            <h4>
              Failure Reasons <span className="sub-period">(Last 30 days)</span>
            </h4>
            <button
              className="btn-link-action"
              onClick={onOpenLogs}
            >
              View all
            </button>
          </div>

          <div className="failures-bars-stack">
            {(feature.failureReasons && feature.failureReasons.length > 0
              ? feature.failureReasons
              : [
                  {
                    reason: "Invalid JSON",
                    count: 42,
                    pct: "47.2%",
                    color: "#ef4444",
                  },
                  {
                    reason: "Timeout",
                    count: 28,
                    pct: "31.5%",
                    color: "#f97316",
                  },
                  {
                    reason: "Rate limit",
                    count: 12,
                    pct: "13.5%",
                    color: "#f59e0b",
                  },
                  {
                    reason: "Content filter",
                    count: 5,
                    pct: "5.6%",
                    color: "#94a3b8",
                  },
                  {
                    reason: "Context too long",
                    count: 2,
                    pct: "2.2%",
                    color: "#cbd5e1",
                  },
                ]
            ).map((f, i) => (
              <div key={i} className="failure-item-row">
                <div className="fail-name-count">
                  <span className="fail-reason">{f.reason}</span>
                  <span className="fail-count">
                    {f.count} ({f.pct})
                  </span>
                </div>
                <div className="fail-progress-track">
                  <div
                    className="fail-bar-fill"
                    style={{ width: f.pct, backgroundColor: f.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="ai-drawer-bottom-bar">
        <button className="btn-test-run" onClick={() => onTestRun(feature)}>
          <FiPlay size={12} fill="#334155" />
          <span>Test Run</span>
        </button>
        <button
          className="btn-disable-feature"
          onClick={() => onToggleFeature(feature)}
        >
          <FiSlash size={12} />
          <span>{feature.status === "Inactive" ? "Enable Feature" : "Disable Feature"}</span>
        </button>
        <div className="drawer-more-wrap">
        <button className="btn-sq-more" aria-label="More feature actions" aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}>
          <FiMoreHorizontal size={14} />
        </button>
        {moreOpen && <div className="drawer-more-menu">
          <button onClick={() => { onOpenLogs(); setMoreOpen(false); }}>View activity logs</button>
          <button onClick={() => { onEditLimits(feature); setMoreOpen(false); }}>Edit plan limits</button>
          <button onClick={() => { onEditRouting(feature); setMoreOpen(false); }}>Edit model routing</button>
        </div>}
        </div>
      </div>
    </aside>
  );
}
