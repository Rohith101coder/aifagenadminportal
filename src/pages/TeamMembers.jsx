import { useMemo, useRef, useEffect, useState } from "react";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiPlus,
  FiMoreHorizontal,
  FiShield,
  FiAward,
  FiUsers,
  FiCode,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiX,
  FiCheck,
} from "react-icons/fi";
import {
  initialTeamMembersList,
  bottomAnalytics,
} from "../data/teamData";
import { matchesGlobalSearch } from "../data/globalSearch";
import MemberDetailsDrawer from "../components/MemberDetailsDrawer/MemberDetailsDrawer";
import "./TeamMembers.css";

export default function TeamMembers({ globalSearchTerm = "" }) {
  const [members, setMembers] = useState(initialTeamMembersList);
  const [activeRoleTab, setActiveRoleTab] = useState("All Members");
  const [selectedIds, setSelectedIds] = useState([]);

  // By default, inspection panel is closed until explicitly opened
  const [inspectingMemberId, setInspectingMemberId] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [locFilter, setLocFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState({ field: "name", direction: "asc" });
  const [memberDialog, setMemberDialog] = useState(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [employmentFilter, setEmploymentFilter] = useState("All");
  const [savedViews, setSavedViews] = useState([]);
  const [showSavedViews, setShowSavedViews] = useState(false);
  const [savedViewName, setSavedViewName] = useState("");
  const [notice, setNotice] = useState("");
  const [rowMenuId, setRowMenuId] = useState(null);
  const noticeTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const notify = (message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3500);
  };

  // Filter application
  const filteredMembers = useMemo(() => members.filter((m) => {
    // Top Tabs
    if (
      activeRoleTab !== "All Members" &&
      !(activeRoleTab === "Other" ? m.role === "Other" : m.role.toLowerCase().startsWith(activeRoleTab.toLowerCase().replace("s", "")))
    ) {
      return false;
    }

    // Search query
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.trim().toLowerCase());

    // Dropdowns
    const matchRole = roleFilter === "All" ? true : m.role === roleFilter;
    const matchStatus =
      statusFilter === "All" ? true : m.status === statusFilter;
    const matchDept = deptFilter === "All" ? true : m.department === deptFilter;
    const matchLoc =
      locFilter === "All" ? true : m.location.includes(locFilter);

    const matchEmployment = employmentFilter === "All" || m.employmentType === employmentFilter;
    return matchSearch && matchesGlobalSearch(m, globalSearchTerm) && matchRole && matchStatus && matchDept && matchLoc && matchEmployment;
  }), [members, activeRoleTab, searchQuery, globalSearchTerm, roleFilter, statusFilter, deptFilter, locFilter, employmentFilter]);

  const sortedMembers = useMemo(() => {
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...filteredMembers].sort((a, b) => String(a[sort.field] ?? "").localeCompare(String(b[sort.field] ?? ""), undefined, { numeric: true }) * factor);
  }, [filteredMembers, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedMembers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageMembers = sortedMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageSelected = pageMembers.length > 0 && pageMembers.every((member) => selectedIds.includes(member.id));
  const selectedMembers = members.filter((member) => selectedIds.includes(member.id));
  const roleCounts = ["Admin", "Manager", "Recruiter", "Developer", "Other"].reduce((counts, role) => {
    counts[role] = members.filter((member) => member.role === role).length;
    return counts;
  }, {});

  const activeInspectedMember =
    sortedMembers.find((m) => m.id === inspectingMemberId) || null;
  const currentInspectIndex = sortedMembers.findIndex(
    (m) => m.id === inspectingMemberId,
  );

  // Selection Checkboxes
  const handleSelectAll = (e) => {
    setSelectedIds((current) => e.target.checked
      ? [...new Set([...current, ...pageMembers.map((member) => member.id)])]
      : current.filter((id) => !pageMembers.some((member) => member.id === id)));
  };

  const handleSelectOne = (id) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  // Next / Prev Drawer Navigation
  const handleNextMember = () => {
    if (currentInspectIndex >= 0 && currentInspectIndex < sortedMembers.length - 1) {
      setInspectingMemberId(sortedMembers[currentInspectIndex + 1].id);
    }
  };

  const handlePrevMember = () => {
    if (currentInspectIndex > 0) {
      setInspectingMemberId(sortedMembers[currentInspectIndex - 1].id);
    }
  };

  // Actions
  const handleInviteMember = (member = null) => setMemberDialog(member ? { ...member } : {
    name: "", email: "", title: "", role: "Recruiter", department: "Recruitment",
    location: "Remote", status: "Invited", employmentType: "Full-time",
    manager: "Rohith P", managerInitials: "RP", avatarBg: "#dbeafe",
  });

  const saveMember = (event) => {
    event.preventDefault();
    if (!memberDialog?.name.trim() || !memberDialog?.email.trim()) return;
    const roleClass = memberDialog.role.toLowerCase().replace(/\s+/g, "-");
    const member = {
      ...memberDialog,
      id: memberDialog.id || `tm-${Date.now()}`,
      initials: memberDialog.name.split(/\s+/).map((part) => part[0]).join("").toUpperCase(),
      roleClass,
      locationFull: memberDialog.location,
      timeLocal: "Local time not configured",
      jobsHandled: memberDialog.jobsHandled ?? null,
      successRate: memberDialog.successRate ?? null,
      avgTime: memberDialog.avgTime ?? null,
      lastActive: memberDialog.lastActive || "Invitation pending",
      memberSince: memberDialog.memberSince || "Pending invitation",
      accessLevel: memberDialog.accessLevel || `${memberDialog.role} (standard)`,
      managerInitials: memberDialog.managerInitials || "RP",
      kpis: memberDialog.kpis || null,
      activities: memberDialog.activities || [],
    };
    setMembers((current) => memberDialog.id
      ? current.map((item) => item.id === member.id ? member : item)
      : [member, ...current]);
    setPage(1);
    notify(memberDialog.id ? `Updated ${member.name}'s profile.` : `Invitation prepared for ${member.email}. Connect an email service to dispatch invites.`);
    setMemberDialog(null);
  };

  const handleRemoveAccess = (m) => {
    if (window.confirm(`Revoke all platform access for ${m.name}?`)) {
      setMembers((current) => current.filter((item) => item.id !== m.id));
      setInspectingMemberId(null);
      setSelectedIds((current) => current.filter((id) => id !== m.id));
      notify(`Access removed for ${m.name}.`);
    }
  };

  const handleSendMessage = (m) => {
    window.location.href = `mailto:${m.email}?subject=${encodeURIComponent("Team message")}`;
  };

  const handleResetPassword = (m) => {
    notify(`Password reset requested for ${m.email}. No identity provider is connected, so no link was sent.`);
  };

  const applyBulkStatus = (status) => {
    setMembers((current) => current.map((member) => selectedIds.includes(member.id) ? { ...member, status } : member));
    notify(`Updated status for ${selectedIds.length} team member(s).`);
    setSelectedIds([]);
  };

  const setMemberStatus = (member, status) => {
    setMembers((current) => current.map((item) => item.id === member.id ? { ...item, status } : item));
    notify(`${member.name} is now ${status.toLowerCase()}.`);
  };

  const exportMembers = (rows = sortedMembers) => {
    const fields = ["name", "email", "role", "department", "location", "status", "employmentType", "manager"];
    const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [fields.join(","), ...rows.map((member) => fields.map((field) => quote(member[field])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "team-members.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(`Exported ${rows.length} team member(s).`);
  };

  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const toggleSort = (field) => {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setActiveRoleTab("All Members");
    setSearchQuery("");
    setRoleFilter("All");
    setStatusFilter("All");
    setDeptFilter("All");
    setLocFilter("All");
    setEmploymentFilter("All");
    setPage(1);
  };

  const saveCurrentView = (event) => {
    event.preventDefault();
    if (!savedViewName.trim()) return;
    setSavedViews((current) => [...current, {
      name: savedViewName.trim(), activeRoleTab, searchQuery, roleFilter,
      statusFilter, deptFilter, locFilter, employmentFilter,
    }]);
    setSavedViewName("");
    notify("Saved the current member view.");
  };

  const applySavedView = (view) => {
    setActiveRoleTab(view.activeRoleTab);
    setSearchQuery(view.searchQuery);
    setRoleFilter(view.roleFilter);
    setStatusFilter(view.statusFilter);
    setDeptFilter(view.deptFilter);
    setLocFilter(view.locFilter);
    setEmploymentFilter(view.employmentFilter);
    setPage(1);
    setShowSavedViews(false);
  };

  const renderKpiIcon = (type) => {
    switch (type) {
      case "shield":
        return <FiShield size={16} />;
      case "crown":
        return <FiAward size={16} />;
      case "users":
        return <FiUsers size={16} />;
      case "code":
        return <FiCode size={16} />;
      case "user":
        return <FiUser size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="team-page-layout">
      <div className="team-main-content">
        {/* Header Row */}
        <div className="team-header-row">
          <div>
            <h1 className="team-page-title">
              Team Members <span className="title-count-pill">· {members.length}</span>
            </h1>
            <p className="team-page-subtitle">
              Manage team members, roles, permissions and performance.
            </p>
          </div>

          <div className="header-actions">
            <button className="btn-invite-member" onClick={() => handleInviteMember()}>
              <FiPlus size={15} />
              <span>Invite Member</span>
            </button>
          </div>
        </div>

        {/* 5 Top Overview KPI Cards */}
        <div className="team-kpis-grid">
          {[
            { role: "Admins", count: roleCounts.Admin, iconType: "shield", iconColor: "#2563eb", iconBg: "#eff6ff" },
            { role: "Managers", count: roleCounts.Manager, iconType: "crown", iconColor: "#d97706", iconBg: "#fffbeb" },
            { role: "Recruiters", count: roleCounts.Recruiter, iconType: "users", iconColor: "#0284c7", iconBg: "#f0f9ff" },
            { role: "Developers", count: roleCounts.Developer, iconType: "code", iconColor: "#7c3aed", iconBg: "#f5f3ff" },
            { role: "Other Employees", count: roleCounts.Other, iconType: "user", iconColor: "#9333ea", iconBg: "#faf5ff" },
          ].map((kpi, idx) => (
            <div key={idx} className="team-kpi-card">
              <div
                className="kpi-icon-box"
                style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}
              >
                {renderKpiIcon(kpi.iconType)}
              </div>
              <div className="kpi-content-stack">
                <span className="kpi-role-label">{kpi.role}</span>
                <span className="kpi-count-big">{kpi.count}</span>
                <span className="kpi-pct-sub">{members.length ? `${((kpi.count / members.length) * 100).toFixed(1)}% of team` : "0% of team"}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Category Tabs Toolbar */}
        <div className="team-nav-tabs-bar">
          <div className="tabs-cluster">
            {[
              { label: "All Members", count: members.length },
              { label: "Admins", count: roleCounts.Admin },
              { label: "Managers", count: roleCounts.Manager },
              { label: "Recruiters", count: roleCounts.Recruiter },
              { label: "Developers", count: roleCounts.Developer },
              { label: "Other", count: roleCounts.Other },
            ].map((tab) => (
              <button
                key={tab.label}
                className={`tab-btn-pill ${activeRoleTab === tab.label ? "active" : ""}`}
                onClick={() => updateFilter(setActiveRoleTab, tab.label)}
              >
                <span>{tab.label}</span>
                <span className="count-tag">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="tabs-right-actions">
            <button
              className="btn-saved-views-pill"
              onClick={() => setShowSavedViews((shown) => !shown)}
            >
              <span>Saved Views</span>
              <FiChevronDown size={11} />
            </button>
            <button className="btn-tab-more" title="Export team members" aria-label="Export team members" onClick={() => exportMembers()}>
              <FiDownload size={14} />
            </button>
          </div>
        </div>

        {/* Search & Multi-Criteria Filter Bar */}
        <div className="team-table-card">
          <div className="table-filter-controls-row">
            <div className="search-input-wrapper">
              <FiSearch className="search-icon-svg" />
              <input
                type="text"
                placeholder="Search by name, email or role..."
                value={searchQuery}
                onChange={(e) => updateFilter(setSearchQuery, e.target.value)}
              />
            </div>

            <div className="select-dropdowns-group">
              <select
                className="filter-select-input"
                value={roleFilter}
                onChange={(e) => updateFilter(setRoleFilter, e.target.value)}
              >
                <option value="All">Role</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Recruiter">Recruiter</option>
                <option value="Developer">Developer</option>
                <option value="Other">Other</option>
              </select>

              <select
                className="filter-select-input"
                value={statusFilter}
                onChange={(e) => updateFilter(setStatusFilter, e.target.value)}
              >
                <option value="All">Status</option>
                {[...new Set(members.map((member) => member.status).filter(Boolean))].map((status) => <option key={status}>{status}</option>)}
              </select>

              <select
                className="filter-select-input"
                value={deptFilter}
                onChange={(e) => updateFilter(setDeptFilter, e.target.value)}
              >
                <option value="All">Department</option>
                {[...new Set(members.map((member) => member.department).filter(Boolean))].sort().map((department) => <option key={department}>{department}</option>)}
              </select>

              <select
                className="filter-select-input"
                value={locFilter}
                onChange={(e) => updateFilter(setLocFilter, e.target.value)}
              >
                <option value="All">Location</option>
                {[...new Set(members.map((member) => member.location).filter(Boolean))].sort().map((location) => <option key={location} value={location}>{location}</option>)}
              </select>

              <button
                className="btn-more-filters"
                onClick={() => setShowMoreFilters((shown) => !shown)}
              >
                <FiFilter size={12} />
                <span>More filters</span>
              </button>
            </div>
          </div>

          {showMoreFilters && <div className="team-advanced-filters">
            <label>Employment type
              <select value={employmentFilter} onChange={(event) => updateFilter(setEmploymentFilter, event.target.value)}>
                <option value="All">All employment types</option>
                {[...new Set(members.map((member) => member.employmentType).filter(Boolean))].map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <button type="button" onClick={clearFilters}>Clear filters</button>
          </div>}

          {showSavedViews && <div className="team-saved-views-popover">
            <strong>Saved views</strong>
            {!savedViews.length && <span className="team-muted">No saved views yet.</span>}
            {savedViews.map((view, index) => <button key={`${view.name}-${index}`} onClick={() => applySavedView(view)}>{view.name}</button>)}
            <form onSubmit={saveCurrentView}>
              <input aria-label="Saved view name" placeholder="View name" value={savedViewName} onChange={(event) => setSavedViewName(event.target.value)} required />
              <button type="submit">Save current filters</button>
            </form>
          </div>}

          {selectedIds.length > 0 && <div className="team-selection-toolbar">
            <strong>{selectedIds.length} selected</strong>
            <button onClick={() => applyBulkStatus("Active")}>Set active</button>
            <button onClick={() => applyBulkStatus("Away")}>Set away</button>
            <button onClick={() => exportMembers(selectedMembers)}><FiDownload size={13} /> Export selected</button>
            <button className="clear-selection" onClick={() => setSelectedIds([])} aria-label="Clear selection"><FiX size={14} /></button>
          </div>}

          {/* Table Container */}
          <div className="table-responsive-scroll">
            <table className="team-data-table">
              <thead>
                <tr>
                  <th style={{ width: "38px" }}>
                    <input
                      type="checkbox"
                      className="table-checkbox"
                      checked={pageSelected}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th><button className="team-sort-button" onClick={() => toggleSort("name")}>Name {sort.field === "name" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th><button className="team-sort-button" onClick={() => toggleSort("role")}>Role {sort.field === "role" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th><button className="team-sort-button" onClick={() => toggleSort("department")}>Department {sort.field === "department" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th><button className="team-sort-button" onClick={() => toggleSort("location")}>Location {sort.field === "location" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th><button className="team-sort-button" onClick={() => toggleSort("jobsHandled")}>Jobs Handled {sort.field === "jobsHandled" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th><button className="team-sort-button" onClick={() => toggleSort("successRate")}>Success Rate {sort.field === "successRate" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th>Avg. Time</th>
                  <th><button className="team-sort-button" onClick={() => toggleSort("lastActive")}>Last Active {sort.field === "lastActive" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th><button className="team-sort-button" onClick={() => toggleSort("status")}>Status {sort.field === "status" ? (sort.direction === "asc" ? "↑" : "↓") : ""}</button></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageMembers.map((member) => {
                  const isChecked = selectedIds.includes(member.id);
                  const isInspected = inspectingMemberId === member.id;

                  return (
                    <tr
                      key={member.id}
                      className={`member-table-row ${isInspected ? "inspected-active" : ""}`}
                      onClick={() => setInspectingMemberId(member.id)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(member.id)}
                        />
                      </td>

                      <td>
                        <div className="user-profile-meta-cell">
                          <div
                            className="member-avatar-chip"
                            style={{ backgroundColor: member.avatarBg }}
                          >
                            {member.initials}
                          </div>
                          <div className="name-email-stack">
                            <span className="member-full-name">
                              {member.name}
                            </span>
                            <span className="member-email-addr">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`role-badge ${member.roleClass}`}>
                          {member.role}
                        </span>
                      </td>

                      <td className="dept-cell">{member.department}</td>
                      <td className="loc-cell">{member.location}</td>

                      <td className="metric-val-cell">
                        {member.jobsHandled !== null ? member.jobsHandled : "—"}
                      </td>

                      <td>
                        {member.successRate !== null ? (
                          <div className="progress-rate-cell">
                            <span className="rate-number-bold">
                              {member.successRate}%
                            </span>
                            <div className="rate-track">
                              <div
                                className="rate-fill"
                                style={{ width: `${member.successRate}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="metric-val-cell">
                        {member.avgTime !== null ? member.avgTime : "—"}
                      </td>

                      <td className="last-active-cell">{member.lastActive}</td>

                      <td>
                        <span
                          className={`status-pill ${member.status.toLowerCase()}`}
                        >
                          {member.status}
                        </span>
                      </td>

                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-options-more"
                          aria-label={`Actions for ${member.name}`}
                          onClick={() => setRowMenuId((id) => id === member.id ? null : member.id)}
                        >
                          <FiMoreHorizontal size={14} />
                        </button>
                        {rowMenuId === member.id && <div className="team-row-menu">
                          <button onClick={() => { setInspectingMemberId(member.id); setRowMenuId(null); }}>View details</button>
                          <button onClick={() => { handleInviteMember(member); setRowMenuId(null); }}>Edit member</button>
                          <button onClick={() => { handleSendMessage(member); setRowMenuId(null); }}>Send email</button>
                          <button onClick={() => { setMemberStatus(member, member.status === "Active" ? "Away" : "Active"); setRowMenuId(null); }}>Set {member.status === "Active" ? "away" : "active"}</button>
                          <button className="danger" onClick={() => { handleRemoveAccess(member); setRowMenuId(null); }}>Remove access</button>
                        </div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Pagination Bar */}
          <div className="team-table-footer">
            <span className="showing-entries-label">
              Showing {sortedMembers.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, sortedMembers.length)} of {sortedMembers.length} members
            </span>

            <div className="footer-pagination-cluster">
              <button className="page-nav-arrow" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} aria-label="Previous page">
                <FiChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} className={`page-number-box ${pageNumber === currentPage ? "active" : ""}`} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}
              <button className="page-nav-arrow" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(value + 1, totalPages))} aria-label="Next page">
                <FiChevronRight size={13} />
              </button>

              <label className="per-page-select-box">Rows
                <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                  {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            </div>
          </div>
          {!pageMembers.length && <div className="team-empty-state"><strong>No team members found</strong><span>Adjust the filters or search terms and try again.</span><button onClick={clearFilters}>Clear filters</button></div>}
        </div>

        {/* Bottom Analytics Tri-Card Row */}
        <div className="team-analytics-bottom-row">
          {/* Card 1: Team Performance Chart */}
          <div className="analytics-card flex-2">
            <div className="card-top-header-row">
              <span className="analytics-title-bold">Team Performance</span>
              <div className="chart-legend-controls">
                <div className="legend-items-list">
                  <span className="legend-entry">
                    <span className="legend-box blue"></span> Jobs added
                  </span>
                  <span className="legend-entry">
                    <span className="legend-box lightblue"></span> Successful
                    hires
                  </span>
                </div>
                <div className="daily-dropdown-pill">Daily</div>
              </div>
            </div>

            <div className="performance-chart-canvas">
              <div className="y-axis-ticks">
                <span>200</span>
                <span>150</span>
                <span>100</span>
                <span>50</span>
                <span>0</span>
              </div>

              <div className="bars-track-area">
                <div className="bars-track-flex">
                  {bottomAnalytics.performanceBars.map((bar, i) => (
                    <div key={i} className="bar-dual-col">
                      <div className="dual-sticks">
                        <div
                          className="stick added"
                          style={{ height: `${(bar.added / 200) * 100}%` }}
                        ></div>
                        <div
                          className="stick hired"
                          style={{ height: `${(bar.hired / 200) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="x-axis-dates">
                  <span>Sep 12</span>
                  <span>Sep 17</span>
                  <span>Sep 22</span>
                  <span>Sep 27</span>
                  <span>Oct 2</span>
                  <span>Oct 7</span>
                  <span>Oct 12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Jobs by Team Member (Top 5) */}
          <div className="analytics-card flex-1">
            <div className="card-top-header-row">
              <span className="analytics-title-bold">
                Jobs by Team Member (Top 5)
              </span>
            </div>

            <div className="top-performers-list">
              {bottomAnalytics.topPerformers.map((p, idx) => (
                <div key={idx} className="performer-row-entry">
                  <div className="performer-labels-line">
                    <span className="p-name">{p.name}</span>
                    <span className="p-count">{p.count}</span>
                  </div>
                  <div className="horizontal-track">
                    <div
                      className="horizontal-bar-fill"
                      style={{ width: `${p.pctWidth}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Success Rate by Role */}
          <div className="analytics-card flex-1">
            <div className="card-top-header-row">
              <span className="analytics-title-bold">Success Rate by Role</span>
            </div>

            <div className="role-rates-list">
              {bottomAnalytics.successRateByRole.map((r, idx) => (
                <div key={idx} className="role-rate-row">
                  <div className="role-rate-labels">
                    <span className="r-name">{r.role}</span>
                    <span className="r-rate">{r.rate}</span>
                  </div>
                  <div className="horizontal-track">
                    <div
                      className="horizontal-bar-fill purple"
                      style={{ width: `${r.width}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* On-Demand Right Drawer (Opens only when a member row is clicked) */}
      {activeInspectedMember && (
        <MemberDetailsDrawer
          member={activeInspectedMember}
          currentIndex={currentInspectIndex}
          totalCount={filteredMembers.length}
          onNext={handleNextMember}
          onPrev={handlePrevMember}
          onClose={() => setInspectingMemberId(null)}
          onSendMessage={handleSendMessage}
          onResetPassword={handleResetPassword}
          onRemoveAccess={handleRemoveAccess}
          onEditMember={handleInviteMember}
          onNotify={notify}
        />
      )}
      {memberDialog && <div className="team-dialog-backdrop" onClick={() => setMemberDialog(null)}>
        <form className="team-member-dialog" onSubmit={saveMember} onClick={(event) => event.stopPropagation()}>
          <h2>{memberDialog.id ? "Edit team member" : "Invite team member"}</h2>
          <p>{memberDialog.id ? "Update member profile and access details." : "Add a member record and prepare an invitation. Email delivery requires an email integration."}</p>
          <label>Full name<input autoFocus required value={memberDialog.name} onChange={(event) => setMemberDialog((current) => ({ ...current, name: event.target.value }))} /></label>
          <label>Email address<input type="email" required value={memberDialog.email} onChange={(event) => setMemberDialog((current) => ({ ...current, email: event.target.value }))} /></label>
          <label>Job title<input required value={memberDialog.title || ""} onChange={(event) => setMemberDialog((current) => ({ ...current, title: event.target.value }))} /></label>
          <label>Role<select value={memberDialog.role} onChange={(event) => setMemberDialog((current) => ({ ...current, role: event.target.value, accessLevel: `${event.target.value} (standard)` }))}>
            {["Admin", "Manager", "Recruiter", "Developer", "Other"].map((role) => <option key={role}>{role}</option>)}
          </select></label>
          <label>Department<input value={memberDialog.department || ""} onChange={(event) => setMemberDialog((current) => ({ ...current, department: event.target.value }))} /></label>
          <label>Location<input value={memberDialog.location || ""} onChange={(event) => setMemberDialog((current) => ({ ...current, location: event.target.value }))} /></label>
          <label>Employment type<select value={memberDialog.employmentType || "Full-time"} onChange={(event) => setMemberDialog((current) => ({ ...current, employmentType: event.target.value }))}>
            {["Full-time", "Part-time", "Contract", "Intern"].map((type) => <option key={type}>{type}</option>)}
          </select></label>
          {memberDialog.id && <label>Status<select value={memberDialog.status} onChange={(event) => setMemberDialog((current) => ({ ...current, status: event.target.value }))}><option>Active</option><option>Away</option><option>Invited</option></select></label>}
          <div className="team-dialog-actions"><button type="button" onClick={() => setMemberDialog(null)}>Cancel</button><button className="primary" type="submit">{memberDialog.id ? "Save changes" : "Add member"}</button></div>
        </form>
      </div>}
      {notice && <div className="team-toast" role="status"><FiCheck size={15} />{notice}</div>}
    </div>
  );
}
