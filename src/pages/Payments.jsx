import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiDownload,
  FiPlus,
  FiX,
  FiMoreHorizontal,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiTrendingUp,
  FiTrendingDown,
  FiCheckCircle,
  FiAlertTriangle,
  FiRotateCcw,
  FiBarChart2,
  FiCalendar,
  FiCopy,
} from "react-icons/fi";
import { BiRupee } from "react-icons/bi";
import { paymentMetrics, initialPaymentsList } from "../data/paymentsData";
import { initialPlansList } from "../data/plansData";
import { matchesGlobalSearch } from "../data/globalSearch";
import { logAuditAction } from "../data/auditLogData";
import PaymentDetailsDrawer from "../components/PaymentDetailsDrawer/PaymentDetailsDrawer";
import ManagePlansView from "../components/ManagePlansView/ManagePlansView";
import "./Payments.css";

export default function Payments({ globalSearchTerm = "" }) {
  const location = useLocation();
  const [payments, setPayments] = useState(initialPaymentsList);
  const [plans, setPlans] = useState(initialPlansList);
  const [activeView, setActiveView] = useState(() => location.pathname === "/plans" || location.pathname === "/plans-subscriptions" ? "plans" : "transactions");
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);
  // On demand inspection: opens ONLY when a payment is clicked
  const [activePaymentDetail, setActivePaymentDetail] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [revenueGranularity, setRevenueGranularity] = useState("Daily");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [minimumAmount, setMinimumAmount] = useState("");
  const [maximumAmount, setMaximumAmount] = useState("");
  const [sort, setSort] = useState({ field: "", direction: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [showSavedViews, setShowSavedViews] = useState(false);
  const [savedViews, setSavedViews] = useState([]);
  const [viewName, setViewName] = useState("");
  const [dialog, setDialog] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(null);
  const [rowMenuId, setRowMenuId] = useState(null);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);
  const filteredPayments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return payments.filter((payment) => {
      const date = new Date(payment.paymentDate).getTime();
      return (
        (!query ||
          [payment.userName, payment.userEmail, payment.id, payment.invoiceNo]
            .some((value) => value.toLowerCase().includes(query))) &&
        matchesGlobalSearch(payment, globalSearchTerm) &&
        (planFilter === "All" || payment.plan === planFilter) &&
        (statusFilter === "All" || payment.status === statusFilter) &&
        (methodFilter === "All" || payment.methodType === methodFilter) &&
        (typeFilter === "All" || payment.paymentType === typeFilter) &&
        (!dateFrom || date >= new Date(`${dateFrom}T00:00:00`).getTime()) &&
        (!dateTo || date <= new Date(`${dateTo}T23:59:59`).getTime()) &&
        (minimumAmount === "" || payment.numericAmount >= Number(minimumAmount)) &&
        (maximumAmount === "" || payment.numericAmount <= Number(maximumAmount))
      );
    });
  }, [
    payments,
    searchTerm,
    globalSearchTerm,
    planFilter,
    statusFilter,
    methodFilter,
    typeFilter,
    dateFrom,
    dateTo,
    minimumAmount,
    maximumAmount,
  ]);
  const sortedPayments = useMemo(() => {
    if (!sort.field) return filteredPayments;
    const direction = sort.direction === "asc" ? 1 : -1;
    return [...filteredPayments].sort((left, right) => {
      let comparison;
      if (sort.field === "numericAmount") {
        comparison = left.numericAmount - right.numericAmount;
      } else if (sort.field === "paymentDate") {
        comparison = new Date(left.paymentDate).getTime() - new Date(right.paymentDate).getTime();
      } else {
        comparison = String(left[sort.field] ?? "").localeCompare(String(right[sort.field] ?? ""));
      }
      return comparison * direction;
    });
  }, [filteredPayments, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedPayments.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagePayments = sortedPayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const pageSelectionCount = pagePayments.filter((payment) =>
    selectedPaymentIds.includes(payment.id),
  ).length;
  const allPageSelected =
    pagePayments.length > 0 && pageSelectionCount === pagePayments.length;
  const selectedPayments = payments.filter((payment) =>
    selectedPaymentIds.includes(payment.id),
  );
  const successfulPayments = useMemo(
    () => payments.filter((payment) => payment.status === "Successful"),
    [payments],
  );
  const grossAmount = successfulPayments.reduce(
    (total, payment) => total + payment.numericAmount,
    0,
  );
  const refundedPayments = payments.filter(
    (payment) => payment.status === "Refunded",
  );
  const statusSummary = ["Successful", "Failed", "Refunded", "Processing"].map(
    (name) => {
      const count = payments.filter((payment) => payment.status === name).length;
      return {
        name,
        count,
        pct: `${payments.length ? ((count / payments.length) * 100).toFixed(1) : "0.0"}%`,
        color:
          name === "Successful"
            ? "#10b981"
            : name === "Failed"
              ? "#ef4444"
              : name === "Refunded"
                ? "#f59e0b"
                : "#64748b",
      };
    },
  );
  const dynamicMetrics = paymentMetrics.map((metric) => ({
    ...metric,
    value:
      metric.iconType === "gross"
        ? `₹${grossAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
        : metric.iconType === "success"
          ? String(successfulPayments.length)
          : metric.iconType === "failed"
            ? String(payments.filter((payment) => payment.status === "Failed").length)
            : metric.iconType === "refund"
              ? `${refundedPayments.length} · ₹${refundedPayments.reduce((sum, payment) => sum + payment.numericAmount, 0).toLocaleString("en-IN")}`
              : `₹${successfulPayments.reduce((sum, payment) => sum + Number.parseFloat(payment.netAmount.replace(/[₹,]/g, "") || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  }));
  const chartData = useMemo(() => {
    const groups = new Map();
    for (const payment of successfulPayments) {
      const date = new Date(payment.paymentDate);
      const key =
        revenueGranularity === "Daily"
          ? payment.paymentDate
          : revenueGranularity === "Weekly"
            ? `Week of ${new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
            : date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      groups.set(key, (groups.get(key) ?? 0) + payment.numericAmount);
    }
    return [...groups.entries()].map(([date, value]) => ({ date, value }));
  }, [successfulPayments, revenueGranularity]);
  const chartMax = Math.max(1, ...chartData.map((bar) => bar.value));
  const hasDateFilter = Boolean(dateFrom || dateTo);
  const formatDateInput = (value) =>
    value
      ? new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Any";

  const notify = (message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3500);
  };

  const updateSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleSort = (field) => {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const handleSelectAll = () => {
    setSelectedPaymentIds((current) =>
      allPageSelected
        ? current.filter((id) => !pagePayments.some((payment) => payment.id === id))
        : [...new Set([...current, ...pagePayments.map((payment) => payment.id)])],
    );
  };

  const handleSelectOne = (id) => {
    setSelectedPaymentIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  // Row / Button click inspection trigger
  const handleInspectPayment = (p) => {
    setActivePaymentDetail(p);
    setRowMenuId(null);
  };

  const handleRetryPayment = (payId) => {
    const payment = payments.find((item) => item.id === payId);
    if (!payment || payment.status !== "Failed") return;
    const updated = {
      ...payment,
      status: "Processing",
      actionText: "View",
      timeline: [
        ...(payment.timeline ?? []),
        {
          id: Date.now(),
          title: "Retry requested",
          time: new Date().toLocaleString(),
        },
      ],
    };
    setPayments((current) =>
      current.map((item) => (item.id === payId ? updated : item)),
    );
    if (activePaymentDetail?.id === payId) setActivePaymentDetail(updated);
    notify(`Retry queued for ${payId}.`);
  };

  const handleCreatePaymentLink = () => {
    setFormValues({ amount: "", description: "", email: "" });
    setDialog({ type: "create-link" });
  };

  const downloadFile = (filename, content, mimeType) => {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleExport = (rows = filteredPayments) => {
    const columns = [
      ["Payment ID", "id"],
      ["Customer", "userName"],
      ["Email", "userEmail"],
      ["Plan", "plan"],
      ["Amount", "amount"],
      ["Status", "status"],
      ["Payment method", "paymentMethod"],
      ["Date", "paymentDate"],
      ["Invoice", "invoiceNo"],
    ];
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [
      columns.map(([title]) => escapeCsv(title)).join(","),
      ...rows.map((payment) =>
        columns.map(([, key]) => escapeCsv(payment[key])).join(","),
      ),
    ].join("\r\n");
    downloadFile("payments.csv", csv, "text/csv;charset=utf-8");
    notify(`Exported ${rows.length} payment(s) to CSV.`);
  };

  const handleIssueRefund = (p) => {
    if (p.status !== "Successful") return;
    setFormValues({ amount: String(p.numericAmount), reason: "" });
    setDialog({ type: "refund", paymentId: p.id });
  };

  const handleSendReceipt = (p) => {
    window.location.href = `mailto:${p.userEmail}?subject=${encodeURIComponent(`Receipt for ${p.id}`)}&body=${encodeURIComponent(`Your payment receipt ${p.invoiceNo} for ${p.amount} is attached to this message.`)}`;
    notify(`Receipt email draft opened for ${p.userEmail}.`);
  };

  const handleBulkReceipts = () => {
    if (!selectedPayments.length) return;
    const recipients = selectedPayments.map((payment) => payment.userEmail).join(",");
    const body = selectedPayments
      .map((payment) => `${payment.userName}: ${payment.invoiceNo} (${payment.amount})`)
      .join("\n");
    window.location.href = `mailto:${recipients}?subject=${encodeURIComponent("Your payment receipts")}&body=${encodeURIComponent(body)}`;
    notify(`Opened an email draft for ${selectedPayments.length} receipt(s).`);
  };

  const handleClearAllFilters = () => {
    setSearchTerm("");
    setPlanFilter("All");
    setStatusFilter("All");
    setMethodFilter("All");
    setTypeFilter("All");
    setDateFrom("");
    setDateTo("");
    setMinimumAmount("");
    setMaximumAmount("");
    setPage(1);
  };

  const submitDialog = async (event) => {
    event.preventDefault();
    if (dialog.type === "create-link") {
      const amount = Number(formValues.amount);
      if (!Number.isFinite(amount) || amount <= 0) return;
      const identifier = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const link = `https://aifagen.example/pay/${identifier}`;
      setDialog({
        type: "link-created",
        link,
        amount,
        email: formValues.email,
        description: formValues.description,
      });
      try {
        await navigator.clipboard.writeText(link);
        notify("Payment link created and copied.");
      } catch {
        notify("Payment link created.");
      }
      return;
    }
    if (dialog.type === "refund") {
      const payment = payments.find((item) => item.id === dialog.paymentId);
      const amount = Number(formValues.amount);
      if (!payment || payment.status !== "Successful" || amount <= 0 || amount > payment.numericAmount) return;
      const refunded = {
        ...payment,
        status: "Refunded",
        numericAmount: amount,
        amount: `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        netAmount: `-₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        timeline: [
          ...(payment.timeline ?? []),
          {
            id: Date.now(),
            title: `Refund processed${formValues.reason ? `: ${formValues.reason}` : ""}`,
            time: new Date().toLocaleString(),
          },
        ],
      };
      setPayments((current) =>
        current.map((item) => (item.id === payment.id ? refunded : item)),
      );
      if (activePaymentDetail?.id === payment.id) setActivePaymentDetail(refunded);
      logAuditAction({
        admin: "Rohith P (Lead Admin)",
        action: `Processed ${amount === payment.numericAmount ? "Full" : "Partial"} Refund`,
        target: `${payment.user} (${payment.id})`,
        before: `Status: Successful | ${payment.amount}`,
        after: `Status: Refunded | Refund: ₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        reason: formValues.reason || "Client candidate service tier cancellation / refund request",
      });
      setDialog(null);
      notify(`Refund of ₹${amount.toLocaleString("en-IN")} recorded.`);
    }
  };

  const saveView = (event) => {
    event.preventDefault();
    if (!viewName.trim()) return;
    setSavedViews((current) => [
      ...current,
      {
        name: viewName.trim(),
        searchTerm,
        planFilter,
        statusFilter,
        methodFilter,
        typeFilter,
        dateFrom,
        dateTo,
        minimumAmount,
        maximumAmount,
      },
    ]);
    setViewName("");
    notify("Payment view saved.");
  };

  const applySavedView = (view) => {
    setSearchTerm(view.searchTerm);
    setPlanFilter(view.planFilter);
    setStatusFilter(view.statusFilter);
    setMethodFilter(view.methodFilter);
    setTypeFilter(view.typeFilter);
    setDateFrom(view.dateFrom);
    setDateTo(view.dateTo);
    setMinimumAmount(view.minimumAmount);
    setMaximumAmount(view.maximumAmount);
    setPage(1);
    setShowSavedViews(false);
  };

  const downloadInvoice = (payment) => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${payment.invoiceNo}</title><style>body{font:16px Arial,sans-serif;max-width:720px;margin:48px auto;color:#172033}h1{color:#2563eb}table{width:100%;border-collapse:collapse;margin-top:24px}td{padding:12px;border-bottom:1px solid #ddd}td:last-child{text-align:right}</style></head><body><h1>AiFAGen</h1><h2>Tax invoice</h2><p>Invoice ${payment.invoiceNo}<br>${payment.paymentDate}</p><p>${payment.userName}<br>${payment.userEmail}</p><table><tr><td>${payment.paymentType} — ${payment.plan}</td><td>${payment.subtotal}</td></tr><tr><td>GST</td><td>${payment.gst}</td></tr><tr><td><strong>Total</strong></td><td><strong>${payment.amount}</strong></td></tr></table><p>Payment method: ${payment.paymentMethod.replaceAll("\\n", " ")}</p></body></html>`;
    downloadFile(`${payment.invoiceNo}.html`, html, "text/html;charset=utf-8");
    notify(`Invoice ${payment.invoiceNo} downloaded. Open it and print to PDF.`);
  };

  const renderMetricIcon = (type) => {
    switch (type) {
      case "gross":
        return <BiRupee size={16} />;
      case "success":
        return <FiCheckCircle size={16} />;
      case "failed":
        return <FiAlertTriangle size={16} />;
      case "refund":
        return <FiRotateCcw size={16} />;
      case "net":
        return <FiBarChart2 size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="payments-page-layout">
      <div className="payments-main-container">
        {/* Header Bar */}
        <div className="payments-header-row">
          <div>
            <h1 className="payments-heading">Plans &amp; Subscriptions</h1>
            <p className="payments-subtitle">
              {activeView === "transactions"
                ? "View, track and manage customer payments, refunds and settlements."
                : "Manage subscription tiers, pricing, entitlements, and subscribers."}
            </p>
          </div>

          {activeView === "transactions" && <div className="payments-header-actions">
            <button
              className="export-action-btn"
              onClick={() => handleExport(filteredPayments)}
            >
              <FiDownload size={13} />
              <span>Export</span>
              <FiChevronDown size={13} />
            </button>
            <button
              className="create-paylink-btn"
              onClick={handleCreatePaymentLink}
            >
              <FiPlus size={15} />
              <span>Create Payment Link</span>
            </button>
          </div>}
        </div>

        <div className="plans-page-tabs" role="tablist" aria-label="Plans and subscriptions views">
          <button
            role="tab"
            aria-selected={activeView === "transactions"}
            className={activeView === "transactions" ? "active" : ""}
            onClick={() => setActiveView("transactions")}
          >
            Transactions &amp; Analytics
          </button>
          <button
            role="tab"
            aria-selected={activeView === "plans"}
            className={activeView === "plans" ? "active" : ""}
            onClick={() => {
              setActivePaymentDetail(null);
              setActiveView("plans");
            }}
          >
            Plans &amp; Tiers
          </button>
        </div>

        {activeView === "transactions" ? <>
        {/* 5 KPI Metric Cards */}
        <div className="payment-kpis-grid">
          {dynamicMetrics.map((kpi, idx) => (
            <div key={idx} className="kpi-card">
              <div className="kpi-top">
                <div
                  className="kpi-icon-square"
                  style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}
                >
                  {renderMetricIcon(kpi.iconType)}
                </div>
                <div className="kpi-title-block">
                  <span className="kpi-title">{kpi.title}</span>
                  <FiInfo size={12} className="info-icon" />
                </div>
              </div>
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-footer-row">
                <span className={`kpi-trend ${kpi.changeType}`}>
                  {kpi.changeType === "up" ? (
                    <FiTrendingUp />
                  ) : (
                    <FiTrendingDown />
                  )}
                  {kpi.change}
                </span>
                <span className="kpi-period">{kpi.trendPeriod}</span>
              </div>
              <div className="kpi-baseline">{kpi.subText}</div>
            </div>
          ))}
        </div>

        {/* Middle Charts Row */}
        <div className="payments-charts-row">
          {/* Revenue Trend Chart */}
          <div className="card-box revenue-trend-box">
            <div className="box-header-row">
              <div>
                <div className="box-title-with-info">
                  <h3>Revenue Trend</h3>
                  <FiInfo size={12} className="info-icon" />
                </div>
                <span className="box-caption">
                  {revenueGranularity} collected amount (gross)
                </span>
              </div>

              <div className="box-controls">
                <div className="chart-legend-row">
                  <span className="legend-marker-circle blue"></span>
                  <span className="legend-label">Successful payments</span>
                </div>

                <div className="timeframe-toggle">
                  {["Daily", "Weekly", "Monthly"].map((gran) => (
                    <button
                      key={gran}
                      className={`time-btn ${revenueGranularity === gran ? "active" : ""}`}
                      onClick={() => setRevenueGranularity(gran)}
                    >
                      {gran}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bars container */}
            <div className="revenue-bars-canvas">
              <div className="y-axis-labels">
                <span>₹{Math.ceil(chartMax / 1000)}K</span>
                <span>₹{Math.ceil((chartMax * 0.75) / 1000)}K</span>
                <span>₹{Math.ceil((chartMax * 0.5) / 1000)}K</span>
                <span>₹{Math.ceil((chartMax * 0.25) / 1000)}K</span>
                <span>₹0</span>
              </div>

              <div className="bars-area">
                <div className="grid-h-line" style={{ bottom: "100%" }}></div>
                <div className="grid-h-line" style={{ bottom: "75%" }}></div>
                <div className="grid-h-line" style={{ bottom: "50%" }}></div>
                <div className="grid-h-line" style={{ bottom: "25%" }}></div>
                <div className="grid-h-line" style={{ bottom: "0%" }}></div>

                <div className="bars-flex">
                  {chartData.map((bar, i) => (
                    <div key={`${bar.date}-${i}`} className="bar-wrapper" title={`${bar.date}: ₹${bar.value.toLocaleString("en-IN")}`}>
                      <div className="tooltip-indicator">
                        <span className="tip-date">{bar.date}</span>
                        <span className="tip-val">₹{bar.value.toLocaleString("en-IN")}</span>
                      </div>
                      <div
                        className={`bar-stick ${i === chartData.length - 1 ? "active-stick" : ""}`}
                        style={{ height: `${(bar.value / chartMax) * 100}%` }}
                      ></div>
                    </div>
                  ))}
                </div>

                <div className="x-axis-labels">
                  {chartData.map((bar) => <span key={bar.date}>{bar.date}</span>)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Breakdown */}
          <div className="card-box status-breakdown-box">
            <div className="box-header-row">
              <h3>Payment Status</h3>
            </div>

            <div className="status-progress-track">
              {statusSummary.map((item) => <div key={item.name} className="track-segment" style={{ width: item.pct, backgroundColor: item.color }}></div>)}
            </div>

            <div className="total-payments-count">
              <strong>{payments.length} payments</strong>
            </div>

            <div className="status-legend-table">
              {statusSummary.map((item) => (
                <div
                  key={item.name}
                  className={`status-legend-item ${statusFilter === item.name ? "active" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setStatusFilter((current) => current === item.name ? "All" : item.name); setPage(1); }}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setStatusFilter((current) => current === item.name ? "All" : item.name); setPage(1); } }}
                >
                  <div className="legend-left">
                    <span
                      className="legend-dot-large"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="legend-status-name">{item.name}</span>
                  </div>
                  <div className="legend-right">
                    <span className="legend-tally">
                      {item.count} ({item.pct})
                    </span>
                    <FiChevronRight size={13} className="arrow-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="card-box table-card-container">
          <div className="toolbar-top">
            <div className="search-input-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by user name, email, payment ID or invoice..."
                value={searchTerm}
                onChange={(e) => updateSearch(e.target.value)}
              />
            </div>

            <div className="selects-row">
              <select
                className="custom-dropdown-select"
                value={planFilter}
                onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
              >
                <option value="All">All Plans</option>
                <option value="Premium">Premium</option>
                <option value="Basic">Basic</option>
                <option value="None">None</option>
              </select>

              <select
                className="custom-dropdown-select"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="All">All Statuses</option>
                <option value="Successful">Successful</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
                <option value="Processing">Processing</option>
              </select>

              <select
                className="custom-dropdown-select"
                value={methodFilter}
                onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
              >
                <option value="All">All Payment Methods</option>
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="upi">UPI</option>
                <option value="netbanking">Net Banking</option>
              </select>

              <button
                className="date-filter-btn"
                onClick={() => setShowMoreFilters((visible) => !visible)}
                aria-expanded={showMoreFilters}
              >
                <FiCalendar size={13} />
                <span>{hasDateFilter ? `${formatDateInput(dateFrom)} – ${formatDateInput(dateTo)}` : "All dates"}</span>
                <FiChevronDown size={12} />
              </button>

              <button
                className="more-filters-btn"
                onClick={() => setShowMoreFilters((visible) => !visible)}
                aria-expanded={showMoreFilters}
              >
                <FiFilter size={13} />
                <span>More filters</span>
                <FiChevronDown size={12} />
              </button>
            </div>
          </div>

          {/* Active Date Tag */}
          <div className="toolbar-active-tags-row">
            <div className="tags-left">
              {hasDateFilter && (
                <span className="active-tag-bubble">
                  Date: {formatDateInput(dateFrom)} – {formatDateInput(dateTo)}
                  <button type="button" aria-label="Remove date filter" className="tag-remove-cross" onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}><FiX size={12} /></button>
                </span>
              )}
              {[
                ["Plan", planFilter, setPlanFilter],
                ["Status", statusFilter, setStatusFilter],
                ["Method", methodFilter, setMethodFilter],
                ["Type", typeFilter, setTypeFilter],
              ].filter(([, value]) => value !== "All").map(([label, value, setter]) => <span className="active-tag-bubble" key={label}>{label}: {value}<button type="button" aria-label={`Remove ${label} filter`} className="tag-remove-cross" onClick={() => { setter("All"); setPage(1); }}><FiX size={12} /></button></span>)}
              {(minimumAmount || maximumAmount) && <span className="active-tag-bubble">Amount: {minimumAmount || "0"}–{maximumAmount || "∞"}<button type="button" aria-label="Remove amount filter" className="tag-remove-cross" onClick={() => { setMinimumAmount(""); setMaximumAmount(""); setPage(1); }}><FiX size={12} /></button></span>}
              <button
                className="clear-filters-link"
                onClick={handleClearAllFilters}
              >
                Clear all
              </button>
            </div>

            <div className="tags-right">
              <button className="save-view-cta" onClick={() => setShowSavedViews((visible) => !visible)} aria-expanded={showSavedViews}>
                <span>Save view</span>
                <FiChevronDown size={12} />
              </button>
            </div>
          </div>

          {showMoreFilters && <div className="payments-extra-filters">
            <label>From<input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} /></label>
            <label>To<input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} /></label>
            <label>Payment type<select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }}><option value="All">All types</option>{[...new Set(payments.map((payment) => payment.paymentType))].map((type) => <option key={type}>{type}</option>)}</select></label>
            <label>Minimum amount<input type="number" min="0" value={minimumAmount} onChange={(event) => { setMinimumAmount(event.target.value); setPage(1); }} placeholder="₹0" /></label>
            <label>Maximum amount<input type="number" min="0" value={maximumAmount} onChange={(event) => { setMaximumAmount(event.target.value); setPage(1); }} placeholder="No limit" /></label>
          </div>}

          {showSavedViews && <div className="payments-extra-filters saved-payment-views">
            <form onSubmit={saveView}>
              <label>View name<input aria-label="Payment view name" value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder="Name this filter view" required /></label>
              <button type="submit">Save current filters</button>
            </form>
            {savedViews.map((view, index) => <button type="button" key={`${view.name}-${index}`} onClick={() => applySavedView(view)}>{view.name}</button>)}
            {!savedViews.length && <span>No saved views yet.</span>}
          </div>}

          {/* Payments Data Table */}
          <div className="table-responsive-wrapper">
            <table className="payments-data-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      className="table-checkbox"
                      checked={
                        allPageSelected
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th><button className="payment-sort-header" onClick={() => handleSort("id")}>Payment ID{sort.field === "id" ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}</button></th>
                  <th><button className="payment-sort-header" onClick={() => handleSort("userName")}>User{sort.field === "userName" ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}</button></th>
                  <th><button className="payment-sort-header" onClick={() => handleSort("plan")}>Plan{sort.field === "plan" ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}</button></th>
                  <th><button className="payment-sort-header" onClick={() => handleSort("numericAmount")}>Amount{sort.field === "numericAmount" ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}</button></th>
                  <th><button className="payment-sort-header" onClick={() => handleSort("status")}>Status{sort.field === "status" ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}</button></th>
                  <th>Payment Method</th>
                  <th><button className="payment-sort-header" onClick={() => handleSort("paymentDate")}>Payment Date (IST){sort.field === "paymentDate" ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}</button></th>
                  <th>Invoice No.</th>
                  <th>Actions</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {!pagePayments.length && <tr><td className="payments-empty-state" colSpan="11">No payments match these filters.</td></tr>}
                {pagePayments.map((p) => {
                  const isChecked = selectedPaymentIds.includes(p.id);
                  const isCurrentActive = activePaymentDetail?.id === p.id;

                  return (
                    <tr
                      key={p.id}
                      className={`payment-row ${isCurrentActive ? "row-selected" : ""}`}
                      onClick={() => handleInspectPayment(p)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(p.id)}
                        />
                      </td>

                      <td>
                        <span className="cell-id-link">{p.id}</span>
                      </td>

                      <td>
                        <div className="cell-user-info">
                          <span className="user-name-bold">{p.userName}</span>
                          <span className="user-email-muted">
                            {p.userEmail}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className={`plan-pill ${p.plan.toLowerCase()}`}>
                          {p.plan}
                        </span>
                      </td>

                      <td className="amount-cell-bold">{p.amount}</td>

                      <td>
                        <span
                          className={`status-pill ${p.status.toLowerCase()}`}
                        >
                          <span className="dot"></span>
                          {p.status}
                        </span>
                      </td>

                      <td className="method-cell">
                        {p.paymentMethod.split("\n").map((line, lIdx) => (
                          <span
                            key={lIdx}
                            className={lIdx === 1 ? "sub-account" : ""}
                          >
                            {line}
                          </span>
                        ))}
                      </td>

                      <td>
                        <div className="date-time-cell">
                          <span>{p.paymentDate}</span>
                          <span className="time-sub">{p.paymentTime}</span>
                        </div>
                      </td>

                      <td className="invoice-no-cell">{p.invoiceNo}</td>

                      <td onClick={(e) => e.stopPropagation()}>
                        {p.actionText === "Retry" ? (
                          <button
                            className="btn-retry-action"
                            onClick={() => handleRetryPayment(p.id)}
                          >
                            Retry
                          </button>
                        ) : (
                          <button
                            className="btn-view-action"
                            onClick={() => handleInspectPayment(p)}
                          >
                            View
                          </button>
                        )}
                      </td>

                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="row-more-options"
                          aria-label={`More actions for ${p.id}`}
                          aria-expanded={rowMenuId === p.id}
                          onClick={() => setRowMenuId((current) => current === p.id ? null : p.id)}
                        >
                          <FiMoreHorizontal size={14} />
                        </button>
                        {rowMenuId === p.id && <div className="payment-row-menu">
                          <button onClick={() => handleInspectPayment(p)}>View details</button>
                          <button onClick={() => downloadInvoice(p)}>Download invoice</button>
                          <button onClick={() => handleSendReceipt(p)}>Send receipt</button>
                          {p.status === "Successful" && <button onClick={() => handleIssueRefund(p)}>Issue refund</button>}
                          {p.status === "Failed" && <button onClick={() => handleRetryPayment(p.id)}>Retry payment</button>}
                        </div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Navigation */}
          <div className="table-footer-pagination">
            <span className="page-count-text">
              Showing {filteredPayments.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredPayments.length)} of {filteredPayments.length} payments
            </span>

            <div className="pagination-numbers-row">
              <button className="page-nav-arrow" disabled={currentPage <= 1} onClick={() => setPage((current) => current - 1)}>
                <FiChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} className={`page-num-btn ${pageNumber === currentPage ? "active" : ""}`} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}
              <button className="page-nav-arrow" disabled={currentPage >= totalPages} onClick={() => setPage((current) => current + 1)}>
                <FiChevronRight size={13} />
              </button>

              <label className="per-page-dropdown">Rows
                <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                  <option value={5}>5 per page</option><option value={10}>10 per page</option><option value={25}>25 per page</option>
                </select>
              </label>
            </div>
          </div>
        </div>
        </> : <ManagePlansView plans={plans} onPlansChange={setPlans} globalSearchTerm={globalSearchTerm} />}
      </div>

      {/* On-Demand Right Inspection Drawer: Opens ONLY when user clicks a payment */}
      {activePaymentDetail && (
        <PaymentDetailsDrawer
          payment={activePaymentDetail}
          onClose={() => setActivePaymentDetail(null)}
          onRefund={handleIssueRefund}
          onSendReceipt={handleSendReceipt}
          onDownloadInvoice={downloadInvoice}
          onNotify={notify}
          onCopy={async (text) => {
            try { await navigator.clipboard.writeText(text); notify("Copied to clipboard."); }
            catch { notify("Clipboard access is unavailable in this browser."); }
          }}
          onRetry={handleRetryPayment}
        />
      )}

      {dialog && <div className="payments-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
        <section className="payments-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-dialog-title">
          <button className="payments-dialog-close" aria-label="Close dialog" onClick={() => setDialog(null)}><FiX /></button>
          {dialog.type === "create-link" && <>
            <h2 id="payment-dialog-title">Create payment link</h2>
            <p>Create a demo checkout link. No payment gateway is connected.</p>
            <form onSubmit={submitDialog}>
              <label>Amount (₹)<input type="number" min="0.01" step="0.01" required value={formValues.amount ?? ""} onChange={(event) => setFormValues((current) => ({ ...current, amount: event.target.value }))} /></label>
              <label>Customer email<input type="email" value={formValues.email ?? ""} onChange={(event) => setFormValues((current) => ({ ...current, email: event.target.value }))} /></label>
              <label>Description<input value={formValues.description ?? ""} onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))} /></label>
              <button type="submit">Create link</button>
            </form>
          </>}
          {dialog.type === "link-created" && <>
            <h2 id="payment-dialog-title">Payment link created</h2>
            <p>This is a local demo link; it does not charge a payment method.</p>
            <p>Amount: ₹{dialog.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}{dialog.email ? ` · Customer: ${dialog.email}` : ""}{dialog.description ? ` · ${dialog.description}` : ""}</p>
            <div className="created-payment-link">{dialog.link}</div>
            <button onClick={async () => {
              try { await navigator.clipboard.writeText(dialog.link); notify("Payment link copied."); }
              catch { notify("Clipboard access is unavailable in this browser."); }
            }}><FiCopy /> Copy link</button>
            <button onClick={() => setDialog(null)}>Done</button>
          </>}
          {dialog.type === "refund" && <>
            <h2 id="payment-dialog-title">Issue refund</h2>
            <p>Record a demo refund for {payments.find((payment) => payment.id === dialog.paymentId)?.id}. No gateway is connected.</p>
            <form onSubmit={submitDialog}>
              <label>Refund amount (₹)<input type="number" min="0.01" max={payments.find((payment) => payment.id === dialog.paymentId)?.numericAmount} step="0.01" required value={formValues.amount ?? ""} onChange={(event) => setFormValues((current) => ({ ...current, amount: event.target.value }))} /></label>
              <label>Reason<input value={formValues.reason ?? ""} onChange={(event) => setFormValues((current) => ({ ...current, reason: event.target.value }))} /></label>
              <button type="submit">Record refund</button>
            </form>
          </>}
        </section>
      </div>}
      {notice && <div className="payments-notice" role="status">{notice}</div>}

      {/* Bottom Floating Bar when items are selected */}
      {selectedPaymentIds.length > 0 && (
        <div className="floating-selected-bar">
          <div className="selected-tag-info">
            <input
              type="checkbox"
              checked={true}
              onChange={() => setSelectedPaymentIds([])}
              className="table-checkbox"
            />
            <span>
              <strong>{selectedPaymentIds.length} payment selected</strong>
            </span>
          </div>
          <div className="bulk-btns-list">
            <button
              className="btn-bulk-sub"
              onClick={handleBulkReceipts}
            >
              Send receipts
            </button>
            <button
              className="btn-bulk-sub"
              onClick={() => handleExport(selectedPayments)}
            >
              Export selected
            </button>
            <button
              className="btn-bulk-close"
              onClick={() => setSelectedPaymentIds([])}
            >
              <FiX size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
