import {
  FiUsers,
  FiAward,
  FiPercent,
  FiInfo,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";
import { BiRupee } from "react-icons/bi";
import "./StatCard.css";

export default function StatCard({ item }) {
  const renderIcon = () => {
    switch (item.title) {
      case "Total Users":
        return <FiUsers />;
      case "Paying Users":
        return <FiAward />;
      case "Conversion Rate":
        return <FiPercent />;
      case "Monthly Recurring Revenue":
        return <BiRupee size={22.5} />;
      default:
        return null;
    }
  };

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div
          className="stat-icon-box"
          style={{
            backgroundColor: item.iconBg,
            color: item.iconColor,
          }}
        >
          {renderIcon()}
        </div>
        <div className="stat-titles">
          <div className="stat-title-row">
            <span className="stat-title">{item.title}</span>
            <FiInfo className="info-icon" />
          </div>
          <span className="stat-sub">{item.subtitle}</span>
        </div>
      </div>

      <div className="stat-body">
        <div className="stat-value">{item.value}</div>

        {/* Decorative mini sparkline wave */}
        <div className="sparkline-wrapper">
          <svg width="125" height="42.5" viewBox="0 0 100 34" fill="none">
            <path
              d="M2 28 C 15 28, 25 15, 38 18 C 50 22, 60 10, 75 14 C 85 8, 92 4, 98 2"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M2 28 C 15 28, 25 15, 38 18 C 50 22, 60 10, 75 14 C 85 8, 92 4, 98 2 L98 34 L2 34 Z"
              fill="url(#grad)"
              opacity="0.15"
            />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="stat-footer">
        <div className={`trend-badge ${item.changeType}`}>
          {item.changeType === "up" ? <FiTrendingUp /> : <FiTrendingDown />}
          <span>{item.change}</span>
        </div>
        <span className="trend-period">{item.trendPeriod}</span>
      </div>
    </div>
  );
}
