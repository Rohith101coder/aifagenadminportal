import { useMemo, useState, useEffect, useRef } from "react";
import {
  FiInfo,
  FiChevronDown,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiActivity,
  FiCalendar,
} from "react-icons/fi";
import { revenueBars, revenueTrendDatasets } from "../../data/dashboardData";
import "./RevenueChart.css";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatCurrency = (val) => currencyFormatter.format(val || 0);

const formatCompactCurrency = (val) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
  return `₹${val}`;
};

const formatCompactNumber = (val) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
  return (val || 0).toLocaleString();
};

const formatMetricValue = (val, metric) => {
  if (metric === "Revenue") return formatCurrency(val);
  if (metric === "Sign-ups") return `${(val || 0).toLocaleString()} sign-ups`;
  return `${(val || 0).toLocaleString()} subscribers`;
};

const PERIOD_OPTIONS = [
  { key: "7D", label: "7D", fullRange: "Last 7 days" },
  { key: "30D", label: "30D", fullRange: "Last 30 days" },
  { key: "90D", label: "90D", fullRange: "Last 90 days" },
  { key: "1Y", label: "1Y", fullRange: "This year" },
];

const PERIOD_FROM_RANGE = {
  "Last 7 days": "7D",
  "Last 30 days": "30D",
  "Last 90 days": "90D",
  "This year": "1Y",
};

