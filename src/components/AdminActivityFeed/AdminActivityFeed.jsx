import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { adminActivities } from "../../data/dashboardData";
import "./AdminActivityFeed.css";

export default function AdminActivityFeed({ searchTerm = "", onAction }) {
  const [activityType, setActivityType] = useState("All activities");
  const activities = adminActivities.filter((activity) => {
    const matchesType = activityType === "All activities" || activity.badge === activityType;
    const matchesSearch = `${activity.adminName} ${activity.actionText} ${activity.detail} ${activity.badge}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="card-container admin-activity-card">
      <div className="activity-header">
        <div className="activity-title-row">
          <h3>Recent Admin Activity</h3>
          <span className="sub-caption">
            Latest platform changes and actions
          </span>
        </div>
        <label className="activity-filter-label">
          <select
            className="dropdown-select"
            value={activityType}
            onChange={(event) => setActivityType(event.target.value)}
            aria-label="Filter admin activity"
          >
            <option>All activities</option>
            <option>User</option>
            <option>Payment</option>
            <option>Internal Job</option>
            <option>Settings</option>
          </select>
          <FiChevronDown size={17.5} />
        </label>
      </div>

      <div className="activity-list">
        {activities.map((act) => (
          <button
            key={act.id}
            className="activity-row"
            onClick={() => onAction?.(`${act.adminName}: ${act.actionText} — ${act.detail}`)}
          >
            <div className="timeline-col">
              <span
                className="timeline-dot"
                style={{ backgroundColor: act.bulletColor }}
              ></span>
              <div className="time-meta">
                <span className="time-rel">{act.timeRelative}</span>
                <span className="time-exact">{act.timestamp}</span>
              </div>
            </div>

            <div className="admin-avatar-col">
              <div className="admin-badge-avatar">{act.initials}</div>
            </div>

            <div className="action-details-col">
              <div className="action-main-line">
                <span className="admin-name-bold">{act.adminName}</span>
                <span className="action-verb">{act.actionText}</span>
              </div>
              <span className="action-sub-detail">{act.detail}</span>
            </div>

            <div className="badge-tag-col">
              <span className="activity-tag">{act.badge}</span>
              {act.extraBadge && (
                <span className="extra-tag">{act.extraBadge}</span>
              )}
            </div>

            <div className="chevron-col">
              <FiChevronRight className="act-chevron" />
            </div>
          </button>
        ))}
        {activities.length === 0 && (
          <p className="table-empty activity-empty">No activity matches your filters.</p>
        )}
      </div>
    </div>
  );
}
