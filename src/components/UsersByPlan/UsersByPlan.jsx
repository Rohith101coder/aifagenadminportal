import { FiInfo } from "react-icons/fi";
import { plansDistribution } from "../../data/dashboardData";
import "./UsersByPlan.css";

export default function UsersByPlan() {
  return (
    <div className="card-container users-by-plan-card">
      <div className="plan-header">
        <div className="title-with-info">
          <h3>Users by Plan</h3>
          <FiInfo className="info-icon" />
        </div>
        <span className="chart-sub">Active users by current plan</span>
      </div>

      <div className="donut-content">
        <div className="donut-svg-wrapper">
          <svg width="145" height="145" viewBox="0 0 100 100" role="img" aria-label="Users grouped by subscription plan">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke="#e2e8f0"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Premium ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke="#2563eb"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray="238.76"
              strokeDashoffset="153.8"
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            {/* Basic ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke="#60a5fa"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray="238.76"
              strokeDashoffset="165.7"
              transform="rotate(38 50 50)"
            />
          </svg>
          <div className="donut-center-text">
            <span className="center-value">{plansDistribution.total}</span>
            <span className="center-label">Users</span>
          </div>
        </div>

        <div className="donut-legend">
          {plansDistribution.plans.map((item, idx) => (
            <div key={idx} className="legend-row">
              <span
                className="legend-dot"
                style={{ backgroundColor: item.color }}
              ></span>
              <div className="legend-info">
                <span className="legend-name">{item.name}</span>
                <span className="legend-stats">
                  {item.count} ({item.pct})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
