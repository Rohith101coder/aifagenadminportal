import { useRef, useState } from "react";
import AttentionBanner from "../components/AttentionBanner/AttentionBanner";
import StatCard from "../components/StatCard/StatCard";
import RevenueChart from "../components/RevenueChart/RevenueChart";
import UsersByPlan from "../components/UsersByPlan/UsersByPlan";
import ExpiringPlansTable from "../components/ExpiringPlansTable/ExpiringPlansTable";
import JobSourceStatusTable from "../components/JobSourceStatusTable/JobSourceStatusTable";
import AdminActivityFeed from "../components/AdminActivityFeed/AdminActivityFeed";
import { statCardsData } from "../data/dashboardData";
import "./Dashboard.css";

export default function Dashboard({ searchTerm = "", dateRange }) {
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(null);

  const notify = (message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3500);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Live overview of users, revenue, job sources and platform health.
          </p>
        </div>
        <div className="live-status-indicator">
          <span className="live-dot"></span>
          <span className="live-text">Last updated 5 minutes ago</span>
        </div>
      </div>

      <AttentionBanner onAction={notify} />

      <div className="stat-cards-grid">
        {statCardsData.map((stat, idx) => (
          <StatCard key={idx} item={stat} />
        ))}
      </div>

      <div className="dashboard-grid-row">
        <RevenueChart dateRange={dateRange} />
        <UsersByPlan />
      </div>

      <div className="dashboard-grid-row">
        <ExpiringPlansTable searchTerm={searchTerm} onAction={notify} />
        <JobSourceStatusTable searchTerm={searchTerm} onAction={notify} />
      </div>

      <div className="dashboard-grid-row">
        <AdminActivityFeed searchTerm={searchTerm} onAction={notify} />
      </div>
      {notice && (
        <div className="dashboard-toast" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button>
        </div>
      )}
    </div>
  );
}
