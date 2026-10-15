import { useMemo, useState } from "react";
import {
  FiChevronDown,
  FiDownload,
  FiFilter,
  FiSearch,
  FiSliders,
  FiTrendingDown,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";
import {
  aiTopMetrics,
  costByFeatureDistribution,
  costTrendDailyBars,
  initialAiFeaturesList,
} from "../data/aiUsageData";
import { matchesGlobalSearch } from "../data/globalSearch";
import AIFeatureDetailsDrawer from "../components/AIFeatureDetailsDrawer/AIFeatureDetailsDrawer";
import "./AIUsage.css";

const tableTabs = [
  "Features",
  "Users & Employers",
  "Limits & Quotas",
  "Models",
  "API Keys",
  "Logs",
];
const fallbackPlans = [
  { plan: "Free", runs: "5", tokens: "8K" },
  { plan: "Basic", runs: "50", tokens: "12K" },
  { plan: "Premium", runs: "200", tokens: "16K" },
];
const featureColors = costByFeatureDistribution.items.map((item) => item.color);

const money = (value) => Number.parseFloat(String(value).replace(/[$,]/g, "")) || 0;
const percent = (value) => Number.parseFloat(String(value).replace("%", "")) || 0;
const audienceGroup = (audience) =>
  audience === "Job Seeker" ? ["Job Seekers"] : audience === "Employer" ? ["Employers"] : audience === "Both" ? ["Job Seekers", "Employers"] : ["Platform"];

function downloadCsv(rows, columns, filename) {
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [
    columns.map((column) => escape(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => escape(row[column.key])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function makeDemoKey() {
  const bytes = new Uint8Array(12);
  window.crypto.getRandomValues(bytes);
  return `aifagen_test_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export default function AIUsage({ searchTerm = "", dateRange = "Last 30 days" }) {
  const [features, setFeatures] = useState(initialAiFeaturesList);
  const [topRoleTab, setTopRoleTab] = useState("All");
  const [tableSubTab, setTableSubTab] = useState("Features");
  const [selectedIds, setSelectedIds] = useState([]);
  const [inspectingFeatureId, setInspectingFeatureId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modelFilter, setModelFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");
  const [extraFiltersOpen, setExtraFiltersOpen] = useState(false);
  const [minimumCost, setMinimumCost] = useState("");
  const [minimumSuccess, setMinimumSuccess] = useState("");
  const [savedViewsOpen, setSavedViewsOpen] = useState(false);
  const [savedView, setSavedView] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState(null);
  const [chartMetric, setChartMetric] = useState("Cost (USD)");
  const [hiddenSeries, setHiddenSeries] = useState([]);
  const [modal, setModal] = useState(null);
  const [globalLimits, setGlobalLimits] = useState({ budget: "1000", warningPercent: "80" });
  const [limitDraft, setLimitDraft] = useState([]);
  const [routingDraft, setRoutingDraft] = useState({ primaryModel: "", fallbackModel: "" });
  const [apiKeys, setApiKeys] = useState([
    { id: "key-demo", name: "Development key", value: "aifagen_test_••••••••••••", status: "Active", created: "Demo" },
  ]);
  const [logs, setLogs] = useState([]);
  const [notice, setNotice] = useState("");

  const addLog = (action, target) => {
    setLogs((items) => [
      { id: `${Date.now()}-${Math.random()}`, action, target, actor: "Rohith P", time: new Date().toLocaleString() },
      ...items,
    ]);
  };

  const notify = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  };

  const updateFilters = (patch) => {
    if ("searchQuery" in patch) setSearchQuery(patch.searchQuery);
    if ("audienceFilter" in patch) setAudienceFilter(patch.audienceFilter);
    if ("statusFilter" in patch) setStatusFilter(patch.statusFilter);
    if ("modelFilter" in patch) setModelFilter(patch.modelFilter);
    if ("teamFilter" in patch) setTeamFilter(patch.teamFilter);
    if ("minimumCost" in patch) setMinimumCost(patch.minimumCost);
    if ("minimumSuccess" in patch) setMinimumSuccess(patch.minimumSuccess);
  };

  const filteredFeatures = useMemo(() => {
    const localQuery = searchQuery.trim().toLowerCase();
    return features.filter((feature) => {
      if (topRoleTab === "Job Seekers" && !["Job Seeker", "Both"].includes(feature.audience)) return false;
      if (topRoleTab === "Employers" && !["Employer", "Both"].includes(feature.audience)) return false;
      if (topRoleTab === "System" && feature.audience !== "System") return false;
      if (audienceFilter !== "All" && feature.audience !== audienceFilter) return false;
      if (statusFilter !== "All" && feature.status !== statusFilter) return false;
      if (modelFilter !== "All" && ![feature.primaryModel, feature.fallbackModel].includes(modelFilter)) return false;
      if (teamFilter !== "All" && !audienceGroup(feature.audience).includes(teamFilter)) return false;
      if (minimumCost && money(feature.cost) < Number(minimumCost)) return false;
      if (minimumSuccess && percent(feature.successPct) < Number(minimumSuccess)) return false;
      const searchable = `${feature.name} ${feature.primaryModel} ${feature.fallbackModel} ${feature.audience} ${feature.status}`.toLowerCase();
      return (!localQuery || searchable.includes(localQuery)) && matchesGlobalSearch(feature, searchTerm);
    });
  }, [features, topRoleTab, audienceFilter, statusFilter, modelFilter, teamFilter, minimumCost, minimumSuccess, searchQuery, searchTerm]);

  const allRows = useMemo(() => {
    if (tableSubTab === "Features") return filteredFeatures;
    if (tableSubTab === "Users & Employers") {
      return ["Job Seeker", "Employer", "Both", "System"]
        .map((audience) => {
          const group = filteredFeatures.filter((feature) => feature.audience === audience);
          return {
            id: `audience-${audience}`,
            name: audience === "Both" ? "Shared features" : audience === "System" ? "Platform services" : audience === "Job Seeker" ? "Job seekers" : "Employers",
            audience,
            features: group.length,
            runs: group.reduce((sum, feature) => sum + (Number.parseInt(feature.runs30d.replaceAll(",", ""), 10) || 0), 0).toLocaleString(),
            users: group.reduce((sum, feature) => sum + (Number.parseInt(feature.usersCount.replaceAll(",", ""), 10) || 0), 0).toLocaleString(),
            cost: `$${group.reduce((sum, feature) => sum + money(feature.cost), 0).toFixed(2)}`,
            status: group.length ? "Active" : "—",
            model: group.length ? [...new Set(group.map((feature) => feature.primaryModel))].join(", ") : "—",
          };
        })
        .filter((row) => row.features > 0);
    }
    if (tableSubTab === "Limits & Quotas") {
      return filteredFeatures.flatMap((feature) =>
        (feature.limits?.length ? feature.limits : fallbackPlans).map((limit) => ({
          id: `${feature.id}-${limit.plan}`,
          feature,
          name: feature.name,
          audience: feature.audience,
          plan: limit.plan,
          runs: limit.runs,
          tokens: limit.tokens,
          status: feature.status,
        })),
      );
    }
    if (tableSubTab === "Models") {
      const models = new Map();
      filteredFeatures.forEach((feature) => {
        const current = models.get(feature.primaryModel) || { id: feature.primaryModel, model: feature.primaryModel, features: 0, runs: 0, cost: 0, status: "Active" };
        current.features += 1;
        current.runs += Number.parseInt(feature.runs30d.replaceAll(",", ""), 10) || 0;
        current.cost += money(feature.cost);
        if (feature.status !== "Active") current.status = feature.status;
        models.set(feature.primaryModel, current);
      });
      return [...models.values()].map((row) => ({ ...row, runs: row.runs.toLocaleString(), cost: `$${row.cost.toFixed(2)}` }));
    }
    if (tableSubTab === "API Keys") return apiKeys.filter((key) => statusFilter === "All" || key.status === statusFilter);
    return logs;
  }, [tableSubTab, filteredFeatures, apiKeys, logs, statusFilter]);

  const searchFilteredRows = useMemo(() => {
    if (tableSubTab === "Features") return allRows;
    const localQuery = searchQuery.trim().toLowerCase();
    return allRows.filter((row) => {
      const searchable = Object.values(row).flatMap((value) => value && typeof value === "object" ? Object.values(value) : [value]).join(" ").toLowerCase();
      return (!localQuery || searchable.includes(localQuery)) && matchesGlobalSearch(row, searchTerm);
    });
  }, [allRows, tableSubTab, searchQuery, searchTerm]);

  const activeFeature = features.find((feature) => feature.id === inspectingFeatureId) || null;
  const visibleFeatureIds = tableSubTab === "Features" ? searchFilteredRows.map((feature) => feature.id) : [];
  const selectedFeatures = features.filter((feature) => selectedIds.includes(feature.id));
  const isAllVisibleSelected = visibleFeatureIds.length > 0 && visibleFeatureIds.every((id) => selectedIds.includes(id));
  const filteredCost = filteredFeatures.reduce((sum, feature) => sum + money(feature.cost), 0);
  const spend = money(aiTopMetrics.spendThisMonth.usd);
  const budget = Number(globalLimits.budget) || 0;
  const globalLimitsValid =
    Number.isFinite(Number(globalLimits.budget)) &&
    Number(globalLimits.budget) >= 0 &&
    Number.isFinite(Number(globalLimits.warningPercent)) &&
    Number(globalLimits.warningPercent) >= 1 &&
    Number(globalLimits.warningPercent) <= 100;
  const budgetUsed = budget ? Math.min(100, (spend / budget) * 100) : 0;
  const activeChartPeriod = chartPeriod || (dateRange === "Last 7 days" ? "7 days" : "30 days");
  const chartBars = activeChartPeriod === "7 days" ? costTrendDailyBars.slice(-3) : costTrendDailyBars;

  const handleSelectAll = (event) => {
    setSelectedIds((current) =>
      event.target.checked
        ? [...new Set([...current, ...visibleFeatureIds])]
        : current.filter((id) => !visibleFeatureIds.includes(id)),
    );
  };
  const handleSelectOne = (id) =>
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const toggleFeature = (feature) => {
    const nextStatus = feature.status === "Inactive" ? "Active" : "Inactive";
    setFeatures((current) => current.map((item) => item.id === feature.id ? { ...item, status: nextStatus } : item));
    addLog(nextStatus === "Active" ? "Enabled feature" : "Disabled feature", feature.name);
    notify(`${feature.name} ${nextStatus === "Active" ? "enabled" : "disabled"} in this demo.`);
  };

  const handleTestRun = (feature) => {
    addLog("Test run", `${feature.name} · ${feature.primaryModel}`);
    notify(`Test run recorded for ${feature.name}.`);
    setTableSubTab("Logs");
  };

  const editFeatureLimits = (feature) => {
    setLimitDraft((feature.limits?.length ? feature.limits : fallbackPlans).map((limit) => ({ ...limit })));
    setModal({ type: "feature-limits", featureId: feature.id, title: `Limits · ${feature.name}` });
  };

  const saveFeatureLimits = () => {
    const feature = features.find((item) => item.id === modal.featureId);
    setFeatures((current) => current.map((item) => item.id === modal.featureId ? { ...item, limits: limitDraft } : item));
    addLog("Updated plan limits", feature?.name || "Feature");
    setModal(null);
    notify("Feature limits saved.");
  };

  const openRoutingEditor = (feature) => {
    setRoutingDraft({ primaryModel: feature.primaryModel, fallbackModel: feature.fallbackModel });
    setModal({ type: "routing", featureId: feature.id, title: `Model routing · ${feature.name}` });
  };

  const saveRouting = () => {
    const feature = features.find((item) => item.id === modal.featureId);
    setFeatures((current) => current.map((item) => item.id === modal.featureId ? { ...item, ...routingDraft } : item));
    addLog("Updated model routing", feature?.name || "Feature");
    setModal(null);
    notify("Model routing saved.");
  };

  const getColumns = () => {
    if (tableSubTab === "Features") return [
      { key: "name", label: "Feature" }, { key: "audience", label: "Audience" }, { key: "primaryModel", label: "Primary model" },
      { key: "runs30d", label: "Runs (30d)" }, { key: "usersCount", label: "Users / orgs" }, { key: "cost", label: "Cost (USD)" },
      { key: "costPerRun", label: "Cost / run" }, { key: "successPct", label: "Success" }, { key: "p95Latency", label: "p95 latency" }, { key: "status", label: "Status" }, { key: "actions", label: "Actions" },
    ];
    if (tableSubTab === "Users & Employers") return [
      { key: "name", label: "Audience" }, { key: "features", label: "Features" }, { key: "runs", label: "Runs (30d)" }, { key: "users", label: "Users / orgs" }, { key: "cost", label: "Cost (USD)" }, { key: "status", label: "Status" },
    ];
    if (tableSubTab === "Limits & Quotas") return [
      { key: "name", label: "Feature" }, { key: "audience", label: "Audience" }, { key: "plan", label: "Plan" }, { key: "runs", label: "Monthly runs" }, { key: "tokens", label: "Tokens / run" }, { key: "status", label: "Status" },
    ];
    if (tableSubTab === "Models") return [
      { key: "model", label: "Model" }, { key: "features", label: "Features" }, { key: "runs", label: "Runs (30d)" }, { key: "cost", label: "Cost (USD)" }, { key: "status", label: "Status" },
    ];
    if (tableSubTab === "API Keys") return [
      { key: "name", label: "Key name" }, { key: "value", label: "Key" }, { key: "created", label: "Created" }, { key: "status", label: "Status" }, { key: "actions", label: "Actions" },
    ];
    return [
      { key: "time", label: "Time" }, { key: "action", label: "Action" }, { key: "target", label: "Target" }, { key: "actor", label: "Actor" },
    ];
  };
  const columns = getColumns();

  const exportRows = (rows) => {
    const values = rows.map((row) => tableSubTab === "Features"
      ? ({ ...row, name: row.name, primaryModel: row.primaryModel })
      : row);
    downloadCsv(values, columns.filter((column) => column.key !== "actions"), `ai-${tableSubTab.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.csv`);
    setExportOpen(false);
    notify(`Exported ${values.length} ${tableSubTab.toLowerCase()} rows.`);
  };

  const applySavedView = () => {
    if (!savedView) return;
    updateFilters(savedView.filters);
    setTopRoleTab(savedView.topRoleTab);
    setTableSubTab(savedView.tableSubTab);
    setSavedViewsOpen(false);
    notify("Saved view applied.");
  };

  const toggleSeries = (index) =>
    setHiddenSeries((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);

  const renderFeatureRow = (feature) => (
    <tr key={feature.id} className={inspectingFeatureId === feature.id ? "row-active-inspect" : ""} onClick={() => setInspectingFeatureId(feature.id)}>
      <td onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(feature.id)} onChange={() => handleSelectOne(feature.id)} aria-label={`Select ${feature.name}`} /></td>
      <td><span className="feature-icon-badge">{feature.iconText}</span> <strong>{feature.name}</strong></td>
      <td><span className={`audience-pill ${feature.audienceClass}`}>{feature.audience}</span></td>
      <td>{feature.primaryModel}</td><td>{feature.runs30d}</td><td>{feature.usersCount}</td><td>{feature.cost}</td><td>{feature.costPerRun}</td><td>{feature.successPct}</td><td>{feature.p95Latency}</td>
      <td><span className={`status-pill ${feature.status.toLowerCase()}`}>{feature.status}</span></td>
      <td onClick={(event) => event.stopPropagation()}><button className="text-action" onClick={() => setInspectingFeatureId(feature.id)}>Details</button><button className="text-action" onClick={() => toggleFeature(feature)}>{feature.status === "Inactive" ? "Enable" : "Disable"}</button></td>
    </tr>
  );

  const renderOtherRow = (row) => (
    <tr key={row.id}>
      {columns.map((column) => (
        <td key={column.key}>
          {column.key === "status" ? <span className={`status-pill ${String(row.status).toLowerCase()}`}>{row.status}</span>
            : column.key === "value" ? <code>{row.value}</code>
              : column.key === "actions" ? <button className="text-action danger-action" onClick={() => {
                if (window.confirm(`Revoke ${row.name}?`)) {
                  setApiKeys((current) => current.filter((item) => item.id !== row.id));
                  addLog("Revoked API key", row.name);
                  notify(`${row.name} revoked.`);
                }
              }}>Revoke</button>
                : row[column.key] ?? "—"}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="ai-usage-layout">
      <main className="ai-usage-main">
        <header className="ai-header-row">
          <div>
            <h1 className="ai-page-title">AI Usage &amp; Limits</h1>
            <p className="ai-page-subtitle">Track AI feature usage, costs, and manage limits across your platform.</p>
            <p className="ai-date-context">Reporting period: {dateRange}</p>
          </div>
          <div className="ai-header-actions">
            <button className="btn-configure-limits" onClick={() => setModal({ type: "global-limits", title: "Configure global limits" })}><FiSliders size={14} /> Configure Limits</button>
            <div className="control-menu-wrap">
              <button className="btn-export-outline" onClick={() => setExportOpen((open) => !open)} aria-expanded={exportOpen}><FiDownload size={14} /> Export <FiChevronDown size={12} /></button>
              {exportOpen && <div className="ai-control-menu"><button onClick={() => exportRows(searchFilteredRows)}>Export current view ({searchFilteredRows.length})</button><button onClick={() => exportRows(selectedFeatures)}>Export selected features ({selectedFeatures.length})</button></div>}
            </div>
          </div>
        </header>

        {!["API Keys", "Logs"].includes(tableSubTab) && <nav className="top-pills-row" aria-label="Audience summary">
          {["All", "Job Seekers", "Employers", "System"].map((pill) => <button key={pill} className={`segmented-pill ${topRoleTab === pill ? "active" : ""}`} onClick={() => setTopRoleTab(pill)}>{pill}</button>)}
        </nav>}

        <section className="ai-kpi-grid">
          <article className="ai-kpi-card">
            <span className="kpi-label">Spend this month</span><strong className="kpi-big-num">{aiTopMetrics.spendThisMonth.usd}</strong>
            <span className="kpi-sub-currency">{aiTopMetrics.spendThisMonth.inr} <span className="rate-text">{aiTopMetrics.spendThisMonth.rateNote}</span></span>
            <div className="budget-meter"><span style={{ width: `${budgetUsed}%` }} /></div>
            <div className="budget-bar-line"><span className="budget-text">{budgetUsed.toFixed(1)}% of ${budget.toLocaleString()} budget</span><span className="budget-tag">{budget - spend >= 0 ? `$${(budget - spend).toFixed(2)} left` : "Over budget"}</span></div>
          </article>
          <article className="ai-kpi-card"><span className="kpi-label">Cost per ATS scan</span><strong className="kpi-big-num">{aiTopMetrics.costPerScan.usd}</strong><span className="kpi-sub-currency">{aiTopMetrics.costPerScan.inr}</span><div className="trend-stat-row"><span className="trend-badge green"><FiTrendingDown /> {aiTopMetrics.costPerScan.change}</span><span className="trend-vs">{aiTopMetrics.costPerScan.vsText}</span></div></article>
          <article className="ai-kpi-card"><span className="kpi-label">Cost per match</span><strong className="kpi-big-num">{aiTopMetrics.costPerMatch.usd}</strong><span className="kpi-sub-currency">{aiTopMetrics.costPerMatch.inr}</span><div className="trend-stat-row"><span className="trend-badge green"><FiTrendingDown /> {aiTopMetrics.costPerMatch.change}</span><span className="trend-vs">{aiTopMetrics.costPerMatch.vsText}</span></div></article>
          <article className="ai-kpi-card"><span className="kpi-label">Total requests</span><strong className="kpi-big-num">{aiTopMetrics.totalRequests.count}</strong><div className="trend-stat-row pad-top"><span className="trend-badge green"><FiTrendingUp /> {aiTopMetrics.totalRequests.change}</span><span className="trend-vs">{aiTopMetrics.totalRequests.vsText}</span></div></article>
          <article className="ai-kpi-card"><span className="kpi-label">Success rate</span><strong className="kpi-big-num">{aiTopMetrics.successRate.rate}</strong><div className="trend-stat-row pad-top"><span className="trend-badge red"><FiTrendingDown /> {aiTopMetrics.successRate.change}</span><span className="trend-vs">{aiTopMetrics.successRate.vsText}</span></div></article>
        </section>

        <section className="ai-charts-grid-row">
          <article className="ai-chart-card flex-2">
            <div className="chart-head-bar"><div><h2 className="chart-title">Usage trend <span className="sub-tag">({activeChartPeriod})</span></h2><span className="chart-period-note">The historical dataset contains up to 30 days of sample points.</span></div>
              <div className="chart-controls-group">
                <label className="sr-only" htmlFor="chart-period">Chart period</label><select id="chart-period" className="chart-select" value={activeChartPeriod} onChange={(event) => setChartPeriod(event.target.value)}><option>7 days</option><option>30 days</option><option>90 days</option></select>
                <label className="sr-only" htmlFor="chart-metric">Chart metric</label><select id="chart-metric" className="chart-select" value={chartMetric} onChange={(event) => setChartMetric(event.target.value)}><option>Cost (USD)</option><option>Requests</option></select>
              </div>
            </div>
            <div className="stacked-trend-canvas">
              <div className="y-axis-labels">{(chartMetric === "Cost (USD)" ? ["$40", "$30", "$20", "$10", "$0"] : ["4k", "3k", "2k", "1k", "0"]).map((label) => <span key={label}>{label}</span>)}</div>
              <div className="bars-area-flex"><div className="bars-columns-wrap">{chartBars.map((bar) => <div className="bar-stacked-col" key={bar.date} title={`${bar.date}: ${bar.segments.reduce((sum, value) => sum + value, 0)} ${chartMetric === "Cost (USD)" ? "chart units" : "requests (scaled)"}`}><div className="stacked-multi-segments">{bar.segments.map((segment, index) => <span key={index} className="seg" style={{ height: hiddenSeries.includes(index) ? 0 : `${segment * (chartMetric === "Cost (USD)" ? 3.3 : 1.6)}px`, backgroundColor: featureColors[index] || "#64748b" }} />)}</div><span className="date-x-label">{bar.date}</span></div>)}</div></div>
            </div>
            <div className="chart-legend-grid">{costByFeatureDistribution.items.map((item, index) => <button type="button" className={`legend-chip ${hiddenSeries.includes(index) ? "legend-muted" : ""}`} key={item.name} onClick={() => toggleSeries(index)} aria-pressed={!hiddenSeries.includes(index)}><span className="chip-dot" style={{ backgroundColor: item.color }} />{item.name}</button>)}</div>
          </article>
          <article className="ai-chart-card flex-1">
            <div className="chart-head-bar"><h2 className="chart-title">Cost by feature <span className="sub-tag">(30 days)</span></h2></div>
            <div className="distribution-list">{costByFeatureDistribution.items.map((item) => <div className="distribution-row" key={item.name}><div className="distribution-title"><span><i className="chip-dot" style={{ backgroundColor: item.color }} />{item.name}</span><strong>{item.cost}</strong></div><div className="distribution-track"><span style={{ width: item.pct, backgroundColor: item.color }} /></div></div>)}</div>
            <div className="distribution-total"><span>Filtered feature cost</span><strong>${filteredCost.toFixed(2)}</strong></div>
          </article>
        </section>

        <section className="sub-tabs-bar">
          <nav className="tabs-left-cluster" aria-label="Usage data views">
            {tableTabs.map((tab) => <button key={tab} className={`tab-underlined-btn ${tableSubTab === tab ? "active" : ""}`} onClick={() => { setTableSubTab(tab); setSelectedIds([]); }}>{tab}</button>)}
          </nav>
          <div className="tabs-right-cluster">
            <div className="control-menu-wrap">
              <button className="btn-pill-small" onClick={() => { setSavedViewsOpen((open) => !open); setExtraFiltersOpen(false); }} aria-expanded={savedViewsOpen}>Saved Views <FiChevronDown size={12} /></button>
              {savedViewsOpen && <div className="ai-control-menu"><button onClick={() => { setSavedView({ filters: { searchQuery, audienceFilter, statusFilter, modelFilter, teamFilter, minimumCost, minimumSuccess }, topRoleTab, tableSubTab }); setSavedViewsOpen(false); notify("Current filters saved for this session."); }}>Save current view</button><button disabled={!savedView} onClick={applySavedView}>Load saved view</button><button onClick={() => { updateFilters({ searchQuery: "", audienceFilter: "All", statusFilter: "All", modelFilter: "All", teamFilter: "All", minimumCost: "", minimumSuccess: "" }); setTopRoleTab("All"); setSavedViewsOpen(false); }}>Reset filters</button></div>}
            </div>
            {!["API Keys", "Logs"].includes(tableSubTab) && <div className="control-menu-wrap">
              <button className="btn-pill-small" onClick={() => { setExtraFiltersOpen((open) => !open); setSavedViewsOpen(false); }} aria-expanded={extraFiltersOpen}><FiFilter size={12} /> More filters</button>
              {extraFiltersOpen && <div className="ai-control-menu extra-filter-menu"><label>Minimum feature cost ($)<input type="number" min="0" value={minimumCost} onChange={(event) => setMinimumCost(event.target.value)} /></label><label>Minimum success rate (%)<input type="number" min="0" max="100" value={minimumSuccess} onChange={(event) => setMinimumSuccess(event.target.value)} /></label><button onClick={() => { setMinimumCost(""); setMinimumSuccess(""); }}>Clear advanced filters</button></div>}
            </div>}
          </div>
        </section>

        <section className="ai-table-card">
          <div className="table-filters-row">
            <label className="search-bar-wrap"><FiSearch className="search-icon" /><input type="search" placeholder={`Search ${tableSubTab.toLowerCase()}...`} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} aria-label={`Search ${tableSubTab}`} /></label>
            <div className="dropdowns-wrap">
              {tableSubTab !== "Logs" && <>
                {tableSubTab !== "API Keys" && <>
                  <label className="sr-only" htmlFor="audience-filter">Filter by audience</label><select id="audience-filter" className="custom-table-select" value={audienceFilter} onChange={(event) => setAudienceFilter(event.target.value)}><option value="All">All audiences</option><option value="Job Seeker">Job Seeker</option><option value="Employer">Employer</option><option value="System">System</option><option value="Both">Shared</option></select>
                </>}
                <label className="sr-only" htmlFor="status-filter">Filter by status</label><select id="status-filter" className="custom-table-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All">All statuses</option><option value="Active">Active</option><option value="Beta">Beta</option><option value="Inactive">Inactive</option></select>
                {tableSubTab !== "API Keys" && <>
                  <label className="sr-only" htmlFor="model-filter">Filter by model</label><select id="model-filter" className="custom-table-select" value={modelFilter} onChange={(event) => setModelFilter(event.target.value)}><option value="All">All models</option>{[...new Set(features.flatMap((feature) => [feature.primaryModel, feature.fallbackModel]))].map((model) => <option key={model}>{model}</option>)}</select>
                  <label className="sr-only" htmlFor="team-filter">Filter by team</label><select id="team-filter" className="custom-table-select" value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}><option value="All">All teams</option><option>Job Seekers</option><option>Employers</option><option>Platform</option></select>
                </>}
              </>}
              {tableSubTab === "API Keys" && <button className="btn-primary-small" onClick={() => { const key = makeDemoKey(); const entry = { id: `key-${Date.now()}`, name: `Demo key ${apiKeys.length + 1}`, value: `${key.slice(0, 14)}••••••••`, status: "Active", created: new Date().toLocaleDateString() }; setApiKeys((current) => [entry, ...current]); addLog("Created API key", entry.name); notify("Demo API key created. Secret values are not stored or displayed."); }}>Generate API key</button>}
              {tableSubTab === "Logs" && <button className="btn-pill-small" onClick={() => exportRows(searchFilteredRows)}>Export logs</button>}
            </div>
          </div>
          {tableSubTab === "Features" && selectedIds.length > 0 && <div className="bulk-selection-bar"><strong>{selectedIds.length} selected</strong><button onClick={() => { selectedFeatures.forEach((feature) => { if (feature.status !== "Inactive") toggleFeature(feature); }); setSelectedIds([]); }}>Disable selected</button><button onClick={() => { selectedFeatures.forEach((feature) => { if (feature.status === "Inactive") toggleFeature(feature); }); setSelectedIds([]); }}>Enable selected</button><button onClick={() => exportRows(selectedFeatures)}>Export selected</button><button className="text-action" onClick={() => setSelectedIds([])}>Clear selection</button></div>}
          <div className="table-responsive-wrapper">
            <table className="ai-features-table">
              <thead><tr>{tableSubTab === "Features" && <th><input type="checkbox" checked={isAllVisibleSelected} onChange={handleSelectAll} aria-label="Select all visible features" /></th>}{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
              <tbody>
                {searchFilteredRows.length === 0 ? <tr><td className="empty-table-state" colSpan={columns.length + (tableSubTab === "Features" ? 1 : 0)}>No {tableSubTab.toLowerCase()} match these filters. Adjust or clear the filters to see results.</td></tr>
                  : tableSubTab === "Features" ? searchFilteredRows.map(renderFeatureRow) : searchFilteredRows.map(renderOtherRow)}
              </tbody>
            </table>
          </div>
          <footer className="ai-table-footer">Showing {searchFilteredRows.length} of {allRows.length} {tableSubTab.toLowerCase()}{(searchQuery || searchTerm || audienceFilter !== "All" || statusFilter !== "All" || modelFilter !== "All" || teamFilter !== "All" || minimumCost || minimumSuccess) ? " · filters applied" : ""}</footer>
        </section>
      </main>

      {activeFeature && <AIFeatureDetailsDrawer feature={activeFeature} onClose={() => setInspectingFeatureId(null)} onTestRun={handleTestRun} onToggleFeature={toggleFeature} onEditLimits={editFeatureLimits} onEditRouting={openRoutingEditor} onAction={notify} onOpenLogs={() => { setTableSubTab("Logs"); setInspectingFeatureId(null); }} />}

      {notice && <div className="ai-toast" role="status">{notice}</div>}

      {modal && <div className="ai-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <section className="ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
          <div className="ai-modal-heading"><div><h2 id="ai-modal-title">{modal.title}</h2><p>Changes are applied to this dashboard demo.</p></div><button aria-label="Close dialog" onClick={() => setModal(null)}><FiX /></button></div>
          {modal.type === "global-limits" && <div className="ai-modal-fields"><label>Monthly AI spend budget (USD)<input type="number" min="0" value={globalLimits.budget} onChange={(event) => setGlobalLimits((current) => ({ ...current, budget: event.target.value }))} /></label><label>Usage warning threshold (%)<input type="number" min="1" max="100" value={globalLimits.warningPercent} onChange={(event) => setGlobalLimits((current) => ({ ...current, warningPercent: event.target.value }))} /></label><p>Current spend: ${spend.toFixed(2)} · alert at ${((budget * Number(globalLimits.warningPercent || 0)) / 100).toFixed(2)}</p></div>}
          {modal.type === "feature-limits" && <div className="ai-modal-fields"><p>Monthly run and per-run token caps for each plan.</p>{limitDraft.map((limit, index) => <div className="limit-edit-row" key={limit.plan}><strong>{limit.plan}</strong><label>Runs<input type="number" min="0" value={limit.runs} onChange={(event) => setLimitDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, runs: event.target.value } : item))} /></label><label>Tokens / run<input value={limit.tokens} onChange={(event) => setLimitDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, tokens: event.target.value } : item))} /></label></div>)}</div>}
          {modal.type === "routing" && <div className="ai-modal-fields"><label>Primary model<select value={routingDraft.primaryModel} onChange={(event) => setRoutingDraft((current) => ({ ...current, primaryModel: event.target.value }))}>{[...new Set(features.flatMap((feature) => [feature.primaryModel, feature.fallbackModel]))].map((model) => <option key={model}>{model}</option>)}</select></label><label>Fallback model<select value={routingDraft.fallbackModel} onChange={(event) => setRoutingDraft((current) => ({ ...current, fallbackModel: event.target.value }))}>{[...new Set(features.flatMap((feature) => [feature.primaryModel, feature.fallbackModel]))].map((model) => <option key={model}>{model}</option>)}</select></label></div>}
          <div className="ai-modal-actions"><button className="btn-pill-small" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary-small" disabled={modal.type === "global-limits" && !globalLimitsValid} onClick={() => {
            if (modal.type === "global-limits") { addLog("Updated global limits", `$${globalLimits.budget} monthly budget`); setModal(null); notify("Global limits saved."); }
            if (modal.type === "feature-limits") saveFeatureLimits();
            if (modal.type === "routing") saveRouting();
          }}>Save changes</button></div>
        </section>
      </div>}
    </div>
  );
}
