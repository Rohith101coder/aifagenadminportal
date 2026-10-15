import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { BsGrid1X2Fill, BsChevronRight, BsChevronLeft } from "react-icons/bs";
import {
  FiUsers,
  FiCreditCard,
  FiBriefcase,
  FiUserCheck,
  FiCalendar,
  FiCpu,
  FiBarChart2,
  FiShield,
  FiSettings,
  FiMoon,
  FiSun,
  FiLogOut,
  FiX,
} from "react-icons/fi";
import "./Sidebar.css";

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
  darkMode,
  onToggleTheme,
  currentUser = { name: "Rohith P", email: "rohith.p@aifagenlabs.com", role: "Super Admin" },
  onSignOut,
}) {
  const location = useLocation();
  const [jobsExpandedOverride, setJobsExpandedOverride] = useState(null);
  const isJobsActive =
    location.pathname.startsWith("/jobs") ||
    location.pathname === "/internal-jobs" ||
    location.pathname === "/job-sources";
  const jobsExpanded = jobsExpandedOverride ?? isJobsActive;

  const handleNavClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Brand Logo */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <img
            src="/aifagenlogo-icon.png"
            alt="AiFAGen Logo"
            className="brand-logo-img"
          />
        </div>
        <div className="brand-title-wrap">
          <span className="brand-text">AiFAGen</span>
          <span className="brand-tag">PORTAL</span>
        </div>
        <button
          type="button"
          id="sidebar-ctrl-mobile-close"
          data-sidebar-id="sidebar-ctrl-mobile-close"
          className="mobile-sidebar-close-btn"
          onClick={onCloseMobile}
          aria-label="Close navigation"
        >
          <FiX size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {/* GROUP 1: EXECUTIVE DESK */}
        <div className="nav-group-label">COMMAND DESK</div>
        <NavLink
          to="/dashboard"
          id="sidebar-nav-dashboard"
          data-sidebar-id="sidebar-nav-dashboard"
          data-nav-id="executive-dashboard"
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          title={collapsed ? "Executive Dashboard" : undefined}
        >
          <BsGrid1X2Fill className="nav-icon" />
          <span>Executive Dashboard</span>
        </NavLink>

        {/* GROUP 2: CANDIDATES & BILLING */}
        <div className="nav-group-label">CANDIDATES &amp; REVENUE</div>
        <NavLink
          to="/users"
          id="sidebar-nav-candidate-roster"
          data-sidebar-id="sidebar-nav-candidate-roster"
          data-nav-id="candidate-roster"
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          title={collapsed ? "Candidate Roster (US Tech Seekers)" : undefined}
        >
          <FiUsers className="nav-icon" />
          <span>Candidate Roster</span>
        </NavLink>
        <NavLink
          to="/payments"
          id="sidebar-nav-billing-invoices"
          data-sidebar-id="sidebar-nav-billing-invoices"
          data-nav-id="billing-invoices"
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          title={collapsed ? "Billing & Invoices (Retainers)" : undefined}
        >
          <FiCreditCard className="nav-icon" />
          <span>Billing &amp; Invoices</span>
        </NavLink>

        {/* GROUP 3: JOB PIPELINE (With Nested Internal Jobs & Job Sources) */}
        <div className="nav-group-label">JOB MARKET &amp; PIPELINE</div>
        <div className="jobs-sidebar-group">
          <button
            type="button"
            id="sidebar-nav-job-pipeline"
            data-sidebar-id="sidebar-nav-job-pipeline"
            data-nav-id="job-pipeline"
            className={`nav-item has-submenu ${isJobsActive ? "active" : ""}`}
            aria-expanded={jobsExpanded}
            title={collapsed ? "Job Pipeline & Openings" : undefined}
            onClick={() =>
              setJobsExpandedOverride((expanded) =>
                !(expanded ?? isJobsActive),
              )
            }
          >
            <div className="nav-item-left">
              <FiBriefcase className="nav-icon" />
              <span>Job Pipeline</span>
            </div>
            <BsChevronRight
              className={`nav-chevron ${jobsExpanded ? "expanded" : ""}`}
            />
          </button>
          {jobsExpanded && (
            <div className="jobs-sidebar-subnav">
              <NavLink
                to="/jobs/all"
                id="sidebar-nav-jobs-all"
                data-sidebar-id="sidebar-nav-jobs-all"
                data-nav-id="job-pipeline-all"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `jobs-sidebar-sublink ${isActive || location.pathname === "/jobs" ? "active" : ""}`
                }
              >
                All Positions
              </NavLink>
              <NavLink
                to="/jobs/public"
                id="sidebar-nav-jobs-market"
                data-sidebar-id="sidebar-nav-jobs-market"
                data-nav-id="job-pipeline-market"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `jobs-sidebar-sublink ${isActive ? "active" : ""}`
                }
              >
                Market Feeds
              </NavLink>
              <NavLink
                to="/jobs/internal"
                id="sidebar-nav-jobs-internal"
                data-sidebar-id="sidebar-nav-jobs-internal"
                data-nav-id="job-pipeline-internal"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `jobs-sidebar-sublink ${isActive || location.pathname === "/internal-jobs" ? "active" : ""}`
                }
              >
                Internal Postings
              </NavLink>
              <NavLink
                to="/jobs/sources"
                id="sidebar-nav-jobs-crawlers"
                data-sidebar-id="sidebar-nav-jobs-crawlers"
                data-nav-id="job-pipeline-crawlers"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `jobs-sidebar-sublink ${isActive || location.pathname === "/job-sources" ? "active" : ""}`
                }
              >
                Crawler Sources
              </NavLink>
            </div>
          )}
        </div>

        {/* GROUP 4: TALENT ACCELERATION */}
        <div className="nav-group-label">TALENT ACCELERATION</div>
        <NavLink
          to="/interviews"
          id="sidebar-nav-interview-pipeline"
          data-sidebar-id="sidebar-nav-interview-pipeline"
          data-nav-id="interview-pipeline"
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          title={collapsed ? "Interview Pipeline (Mock & Client Prep)" : undefined}
        >
          <FiCalendar className="nav-icon" />
          <span>Interview Pipeline</span>
        </NavLink>
        <NavLink
          to="/team-members"
          id="sidebar-nav-delivery-operations"
          data-sidebar-id="sidebar-nav-delivery-operations"
          data-nav-id="delivery-operations"
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          title={collapsed ? "Delivery Operations (Siddipet Hub)" : undefined}
        >
          <FiUserCheck className="nav-icon" />
          <span>Delivery Operations</span>
        </NavLink>
        <NavLink
          to="/reports"
          id="sidebar-nav-placement-analytics"
          data-sidebar-id="sidebar-nav-placement-analytics"
          data-nav-id="placement-analytics"
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          title={collapsed ? "Placement Analytics & Intelligence" : undefined}
        >
          <FiBarChart2 className="nav-icon" />
          <span>Placement Analytics</span>
        </NavLink>

        {/* GROUP 5: SYSTEM & COMPLIANCE */}
        <div className="nav-group-label">SYSTEM &amp; COMPLIANCE</div>
        <NavLink
          to="/ai-usage"
          id="sidebar-nav-ai-engine"
          data-sidebar-id="sidebar-nav-ai-engine"
          data-nav-id="ai-engine"
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          title={collapsed ? "AI Engine & Quotas" : undefined}
        >
          <FiCpu className="nav-icon" />
          <span>AI Engine &amp; Quotas</span>
        </NavLink>
        <NavLink
          to="/audit-log"
          id="sidebar-nav-audit-compliance"
          data-sidebar-id="sidebar-nav-audit-compliance"
          data-nav-id="audit-compliance"
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          title={collapsed ? "Compliance & Audit Trail" : undefined}
        >
          <FiShield className="nav-icon" />
          <span>Audit &amp; Compliance</span>
        </NavLink>
        <NavLink
          to="/settings"
          id="sidebar-nav-platform-settings"
          data-sidebar-id="sidebar-nav-platform-settings"
          data-nav-id="platform-settings"
          onClick={handleNavClick}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          title={collapsed ? "Platform Settings & Admins" : undefined}
        >
          <FiSettings className="nav-icon" />
          <span>Platform Settings</span>
        </NavLink>
      </nav>

      {/* Footer conforming to Page 1 & 2 Spec */}
      <div className="sidebar-footer">
        {/* Signed in Admin Profile */}
        <div className="user-profile" title={currentUser.email}>
          <div className="avatar">
            {currentUser.name
              ? currentUser.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "RP"}
          </div>
          <div className="user-info">
            <span className="user-name">{currentUser.name || "Rohith P"}</span>
            <span className="user-email-tag">{currentUser.email || "rohith.p@aifagenlabs.com"}</span>
          </div>
        </div>

        <div className="sidebar-footer-controls">
          {/* Light / Dark Mode Switch */}
          <button
            className="theme-toggle-btn"
            id="sidebar-ctrl-theme-toggle"
            data-sidebar-id="sidebar-ctrl-theme-toggle"
            data-action-id="theme-toggle"
            onClick={onToggleTheme}
            aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
            title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
          >
            {darkMode ? <FiSun size={15} /> : <FiMoon size={15} />}
            <span className="theme-toggle-label">{darkMode ? "Light" : "Dark"}</span>
          </button>

          {/* Sign Out Button (Page 1 & 2: ends session immediately) */}
          <button
            className="sign-out-btn"
            id="sidebar-ctrl-sign-out"
            data-sidebar-id="sidebar-ctrl-sign-out"
            data-action-id="sign-out"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out of Admin Portal"
          >
            <FiLogOut size={15} />
            <span className="sign-out-label">Sign out</span>
          </button>

          {/* Collapse Sidebar Button */}
          <button
            className="collapse-btn"
            id="sidebar-ctrl-collapse"
            data-sidebar-id="sidebar-ctrl-collapse"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <BsChevronRight size={15} /> : <BsChevronLeft size={15} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