export default function RevenueChart({ dateRange }) {
  const [activeTab, setActiveTab] = useState("Revenue"); // 'Revenue' | 'Sign-ups' | 'Paying Users'
  const [viewMode, setViewMode] = useState("bar"); // 'bar' | 'area'
  const [userPeriodKey, setUserPeriodKey] = useState(null);
  const [userGranularity, setUserGranularity] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const canvasRef = useRef(null);

  // Purely derived periodKey and granularity from props and user selection
  const periodKey = userPeriodKey || (dateRange && PERIOD_FROM_RANGE[dateRange]) || "30D";

  const defaultGranularity = useMemo(() => {
    if (periodKey === "7D") return "Daily";
    if (periodKey === "30D") return "Daily";
    if (periodKey === "90D") return "Weekly";
    return "Monthly";
  }, [periodKey]);

  const granularity = userGranularity || defaultGranularity;

  // Handle local period selection
  const handlePeriodChange = (key) => {
    setUserPeriodKey(key);
    setUserGranularity(null);
    setHoveredIndex(null);
    setSelectedIndex(null);
  };

  // Dynamic granularity choices per period
  const granularityOptions = useMemo(() => {
    if (periodKey === "7D") return ["Daily"];
    if (periodKey === "30D") return ["Daily", "Weekly"];
    if (periodKey === "90D") return ["Weekly", "Monthly"];
    return ["Monthly", "Quarterly"];
  }, [periodKey]);

  // Raw dataset based on selected period
  const rawDataset = useMemo(() => {
    const fullRangeName = PERIOD_OPTIONS.find((p) => p.key === periodKey)?.fullRange || "Last 30 days";
    const data = revenueTrendDatasets[fullRangeName] || revenueBars;
    return data.map((item, idx) => ({
      ...item,
      gross: item.gross || Math.round((item.revenue || 0) * 1.06),
      signups: item.signups || Math.round((item.value || 30) * 1.4),
      payingUsers: item.payingUsers || Math.round((item.value || 30) * 0.5),
      id: `${item.date}-${idx}`,
    }));
  }, [periodKey]);

  // Aggregated data according to chosen granularity
  const chartData = useMemo(() => {
    if (periodKey === "30D" && granularity === "Weekly") {
      // Aggregate 30 days into 4 weekly chunks
      const chunkSize = 7;
      const chunks = [];
      for (let i = 0; i < rawDataset.length; i += chunkSize) {
        const slice = rawDataset.slice(i, i + chunkSize);
        const weekNum = Math.floor(i / chunkSize) + 1;
        const totalRev = slice.reduce((acc, s) => acc + (s.revenue || 0), 0);
        const totalSignups = slice.reduce((acc, s) => acc + (s.signups || 0), 0);
        const totalPaying = slice.reduce((acc, s) => acc + (s.payingUsers || 0), 0);
        const totalGross = slice.reduce((acc, s) => acc + (s.gross || 0), 0);
        const startLabel = slice[0].date;
        const endLabel = slice[slice.length - 1].date;

        chunks.push({
          date: `W${weekNum}`,
          fullDate: `Week ${weekNum} (${startLabel} – ${endLabel}, 2026)`,
          revenue: totalRev,
          signups: totalSignups,
          payingUsers: totalPaying,
          gross: totalGross,
          growth: slice[slice.length - 1].growth || "+8.2%",
          active: slice.some((s) => s.active),
        });
      }
      return chunks;
    }

    if (periodKey === "90D" && granularity === "Monthly") {
      // 13 weekly points grouped into 3 months (Jul, Aug, Sep, Oct)
      const months = [
        { name: "Jul", label: "July 2026", items: rawDataset.slice(0, 2) },
        { name: "Aug", label: "August 2026", items: rawDataset.slice(2, 6) },
        { name: "Sep", label: "September 2026", items: rawDataset.slice(6, 10) },
        { name: "Oct", label: "October 2026", items: rawDataset.slice(10) },
      ];
      return months.map((m) => {
        const totalRev = m.items.reduce((acc, s) => acc + (s.revenue || 0), 0);
        const totalSignups = m.items.reduce((acc, s) => acc + (s.signups || 0), 0);
        const totalPaying = m.items.reduce((acc, s) => acc + (s.payingUsers || 0), 0);
        const totalGross = m.items.reduce((acc, s) => acc + (s.gross || 0), 0);
        return {
          date: m.name,
          fullDate: m.label,
          revenue: totalRev,
          signups: totalSignups,
          payingUsers: totalPaying,
          gross: totalGross,
          growth: m.items[m.items.length - 1]?.growth || "+9.1%",
          active: m.name === "Oct",
        };
      });
    }

    if (periodKey === "1Y" && granularity === "Quarterly") {
      // 12 months grouped into Q1, Q2, Q3, Q4
      const quarters = [
        { name: "Q1", label: "Q1 2026 (Jan – Mar)", items: rawDataset.slice(0, 3) },
        { name: "Q2", label: "Q2 2026 (Apr – Jun)", items: rawDataset.slice(3, 6) },
        { name: "Q3", label: "Q3 2026 (Jul – Sep)", items: rawDataset.slice(6, 9) },
        { name: "Q4", label: "Q4 2026 (Oct – Dec Proj)", items: rawDataset.slice(9) },
      ];
      return quarters.map((q) => {
        const totalRev = q.items.reduce((acc, s) => acc + (s.revenue || 0), 0);
        const totalSignups = q.items.reduce((acc, s) => acc + (s.signups || 0), 0);
        const totalPaying = q.items.reduce((acc, s) => acc + (s.payingUsers || 0), 0);
        const totalGross = q.items.reduce((acc, s) => acc + (s.gross || 0), 0);
        return {
          date: q.name,
          fullDate: q.label,
          revenue: totalRev,
          signups: totalSignups,
          payingUsers: totalPaying,
          gross: totalGross,
          growth: q.items[q.items.length - 1]?.growth || "+8.5%",
          active: q.name === "Q4",
        };
      });
    }

    return rawDataset;
  }, [periodKey, granularity, rawDataset]);

  // Current metric value key
  const metricKey = useMemo(() => {
    if (activeTab === "Revenue") return "revenue";
    if (activeTab === "Sign-ups") return "signups";
    return "payingUsers";
  }, [activeTab]);

  // Dynamic maximum scale calculation
  const maxValue = useMemo(() => {
    const rawMax = Math.max(...chartData.map((d) => d[metricKey] || 0), 10);
    if (rawMax <= 100) return Math.ceil(rawMax / 10) * 10;
    if (rawMax <= 500) return Math.ceil(rawMax / 50) * 50;
    if (rawMax <= 2000) return Math.ceil(rawMax / 200) * 200;
    if (rawMax <= 10000) return Math.ceil(rawMax / 1000) * 1000;
    if (rawMax <= 50000) return Math.ceil(rawMax / 5000) * 5000;
    if (rawMax <= 100000) return Math.ceil(rawMax / 10000) * 10000;
    if (rawMax <= 1000000) return Math.ceil(rawMax / 100000) * 100000;
    return Math.ceil(rawMax / 500000) * 500000;
  }, [chartData, metricKey]);

  // Y-axis grid step labels
  const axisLabels = useMemo(() => {
    return [
      maxValue,
      Math.round(maxValue * 0.75),
      Math.round(maxValue * 0.5),
      Math.round(maxValue * 0.25),
      0,
    ];
  }, [maxValue]);

  // Active / hovered item
  const activeIndex = useMemo(() => {
    if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < chartData.length) {
      return hoveredIndex;
    }
    if (selectedIndex !== null && selectedIndex >= 0 && selectedIndex < chartData.length) {
      return selectedIndex;
    }
    const defaultIdx = chartData.findIndex((d) => d.active);
    return defaultIdx >= 0 ? defaultIdx : chartData.length - 1;
  }, [hoveredIndex, selectedIndex, chartData]);

  const activeItem = chartData[activeIndex] || chartData[chartData.length - 1] || {};

  // Summary statistics for the selected timeframe
  const summaryStats = useMemo(() => {
    const total = chartData.reduce((sum, d) => sum + (d[metricKey] || 0), 0);
    const avg = chartData.length > 0 ? Math.round(total / chartData.length) : 0;
    const peak = Math.max(...chartData.map((d) => d[metricKey] || 0), 0);
    const peakItem = chartData.find((d) => d[metricKey] === peak);

    return { total, avg, peak, peakDate: peakItem?.date || "" };
  }, [chartData, metricKey]);

  // X-axis label distribution (evenly spaced labels without clutter)
  const xAxisBars = useMemo(() => {
    const len = chartData.length;
    if (len <= 8) return chartData.map((item, idx) => ({ ...item, originalIdx: idx }));
    if (len <= 14) {
      // Pick every 2nd or all if 12 months
      if (periodKey === "1Y") return chartData.map((item, idx) => ({ ...item, originalIdx: idx }));
      return chartData
        .map((item, idx) => ({ ...item, originalIdx: idx }))
        .filter((_, idx) => idx % 2 === 0 || idx === len - 1);
    }
    // 30 days: show 6 evenly spaced markers
    const step = Math.floor((len - 1) / 5);
    const indices = [0, step, step * 2, step * 3, step * 4, len - 1];
    return indices
      .filter((v, i, a) => a.indexOf(v) === i)
      .map((idx) => ({ ...chartData[idx], originalIdx: idx }));
  }, [chartData, periodKey]);

  // Compute SVG Area and Line points
  const svgCoords = useMemo(() => {
    const width = 1000;
    const height = 220;
    const paddingTop = 20;
    const paddingBottom = 20;
    const chartH = height - paddingTop - paddingBottom;
    const count = chartData.length;

    if (count < 2) return { linePath: "", areaPath: "", points: [] };

    const points = chartData.map((item, idx) => {
      const x = (idx / (count - 1)) * (width - 60) + 30;
      const val = item[metricKey] || 0;
      const y = paddingTop + chartH - (val / maxValue) * chartH;
      return { x, y, item, idx };
    });

    // Spline Bézier generation
    let linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;

    return { linePath, areaPath, points };
  }, [chartData, metricKey, maxValue]);

  // Tooltip positioning percentage
  const tooltipLeftPct = useMemo(() => {
    if (chartData.length <= 1) return 50;
    return (activeIndex / (chartData.length - 1)) * 100;
  }, [activeIndex, chartData.length]);

  const isGrowthPositive = activeItem.growth && !activeItem.growth.startsWith("-");

  // Dynamic bar width calculation: 7 bars get 44px, 12 get 32px, 30 get 16px
  const barMaxWidth = useMemo(() => {
    const len = chartData.length;
    if (len <= 7) return 52;
    if (len <= 14) return 36;
    return 20;
  }, [chartData.length]);

  return (
    <div className="card-container revenue-card">
      {/* Top Header & Interactive Controls */}
      <div className="chart-header">
        <div className="chart-title-area">
          <div className="title-with-info">
            <h3>{activeTab === "Revenue" ? "Revenue trend" : activeTab === "Sign-ups" ? "Sign-up trend" : "Paying users trend"}</h3>
            <FiInfo className="info-icon" aria-hidden="true" />
          </div>
          <span className="chart-sub">
            {activeTab === "Revenue"
              ? "Subscription revenue and transaction volume across the selected period"
              : activeTab === "Sign-ups"
              ? "User onboarding and conversion trajectory across the selected period"
              : "Active recurring paid subscriber retention across the selected period"}
          </span>
        </div>

        {/* Action Controls Toolbar */}
        <div className="chart-controls">
          {/* Metric Selector Tabs */}
          <div className="segmented-toggle" role="tablist" aria-label="Metric Selection">
            {["Revenue", "Sign-ups", "Paying Users"].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                className={`segment-btn ${activeTab === tab ? "active" : ""}`}
                aria-selected={activeTab === tab}
                onClick={() => {
                  setActiveTab(tab);
                  setHoveredIndex(null);
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Quick Period Buttons */}
          <div className="period-toggle-group" role="group" aria-label="Timeframe">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`period-btn ${periodKey === opt.key ? "active" : ""}`}
                onClick={() => handlePeriodChange(opt.key)}
                title={opt.fullRange}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Granularity Dropdown */}
          <label className="chart-granularity" title="Change aggregation interval">
            <select
              className="dropdown-select"
              value={granularity}
              onChange={(e) => {
                setUserGranularity(e.target.value);
                setHoveredIndex(null);
              }}
              aria-label="Granularity"
            >
              {granularityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <FiChevronDown size={14} aria-hidden="true" />
          </label>

          {/* Chart View Switcher (Bars vs Spline Curve) */}
          <div className="chart-view-switcher" role="group" aria-label="Chart View Mode">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "bar" ? "active" : ""}`}
              onClick={() => setViewMode("bar")}
              title="Bar Chart View"
              aria-label="Bar Chart"
            >
              <FiBarChart2 size={15} />
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "area" ? "active" : ""}`}
              onClick={() => setViewMode("area")}
              title="Area Curve Trendline"
              aria-label="Area Curve"
            >
              <FiActivity size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Summary KPIs Bar */}
      <div className="chart-summary-strip">
        <div className="summary-focus">
          <div className="focus-val-wrap">
            <strong className="focus-metric-value">
              {formatMetricValue(activeItem[metricKey], activeTab)}
            </strong>
            {activeItem.growth && (
              <span className={`focus-growth-badge ${isGrowthPositive ? "positive" : "negative"}`}>
                {isGrowthPositive ? <FiTrendingUp size={13} /> : <FiTrendingDown size={13} />}
                {activeItem.growth}
              </span>
            )}
            {activeItem.isProjected && (
              <span className="badge-projected">Projected</span>
            )}
          </div>
          <span className="focus-date-label">
            {activeItem.fullDate || `${activeItem.date}, 2026`}
          </span>
        </div>

        {/* Dynamic Period Highlights */}
        <div className="summary-kpis">
          <div className="kpi-block">
            <span className="kpi-label">Period Total</span>
            <span className="kpi-val">{formatMetricValue(summaryStats.total, activeTab)}</span>
          </div>
          <div className="kpi-block">
            <span className="kpi-label">Avg / {granularity === "Daily" ? "Day" : granularity === "Weekly" ? "Week" : "Month"}</span>
            <span className="kpi-val">{formatMetricValue(summaryStats.avg, activeTab)}</span>
          </div>
          <div className="kpi-block hide-sm">
            <span className="kpi-label">Period Peak</span>
            <span className="kpi-val">
              {formatMetricValue(summaryStats.peak, activeTab)}
              {summaryStats.peakDate && <small className="peak-sub"> ({summaryStats.peakDate})</small>}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="chart-body" ref={canvasRef}>
        {/* Y-Axis scale ticks */}
        <div className="y-axis" aria-hidden="true">
          {axisLabels.map((val, idx) => (
            <span key={`${idx}-${val}`}>
              {activeTab === "Revenue" ? formatCompactCurrency(val) : formatCompactNumber(val)}
            </span>
          ))}
        </div>

        {/* Canvas for Bars / SVG Curve */}
        <div
          className="bars-canvas"
          role="region"
          aria-label={`${activeTab} graph`}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Horizontal Grid lines */}
          <div className="chart-grid-lines" aria-hidden="true">
            {axisLabels.map((_, i) => (
              <span key={i} />
            ))}
          </div>

          {/* Floating Rich Tooltip - ONLY displayed on hover */}
          {hoveredIndex !== null && activeItem && (
            <div
              className="chart-floating-tooltip visible"
              style={{
                left: `${Math.min(92, Math.max(8, tooltipLeftPct))}%`,
                transform:
                  tooltipLeftPct < 22
                    ? "translateX(0%)"
                    : tooltipLeftPct > 78
                    ? "translateX(-100%)"
                    : "translateX(-50%)",
              }}
              role="tooltip"
            >
              <div className="tooltip-header">
                <span className="tooltip-date">
                  <FiCalendar size={11} style={{ marginRight: 4 }} />
                  {activeItem.fullDate || `${activeItem.date}, 2026`}
                </span>
                {activeItem.growth && (
                  <span className={`tooltip-growth ${isGrowthPositive ? "positive" : "negative"}`}>
                    {isGrowthPositive ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />}
                    {activeItem.growth}
                  </span>
                )}
              </div>

              <div className="tooltip-main-row">
                <span className="tooltip-primary-label">{activeTab}</span>
                <span className="tooltip-primary-val">
                  {formatMetricValue(activeItem[metricKey], activeTab)}
                </span>
              </div>

              <div className="tooltip-data-grid">
                <div className="tooltip-data-cell">
                  <span className="cell-lbl">Gross Volume</span>
                  <span className="cell-val">{formatCurrency(activeItem.gross)}</span>
                </div>
                <div className="tooltip-data-cell">
                  <span className="cell-lbl">Sign-ups</span>
                  <span className="cell-val">{(activeItem.signups || 0).toLocaleString()}</span>
                </div>
                <div className="tooltip-data-cell">
                  <span className="cell-lbl">Paying Users</span>
                  <span className="cell-val">{(activeItem.payingUsers || 0).toLocaleString()}</span>
                </div>
                <div className="tooltip-data-cell">
                  <span className="cell-lbl">Conversion</span>
                  <span className="cell-val">
                    {activeItem.signups
                      ? `${(((activeItem.payingUsers || 0) / activeItem.signups) * 100).toFixed(1)}%`
                      : "0.0%"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: BAR CHART */}
          {viewMode === "bar" && (
            <div className="bars-flow" style={{ "--bar-count": chartData.length }}>
              {chartData.map((bar, index) => {
                const isHovered = index === hoveredIndex;
                const isSelected = selectedIndex !== null && index === selectedIndex;
                const heightPct = Math.max(4, Math.min(100, ((bar[metricKey] || 0) / maxValue) * 100));

                return (
                  <button
                    key={`${bar.date}-${index}`}
                    type="button"
                    className={`bar-column ${isHovered ? "hovered selected" : isSelected ? "selected" : ""} ${bar.isProjected ? "projected" : ""}`}
                    style={{
                      "--bar-height": `${heightPct}%`,
                      maxWidth: `${barMaxWidth}px`,
                    }}
                    aria-label={`${bar.date}: ${formatMetricValue(bar[metricKey], activeTab)}`}
                    aria-pressed={isHovered}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onFocus={() => setHoveredIndex(index)}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <span className="bar-fill" />
                    {isHovered && <span className="bar-pulse-top" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: AREA SPLINE CURVE */}
          {viewMode === "area" && svgCoords.points.length > 1 && (
            <div className="svg-area-container">
              <svg
                viewBox="0 0 1000 220"
                preserveAspectRatio="none"
                className="revenue-spline-svg"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="#2563eb" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.00" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.5" />
                  </filter>
                </defs>

                {/* Area Gradient Fill */}
                <path d={svgCoords.areaPath} fill="url(#areaGradient)" />

                {/* Main Stroke Path */}
                <path
                  d={svgCoords.linePath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />

                {/* Active Hover Guide Line - only when hovered */}
                {hoveredIndex !== null && svgCoords.points[hoveredIndex] && (
                  <g className="active-point-guide">
                    <line
                      x1={svgCoords.points[hoveredIndex].x}
                      x2={svgCoords.points[hoveredIndex].x}
                      y1="0"
                      y2="220"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.8"
                    />
                    <circle
                      cx={svgCoords.points[hoveredIndex].x}
                      cy={svgCoords.points[hoveredIndex].y}
                      r="7.5"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="3"
                    />
                    <circle
                      cx={svgCoords.points[hoveredIndex].x}
                      cy={svgCoords.points[hoveredIndex].y}
                      r="12"
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="1.5"
                      opacity="0.6"
                      className="pulsing-ring"
                    />
                  </g>
                )}

                {/* Interactive Hit Area Circles */}
                {svgCoords.points.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="14"
                    fill="transparent"
                    className="hit-point"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onClick={() => setSelectedIndex(idx)}
                  />
                ))}
              </svg>
            </div>
          )}

          {/* X-Axis bottom date labels */}
          <div className="x-axis" aria-hidden="true">
            {xAxisBars.map((bar) => (
              <span
                key={`${bar.date}-${bar.originalIdx}`}
                className={bar.originalIdx === activeIndex ? "active-tick" : ""}
              >
                {bar.date}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
