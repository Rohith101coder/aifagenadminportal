import { useState } from "react";
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiEdit2,
  FiSend,
  FiKey,
  FiTrash2,
  FiMoreHorizontal,
  FiClock,
  FiCheckCircle,
  FiBriefcase,
  FiMessageSquare,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";
import "./MemberDetailsDrawer.css";

export default function MemberDetailsDrawer({
  member,
  currentIndex,
  totalCount,
  onNext,
  onPrev,
  onClose,
  onSendMessage,
  onResetPassword,
  onRemoveAccess,
  onEditMember,
  onNotify,
}) {
  const [activeTab, setActiveTab] = useState("Overview");

  if (!member) return null;

  const copyText = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
      onNotify(`Copied ${txt} to clipboard.`);
    } catch {
      onNotify("Could not access the clipboard. Copy the text manually.");
    }
  };

  const renderActivityIcon = (type) => {
    switch (type) {
      case "job":
        return <FiBriefcase size={13} color="#2563eb" />;
      case "hire":
        return <FiCheckCircle size={13} color="#10b981" />;
      case "edit":
        return <FiEdit2 size={13} color="#d97706" />;
      case "comment":
        return <FiMessageSquare size={13} color="#6366f1" />;
      default:
        return <FiClock size={13} color="#64748b" />;
    }
  };

  return (
    <aside className="member-details-drawer">
      {/* Top Bar with Pagination */}
      <div className="drawer-top-bar">
        <div className="left-empty"></div>
        <div className="drawer-top-pagination">
          <button
            className="nav-arrow-btn"
            onClick={onPrev}
            disabled={currentIndex <= 0}
          >
            <FiChevronLeft size={14} />
          </button>
          <span className="pagination-count-label">
            {currentIndex + 1} of {totalCount}
          </span>
          <button
            className="nav-arrow-btn"
            onClick={onNext}
            disabled={currentIndex >= totalCount - 1}
          >
            <FiChevronRight size={14} />
          </button>
          <button
            className="close-drawer-cross"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={17} />
          </button>
        </div>
      </div>

      <div className="drawer-scroll-body">
        {/* Profile Card Header */}
        <div className="member-header-card">
          <div
            className="member-avatar-big"
            style={{ backgroundColor: member.avatarBg }}
          >
            {member.initials}
          </div>
          <div className="member-meta-block">
            <div className="name-status-row">
              <h3>{member.name}</h3>
              <span className={`status-pill ${member.status.toLowerCase()}`}>
                <span className="dot"></span>
                {member.status}
              </span>
            </div>
            <span className="member-job-title">{member.title}</span>
            <div className="email-copy-line">
              <span className="email-text">{member.email}</span>
              <button
                className="icon-copy-btn"
                onClick={() => copyText(member.email)}
              >
                <FiCopy size={11} />
              </button>
            </div>
            <div className="location-clock-line">
              <span>{member.locationFull}</span>
              <span className="time-sub">🕒 {member.timeLocal}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="drawer-navigation-tabs">
          {["Overview", "Performance", "Jobs", "Activity", "Permissions"].map(
            (tab) => (
              <button
                key={tab}
                className={`drawer-tab-link ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ),
          )}
        </div>

        {(activeTab === "Overview" || activeTab === "Permissions") && <>
        {/* Section: Role & Access */}
        <section className="drawer-card-box">
          <div className="box-header-row">
            <h4>Role & Access</h4>
            <button
              className="btn-edit-badge"
              onClick={() => onEditMember(member)}
            >
              <FiEdit2 size={11} />
              <span>Edit</span>
            </button>
          </div>

          <div className="kv-info-list">
            <div className="kv-row">
              <span className="kv-label">Role</span>
              <span className={`role-chip ${member.roleClass}`}>
                {member.role}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Department</span>
              <span className="kv-val">{member.department}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Manager</span>
              <div className="manager-chip-line">
                <span className="avatar-mini">{member.managerInitials}</span>
                <span className="kv-val">{member.manager}</span>
              </div>
            </div>
            <div className="kv-row">
              <span className="kv-label">Member since</span>
              <span className="kv-val">{member.memberSince}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Employment type</span>
              <span className="kv-val">{member.employmentType}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Access level</span>
              <span className="kv-val bold">{member.accessLevel}</span>
            </div>
          </div>
        </section>
        </>}

        {/* Section: Key Performance (Last 30 days) */}
        {(activeTab === "Overview" || activeTab === "Performance") && member.kpis && (
          <section className="drawer-card-box">
            <div className="box-header-row">
              <h4>
                Key Performance{" "}
                <span className="sub-period">(Last 30 days)</span>
              </h4>
              <button
                className="link-view-details"
                onClick={() => setActiveTab("Performance")}
              >
                View details
              </button>
            </div>

            <div className="performance-kpis-grid">
              <div className="perf-kpi-cell">
                <span className="perf-num">{member.kpis.jobsHandled}</span>
                <span className="perf-sub-label">Jobs handled</span>
                <span className="trend-badge green">
                  <FiTrendingUp size={11} /> {member.kpis.jobsHandledTrend}
                </span>
              </div>

              <div className="perf-kpi-cell">
                <span className="perf-num">{member.kpis.successRate}</span>
                <span className="perf-sub-label">Success rate</span>
                <span className="trend-badge green">
                  <FiTrendingUp size={11} /> {member.kpis.successRateTrend}
                </span>
              </div>

              <div className="perf-kpi-cell">
                <span className="perf-num">{member.kpis.avgTime}</span>
                <span className="perf-sub-label">Avg. time to hire</span>
                <span className="trend-badge green">
                  <FiTrendingDown size={11} /> {member.kpis.avgTimeTrend}
                </span>
              </div>

              <div className="perf-kpi-cell">
                <span className="perf-num">{member.kpis.hiringQuality}</span>
                <span className="perf-sub-label">Hiring quality</span>
                <span className="trend-badge green">
                  <FiTrendingUp size={11} /> {member.kpis.hiringQualityTrend}
                </span>
              </div>
            </div>
          </section>
        )}

        {(activeTab === "Overview" || activeTab === "Activity") && <>
        {/* Section: Recent Activity */}
        <section className="drawer-card-box">
          <div className="box-header-row">
            <h4>Recent Activity</h4>
            <button
              className="link-view-details"
              onClick={() => setActiveTab("Activity")}
            >
              View all
            </button>
          </div>

          <div className="activity-timeline-feed">
            {(member.activities && member.activities.length > 0
              ? member.activities
              : [
                  {
                    id: 1,
                    type: "job",
                    title: "Active on platform",
                    desc: "Managed team pipeline",
                    time: member.lastActive,
                  },
                ]
            ).map((act) => (
              <div key={act.id} className="timeline-item-entry">
                <div className="activity-icon-bubble">
                  {renderActivityIcon(act.type)}
                </div>
                <div className="activity-body-wrap">
                  <span className="act-title-bold">{act.title}</span>
                  <span className="act-desc-sub">{act.desc}</span>
                  <span className="act-time-sub">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        </>}
        {activeTab === "Jobs" && <section className="drawer-card-box">
          <div className="box-header-row"><h4>Job activity</h4></div>
          {member.jobsHandled !== null && member.jobsHandled !== undefined
            ? <div className="member-jobs-summary"><strong>{member.jobsHandled}</strong><span>jobs handled</span>{member.successRate !== null && <span>{member.successRate}% success rate · {member.avgTime} average time</span>}</div>
            : <div className="member-empty-tab">No job performance data is recorded for this role.</div>}
        </section>}
        {activeTab === "Permissions" && <section className="drawer-card-box">
          <div className="box-header-row"><h4>Platform permissions</h4></div>
          <p className="member-empty-tab">Access level: <strong>{member.accessLevel}</strong></p>
          <p className="member-empty-tab">Role-based permissions are managed locally in this demo. No identity or authorization provider is connected.</p>
          <button className="btn-edit-badge" onClick={() => onEditMember(member)}><FiEdit2 size={11} /> Edit member access</button>
        </section>}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="drawer-bottom-actions">
        <button
          className="btn-bottom-cta"
          onClick={() => onSendMessage(member)}
        >
          <FiSend size={12} />
          <span>Message</span>
        </button>
        <button
          className="btn-bottom-cta"
          onClick={() => onResetPassword(member)}
        >
          <FiKey size={12} />
          <span>Reset Password</span>
        </button>
        <button
          className="btn-icon-sq"
          onClick={() => setActiveTab("Permissions")}
        >
          <FiMoreHorizontal size={14} />
        </button>
        <button
          className="btn-bottom-cta danger"
          onClick={() => onRemoveAccess(member)}
        >
          <FiTrash2 size={12} />
          <span>Remove Access</span>
        </button>
      </div>
    </aside>
  );
}
