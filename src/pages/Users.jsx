import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiDownload,
  FiPlus,
  FiX,
  FiColumns,
  FiMoreVertical,
  FiMoreHorizontal,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiAward,
  FiPercent,
  FiCpu,
} from "react-icons/fi";
import {
  userStatsData,
  initialUsersList,
  AREAS_OF_INTEREST,
  VALID_PLANS,
  VALID_PLAN_STATUSES,
} from "../data/usersData";
import { matchesGlobalSearch } from "../data/globalSearch";
import { logAuditAction } from "../data/auditLogData";
import UserDetailsDrawer from "../components/UserDetailsDrawer/UserDetailsDrawer";
import BulkActionBar from "../components/BulkActionBar/BulkActionBar";
import "./Users.css";

const defaultVisibleColumns = [
  "User",
  "Mobile",
  "Area of Interest",
  "Plan",
  "Status",
  "AI Use (30d)",
  "Join Date",
  "Actions",
];

const allAvailableColumns = [
  "User",
  "Mobile",
  "Area of Interest",
  "Plan",
  "Status",
  "Subscription Status",
  "AI Use (30d)",
  "Join Date",
  "Last Active",
  "Actions",
];

export default function Users({ globalSearchTerm = "" }) {
  const [users, setUsers] = useState(initialUsersList);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [activeUserDetail, setActiveUserDetail] = useState(null);
  const [planDropdown, setPlanDropdown] = useState("All");
  const [accountStatusDropdown, setAccountStatusDropdown] = useState("All");
  const [subscriptionDropdown, setSubscriptionDropdown] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [interestFilter, setInterestFilter] = useState("All");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showSavedViews, setShowSavedViews] = useState(false);
  const [savedViews, setSavedViews] = useState([]);
  const [viewName, setViewName] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);
  const [showColumns, setShowColumns] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [rowMenuId, setRowMenuId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(null);
  const [remindedUserIds, setRemindedUserIds] = useState([]);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return users
      .filter((user) => {
        const matchesSearch =
          !normalizedSearch ||
          [user.name, user.email, user.phone, user.areaOfInterest]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedSearch));
        return (
          matchesSearch &&
          matchesGlobalSearch(user, globalSearchTerm) &&
          (planDropdown === "All" || user.plan === planDropdown) &&
          (accountStatusDropdown === "All" ||
            user.accountStatus === accountStatusDropdown) &&
          (subscriptionDropdown === "All" ||
            user.subscriptionStatus === subscriptionDropdown) &&
          (locationFilter === "All" || user.location === locationFilter) &&
          (interestFilter === "All" ||
            user.areaOfInterest === interestFilter)
        );
      })
      .sort((first, second) => {
        const dateDifference =
          new Date(first.joinDate || first.joinedDate).getTime() -
          new Date(second.joinDate || second.joinedDate).getTime();
        return sortNewestFirst ? -dateDifference : dateDifference;
      });
  }, [
    users,
    searchTerm,
    globalSearchTerm,
    planDropdown,
    accountStatusDropdown,
    subscriptionDropdown,
    locationFilter,
    interestFilter,
    sortNewestFirst,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const selectedVisibleCount = pageUsers.filter((user) =>
    selectedUserIds.includes(user.id),
  ).length;
  const allVisibleSelected =
    pageUsers.length > 0 && selectedVisibleCount === pageUsers.length;
  const payingUsers = users.filter(
    (user) =>
      user.accountStatus === "Active" &&
      user.plan !== "None" &&
      user.subscriptionStatus === "Active",
  );
  const monthlyRevenue = users.reduce((total, user) => {
    if (
      user.accountStatus !== "Active" ||
      user.subscriptionStatus !== "Active"
    ) return total;
    return total + (user.plan === "Premium" ? 1299 : user.plan === "Basic" ? 189 : 0);
  }, 0);
  const stats = userStatsData.map((stat) => ({
    ...stat,
    value:
      stat.title === "Total Users"
        ? users.length.toLocaleString()
        : stat.title === "Paying Users"
          ? payingUsers.length.toLocaleString()
          : stat.title === "Conversion Rate"
            ? `${users.length ? ((payingUsers.length / users.length) * 100).toFixed(1) : "0.0"}%`
            : stat.title === "Monthly Recurring Revenue"
              ? `$${monthlyRevenue.toLocaleString("en-US")}.00`
              : stat.value,
  }));

  const handleSelectOne = (id) => {
    setSelectedUserIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const handleSelectAll = () => {
    setSelectedUserIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !pageUsers.some((user) => user.id === id))
        : [...new Set([...current, ...pageUsers.map((user) => user.id)])],
    );
  };

  const handleInspectUser = (user) => {
    setActiveUserDetail(user);
    setRowMenuId(null);
  };

  const handleClearAllFilters = () => {
    setPlanDropdown("All");
    setAccountStatusDropdown("All");
    setSubscriptionDropdown("All");
    setLocationFilter("All");
    setInterestFilter("All");
    setSearchTerm("");
    setPage(1);
  };

  const updateSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const openDialog = (type, userIds = []) => {
    const user = userIds.length === 1
      ? users.find((item) => item.id === userIds[0])
      : null;

    if (type === "edit" && user) {
      setFormValues({
        firstName: user.firstName || user.name.split(" ")[0] || "",
        lastName: user.lastName || user.name.split(" ").slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phone || "",
        areaOfInterest: user.areaOfInterest || AREAS_OF_INTEREST[0],
        headline: user.headline || "",
        location: user.location || "",
        auditReason: "Admin verified candidate details",
      });
    } else if (type === "plan" && user) {
      setFormValues({
        plan: user.plan || "Basic",
        status: user.subscriptionStatus || "Active",
        planReason: "Candidate retainer package adjusted by admin",
      });
    } else {
      setFormValues(user ? { ...user } : { plan: "Basic", status: "Active", areaOfInterest: AREAS_OF_INTEREST[0] });
    }

    setDialog({ type, userIds });
  };

  const notify = (message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3500);
  };

  const updateUsers = (ids, updater) => {
    setUsers((current) =>
      current.map((user) => (ids.includes(user.id) ? updater(user) : user)),
    );
    if (activeUserDetail && ids.includes(activeUserDetail.id)) {
      setActiveUserDetail((current) => updater(current));
    }
  };

  const submitDialog = (event) => {
    event.preventDefault();

    if (dialog.type === "invite") {
      const name = formValues.name?.trim();
      const email = formValues.email?.trim();
      if (!name || !email) return;
      const user = {
        id: Date.now(),
        name,
        email,
        phone: formValues.phone?.trim() || "Not provided",
        initials: name
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        plan: formValues.plan || "None",
        accountStatus: "Active",
        subscriptionStatus: formValues.plan === "None" ? "Inactive" : "Active",
        areaOfInterest: formValues.areaOfInterest || AREAS_OF_INTEREST[0],
        joinDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        joinedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        lastActive: "Just invited",
        location: formValues.location || "US Wide",
        headline: "Prospective Candidate",
        aiCalls: 0,
        aiUse30Days: 0,
        resumes: [],
        applications: [],
        savedJobsList: [],
        activities: [],
      };
      setUsers((current) => [user, ...current]);
      setPage(1);
      setDialog(null);

      logAuditAction({
        category: "Admin changes",
        eventTitle: "Candidate invited",
        eventSummary: `Invited new candidate: ${name} (${email})`,
        targetName: name,
        targetType: "User",
        targetId: `usr_${user.id}`,
        field: "invite",
        previousValue: "None",
        newValue: user.plan,
        reason: "Admin added candidate to marketing roster",
      });

      notify(`${name} was invited.`);
      return;
    }

    if (dialog.type === "edit") {
      const { firstName, lastName, email, phone, areaOfInterest, headline, location, auditReason } = formValues;
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (!fullName || !email?.trim()) return;

      const targetId = dialog.userIds[0];
      const previousUser = users.find((u) => u.id === targetId);

      updateUsers(dialog.userIds, (user) => ({
        ...user,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: fullName,
        email: email.trim(),
        phone: phone.trim(),
        areaOfInterest: areaOfInterest || user.areaOfInterest,
        headline: headline.trim(),
        location: location.trim(),
        initials: fullName
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      }));

      logAuditAction({
        category: "Profile edits",
        eventTitle: "Candidate profile edited",
        eventSummary: `Updated profile for ${fullName} (${email})`,
        targetName: fullName,
        targetType: "User",
        targetId: `usr_${targetId}`,
        field: "profile_fields",
        previousValue: previousUser ? `${previousUser.name} | ${previousUser.areaOfInterest}` : "-",
        newValue: `${fullName} | ${areaOfInterest}`,
        reason: auditReason || "Admin updated candidate details",
      });

      setDialog(null);
      notify("Candidate profile updated & logged to audit log.");
      return;
    }

    if (dialog.type === "plan") {
      const { plan, status, planReason } = formValues;
      const targetUser = users.find((u) => u.id === dialog.userIds[0]);

      updateUsers(dialog.userIds, (user) => ({
        ...user,
        plan,
        subscriptionStatus: status || (plan === "None" ? "Inactive" : "Active"),
        accountStatus: status === "Cancelled" ? "Inactive" : user.accountStatus,
      }));

      logAuditAction({
        category: "Plan changes",
        eventTitle: "Candidate plan changed",
        eventSummary: `Changed plan tier: ${targetUser?.plan || "-"} → ${plan} (Status: ${status || "Active"})`,
        targetName: targetUser?.name || "Candidate",
        targetType: "User",
        targetId: `usr_${dialog.userIds[0]}`,
        field: "plan & status",
        previousValue: `${targetUser?.plan || "None"} (${targetUser?.subscriptionStatus || "Inactive"})`,
        newValue: `${plan} (${status || "Active"})`,
        reason: planReason || "Candidate changed service package",
      });

      setDialog(null);
      notify(`Plan updated for ${dialog.userIds.length} candidate(s).`);
      return;
    }

    if (dialog.type === "suspend") {
      updateUsers(dialog.userIds, (user) => ({
        ...user,
        accountStatus: "Suspended",
      }));
      setDialog(null);
      notify(`Suspended ${dialog.userIds.length} user(s).`);
    }
  };

  const sendReminders = (ids) => {
    setRemindedUserIds((current) => [...new Set([...current, ...ids])]);
    notify(`Payment reminder queued for ${ids.length} user(s).`);
  };

  const exportUsers = (usersToExport = filteredUsers) => {
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const columns = [
      ["Name", "name"],
      ["Email", "email"],
      ["Mobile", "phone"],
      ["Area of Interest", "areaOfInterest"],
      ["Plan", "plan"],
      ["Account Status", "accountStatus"],
      ["Subscription Status", "subscriptionStatus"],
      ["AI Use 30d", "aiUse30Days"],
      ["Join Date", "joinDate"],
      ["Last Active", "lastActive"],
    ];
    const csv = [
      columns.map(([label]) => escapeCsv(label)).join(","),
      ...usersToExport.map((user) =>
        columns.map(([, key]) => escapeCsv(user[key] || user[key === "aiUse30Days" ? "aiCalls" : key] || "")).join(","),
      ),
    ].join("\r\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `aifagen-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link);
    notify(`Exported ${usersToExport.length} candidate record(s) to CSV.`);
  };

  const saveCurrentView = (event) => {
    event.preventDefault();
    if (!viewName.trim()) return;
    setSavedViews((current) => [
      ...current,
      {
        name: viewName.trim(),
        searchTerm,
        planDropdown,
        accountStatusDropdown,
        subscriptionDropdown,
        locationFilter,
        interestFilter,
      },
    ]);
    setViewName("");
    setShowSavedViews(false);
    notify("Current view saved.");
  };

  const applySavedView = (view) => {
    setSearchTerm(view.searchTerm || "");
    setPlanDropdown(view.planDropdown || "All");
    setAccountStatusDropdown(view.accountStatusDropdown || "All");
    setSubscriptionDropdown(view.subscriptionDropdown || "All");
    setLocationFilter(view.locationFilter || "All");
    setInterestFilter(view.interestFilter || "All");
    setPage(1);
    setShowSavedViews(false);
    notify(`Applied saved view "${view.name}".`);
  };

  const renderStatIcon = (type) => {
    switch (type) {
      case "users":
        return <FiUsers size={18} />;
      case "paying":
        return <FiAward size={18} />;
      case "rate":
        return <FiPercent size={16} />;
      case "mrr":
        return <span style={{ fontWeight: 800, fontSize: "16px" }}>$</span>;
      default:
        return null;
    }
  };

  return (
    <div className="users-page-layout">
      <div className="users-main-content">
        {/* Top Header Row */}
        <div className="users-header-row">
          <div className="title-area">
            <h1 className="users-heading">
              Candidate Roster <span className="title-count">· {users.length.toLocaleString()}</span>
            </h1>
            <p className="users-caption">
              View and manage candidate accounts, US placement retainers, ATS profiles, and subscription status.
            </p>
          </div>

          <div className="header-action-btns">
            <button className="export-btn" onClick={() => exportUsers()}>
              <FiDownload size={14} />
              <span>Export CSV</span>
              <FiChevronDown size={13} />
            </button>
            <button className="invite-btn" onClick={() => openDialog("invite")}>
              <FiPlus size={15} />
              <span>Invite Candidate</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="users-stat-cards-grid">
          {stats.map((stat, i) => (
            <div key={i} className="user-metric-card">
              <div className="metric-top">
                <div
                  className="metric-icon"
                  style={{
                    backgroundColor: stat.iconBg,
                    color: stat.iconColor,
                  }}
                >
                  {renderStatIcon(stat.iconType)}
                </div>
                <div className="metric-title-wrap">
                  <span className="metric-title">{stat.title}</span>
                  <FiInfo size={12} className="info-icon" />
                </div>
              </div>
              <div className="metric-number">{stat.value}</div>
              <div className="metric-trend-row">
                <span className={`metric-trend ${stat.changeType}`}>
                  {stat.changeType === "up" ? (
                    <FiTrendingUp />
                  ) : (
                    <FiTrendingDown />
                  )}
                  {stat.change}
                </span>
                <span className="metric-period">{stat.trendPeriod}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="table-controls-card">
          <div className="filter-controls-row">
            <div className="search-bar-inline">
              <FiSearch className="search-icon-left" />
              <input
                type="text"
                placeholder="Search by name, email, mobile, or area of interest..."
                value={searchTerm}
                onChange={(e) => updateSearch(e.target.value)}
              />
            </div>

            <div className="dropdown-filter-group">
              <label className="filter-dropdown">
                <span>Plan</span>
                <select value={planDropdown} onChange={(e) => { setPlanDropdown(e.target.value); setPage(1); }} aria-label="Filter by plan">
                  <option value="All">All Plans</option>
                  {VALID_PLANS.map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>

              <label className="filter-dropdown">
                <span>Status</span>
                <select value={accountStatusDropdown} onChange={(e) => { setAccountStatusDropdown(e.target.value); setPage(1); }} aria-label="Filter by account status">
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </label>

              <label className="filter-dropdown">
                <span>Subscription</span>
                <select value={subscriptionDropdown} onChange={(e) => { setSubscriptionDropdown(e.target.value); setPage(1); }} aria-label="Filter by subscription status">
                  <option value="All">All Subscriptions</option>
                  {VALID_PLAN_STATUSES.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>

              <button className="more-filters-btn" onClick={() => setShowMoreFilters((visible) => !visible)} aria-expanded={showMoreFilters}>
                <FiFilter size={13} />
                <span>More filters</span>
                <FiChevronDown size={13} />
              </button>

              <button className="save-view-btn" onClick={() => setShowSavedViews((visible) => !visible)} aria-expanded={showSavedViews}>
                <span>Saved views</span>
                <FiChevronDown size={13} />
              </button>
            </div>
          </div>

          {/* Active Filter Pills Row */}
          <div className="active-pills-row">
            <div className="pills-left">
              {[
                ["Plan", planDropdown, setPlanDropdown],
                ["Account", accountStatusDropdown, setAccountStatusDropdown],
                ["Subscription", subscriptionDropdown, setSubscriptionDropdown],
                ["Location", locationFilter, setLocationFilter],
                ["Interest", interestFilter, setInterestFilter],
              ].filter(([, value]) => value !== "All").map(([label, value, setValue]) => (
                <span className="filter-pill" key={label}>
                  {label}: {value}
                  <button type="button" className="pill-remove" aria-label={`Remove ${label} filter`} onClick={() => { setValue("All"); setPage(1); }}><FiX size={12} /></button>
                </span>
              ))}
              <button className="clear-all-btn" onClick={handleClearAllFilters}>
                Clear all
              </button>
            </div>

            <div className="pills-right">
              <span className="total-users-indicator">{filteredUsers.length.toLocaleString()} candidates</span>
              <div className="users-control-wrap">
                <button className="columns-selector-btn" onClick={() => setShowColumns((visible) => !visible)} aria-expanded={showColumns}>
                  <FiColumns size={13} />
                  <span>Columns</span>
                  <FiChevronDown size={12} />
                </button>
                {showColumns && (
                  <div className="users-control-menu column-menu">
                    {allAvailableColumns.map((column) => (
                      <label key={column}>
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(column)}
                          onChange={() =>
                            setVisibleColumns((current) =>
                              current.includes(column)
                                ? current.filter((item) => item !== column)
                                : [...current, column],
                            )
                          }
                        />
                        {column}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="users-control-wrap">
                <button className="column-more-btn" aria-label="More table options" onClick={() => setShowTableMenu((visible) => !visible)} aria-expanded={showTableMenu}>
                  <FiMoreVertical size={14} />
                </button>
                {showTableMenu && (
                  <div className="users-control-menu table-more-menu">
                    <button onClick={() => { exportUsers(); setShowTableMenu(false); }}>Export filtered users</button>
                    <button onClick={() => { handleClearAllFilters(); setShowTableMenu(false); }}>Clear filters</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* More Filters Popover (Area of Interest uses strictly the fixed 13 items from Page 7 Rule 2) */}
          {showMoreFilters && (
            <div className="users-popover-row">
              <label>
                Area of interest:
                <select value={interestFilter} onChange={(e) => { setInterestFilter(e.target.value); setPage(1); }}>
                  <option value="All">All Areas</option>
                  {AREAS_OF_INTEREST.map((interest) => (
                    <option key={interest} value={interest}>{interest}</option>
                  ))}
                </select>
              </label>
              <label>
                Location:
                <select value={locationFilter} onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}>
                  <option value="All">All Locations</option>
                  {[...new Set(users.map((user) => user.location).filter(Boolean))].sort().map((location) => (
                    <option key={location}>{location}</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={handleClearAllFilters}>Reset Filters</button>
            </div>
          )}

          {showSavedViews && (
            <div className="users-popover-row saved-views-row">
              <form onSubmit={saveCurrentView}>
                <label>
                  Save view name:
                  <input aria-label="Saved view name" value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder="e.g. STEM OPT Full Stack" required />
                </label>
                <button type="submit">Save view</button>
              </form>
              {savedViews.map((view, index) => (
                <button type="button" key={`${view.name}-${index}`} onClick={() => applySavedView(view)}>{view.name}</button>
              ))}
              {!savedViews.length && <span>No saved views yet.</span>}
            </div>
          )}

          {/* Table Container conforming to Specification Page 5 */}
          <div className="users-table-wrapper users-table-container">
            <table className="users-data-table users-table">
              <thead>
                <tr>
                  <th className="checkbox-th">
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={allVisibleSelected}
                      onChange={handleSelectAll}
                      aria-label="Select users on this page"
                    />
                  </th>
                  {visibleColumns.includes("User") && <th>Candidate (Name &amp; Email)</th>}
                  {visibleColumns.includes("Mobile") && <th>Mobile</th>}
                  {visibleColumns.includes("Area of Interest") && <th>Area of Interest</th>}
                  {visibleColumns.includes("Plan") && <th>Plan</th>}
                  {visibleColumns.includes("Status") && <th>Status</th>}
                  {visibleColumns.includes("Subscription Status") && <th>Subscription</th>}
                  {visibleColumns.includes("AI Use (30d)") && <th>AI Use (30d)</th>}
                  {visibleColumns.includes("Join Date") && (
                    <th>
                      <button className="table-sort-button" onClick={() => setSortNewestFirst((current) => !current)}>
                        Date Joined {sortNewestFirst ? "↓" : "↑"}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("Last Active") && <th>Last Active</th>}
                  {visibleColumns.includes("Actions") && <th style={{ textAlign: "right" }}>Actions</th>}
                  <th aria-label="Row options"></th>
                </tr>
              </thead>
              <tbody>
                {pageUsers.map((user) => {
                  const isChecked = selectedUserIds.includes(user.id);
                  const isCurrentActive = activeUserDetail?.id === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`user-table-row ${isCurrentActive ? "highlight-row" : ""}`}
                      onClick={() => handleInspectUser(user)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="custom-checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(user.id)}
                        />
                      </td>

                      {visibleColumns.includes("User") && (
                        <td>
                          <div className="user-profile-cell">
                            <div className="table-avatar">{user.initials}</div>
                            <div className="table-user-meta">
                              <span className="table-user-name">{user.name}</span>
                              <span className="table-user-email">{user.email}</span>
                            </div>
                          </div>
                        </td>
                      )}

                      {visibleColumns.includes("Mobile") && (
                        <td className="table-phone-cell">{user.phone}</td>
                      )}

                      {visibleColumns.includes("Area of Interest") && (
                        <td>
                          <span className="interest-pill">{user.areaOfInterest}</span>
                        </td>
                      )}

                      {visibleColumns.includes("Plan") && (
                        <td>
                          <span className={`plan-pill ${user.plan.toLowerCase()}`}>
                            {user.plan}
                          </span>
                        </td>
                      )}

                      {visibleColumns.includes("Status") && (
                        <td>
                          <span className={`status-cell-dot ${user.accountStatus.toLowerCase()}`}>
                            <span className={user.accountStatus === "Active" ? "dot-green" : "dot-suspended"}></span>
                            {user.accountStatus}
                          </span>
                        </td>
                      )}

                      {visibleColumns.includes("Subscription Status") && (
                        <td>
                          <span className={`sub-status-pill ${(user.subscriptionStatus || "active").toLowerCase().replace(" ", "-")}`}>
                            <span className="dot-mini"></span>
                            {user.subscriptionStatus}
                          </span>
                        </td>
                      )}

                      {visibleColumns.includes("AI Use (30d)") && (
                        <td>
                          <div className="ai-usage-cell">
                            <FiCpu size={12} className="ai-icon" />
                            <span>{user.aiUse30Days || user.aiCalls || 0} calls</span>
                          </div>
                        </td>
                      )}

                      {visibleColumns.includes("Join Date") && (
                        <td className="table-date">{user.joinedDate || user.joinDate}</td>
                      )}

                      {visibleColumns.includes("Last Active") && (
                        <td className="table-time">{user.lastActive}</td>
                      )}

                      {visibleColumns.includes("Actions") && (
                        <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "right" }}>
                          <div className="row-quick-actions">
                            <button
                              className="view-user-btn"
                              onClick={() => handleInspectUser(user)}
                              title="View details drawer"
                            >
                              View
                            </button>
                            <button
                              className="edit-user-btn-quick"
                              onClick={() => openDialog("edit", [user.id])}
                              title="Edit user profile"
                            >
                              Edit
                            </button>
                            <button
                              className="plan-user-btn-quick"
                              onClick={() => openDialog("plan", [user.id])}
                              title="Change plan tier"
                            >
                              Plan
                            </button>
                          </div>
                        </td>
                      )}

                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="users-control-wrap">
                          <button
                            className="row-options-btn"
                            aria-label={`Actions for ${user.name}`}
                            onClick={() => setRowMenuId((current) => current === user.id ? null : user.id)}
                          >
                            <FiMoreHorizontal size={14} />
                          </button>
                          {rowMenuId === user.id && (
                            <div className="users-control-menu row-action-menu">
                              <button onClick={() => { openDialog("edit", [user.id]); setRowMenuId(null); }}>Edit profile</button>
                              <button onClick={() => { openDialog("plan", [user.id]); setRowMenuId(null); }}>Change plan</button>
                              <button onClick={() => { sendReminders([user.id]); setRowMenuId(null); }}>Send renewal reminder</button>
                              <button
                                onClick={() => {
                                  updateUsers([user.id], (current) => ({
                                    ...current,
                                    accountStatus: current.accountStatus === "Suspended" ? "Active" : "Suspended",
                                  }));
                                  setRowMenuId(null);
                                  notify(user.accountStatus === "Suspended" ? "Account reactivated." : "Account suspended.");
                                }}
                              >
                                {user.accountStatus === "Suspended" ? "Reactivate account" : "Suspend account"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!pageUsers.length && (
                  <tr>
                    <td className="users-empty-state" colSpan={visibleColumns.length + 2}>
                      No candidates match the specified filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer (supports 25 per page per Page 5 Spec) */}
          <div className="table-pagination-footer">
            <span className="pagination-info">
              Showing {filteredUsers.length ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} candidates
            </span>

            <div className="pagination-controls">
              <button
                className="page-arrow-btn"
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <FiChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`page-number-btn ${currentPage === pageNumber ? "active" : ""}`}
                  aria-current={currentPage === pageNumber ? "page" : undefined}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                className="page-arrow-btn"
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                <FiChevronRight size={14} />
              </button>

              <label className="per-page-selector">
                <span>Rows</span>
                <select
                  value={pageSize}
                  aria-label="Rows per page"
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                >
                  {[5, 10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size} per page
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Right User Details Drawer */}
      {activeUserDetail && (
        <UserDetailsDrawer
          key={activeUserDetail.id}
          user={activeUserDetail}
          onClose={() => setActiveUserDetail(null)}
          onEdit={() => openDialog("edit", [activeUserDetail.id])}
          onChangePlan={() => openDialog("plan", [activeUserDetail.id])}
          onContact={() => { window.location.href = `mailto:${activeUserDetail.email}`; }}
          onNotify={notify}
          onSuspend={(user) => {
            const nextStatus = user.accountStatus === "Suspended" ? "Active" : "Suspended";
            updateUsers([user.id], (current) => ({ ...current, accountStatus: nextStatus }));
            notify(nextStatus === "Active" ? "Account reactivated." : "Account suspended.");
          }}
        />
      )}

      {/* Bottom Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedUserIds.length}
        allSelected={allVisibleSelected}
        onToggleAll={handleSelectAll}
        onClear={() => setSelectedUserIds([])}
        onChangePlan={() => openDialog("plan", selectedUserIds)}
        onSendReminder={() => sendReminders(selectedUserIds)}
        onSuspend={() => openDialog("suspend", selectedUserIds)}
        onExport={() => exportUsers(users.filter((user) => selectedUserIds.includes(user.id)))}
      />

      {/* Modal Dialogs conforming strictly to Page 5, 7, and 8 Specification */}
      {dialog && (
        <div
          className="users-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <form className="users-action-modal" onSubmit={submitDialog}>
            <div className="users-modal-header">
              <h2>
                {dialog.type === "invite"
                  ? "Invite New Candidate"
                  : dialog.type === "edit"
                    ? "Edit Candidate Profile"
                    : dialog.type === "plan"
                      ? "Change Candidate Plan & Status"
                      : "Suspend Candidates"}
              </h2>
              <button type="button" aria-label="Close dialog" onClick={() => setDialog(null)}>
                <FiX size={18} />
              </button>
            </div>

            {/* Invite Candidate */}
            {dialog.type === "invite" && (
              <>
                <label>
                  Candidate Full Name
                  <input
                    autoFocus
                    required
                    value={formValues.name || ""}
                    onChange={(e) => setFormValues((c) => ({ ...c, name: e.target.value }))}
                    placeholder="e.g. Sandeep Varma"
                  />
                </label>
                <label>
                  Email Address
                  <input
                    type="email"
                    required
                    value={formValues.email || ""}
                    onChange={(e) => setFormValues((c) => ({ ...c, email: e.target.value }))}
                    placeholder="sandeep@example.com"
                  />
                </label>
                <label>
                  Mobile Number
                  <input
                    value={formValues.phone || ""}
                    onChange={(e) => setFormValues((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                  />
                </label>
                <label>
                  Area of Interest (Rule 2)
                  <select
                    value={formValues.areaOfInterest || AREAS_OF_INTEREST[0]}
                    onChange={(e) => setFormValues((c) => ({ ...c, areaOfInterest: e.target.value }))}
                  >
                    {AREAS_OF_INTEREST.map((aoi) => (
                      <option key={aoi} value={aoi}>{aoi}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Initial Plan Tier (Rule 1)
                  <select
                    value={formValues.plan || "None"}
                    onChange={(e) => setFormValues((c) => ({ ...c, plan: e.target.value }))}
                  >
                    {VALID_PLANS.map((plan) => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>
                </label>
              </>
            )}

            {/* Edit Candidate Profile (Page 5: first name, last name, email, mobile, area of interest, headline, location; changing email changes login email) */}
            {dialog.type === "edit" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label>
                    First Name <span style={{ color: "#ef4444" }}>*</span>
                    <input
                      required
                      value={formValues.firstName || ""}
                      onChange={(e) => setFormValues((c) => ({ ...c, firstName: e.target.value }))}
                    />
                  </label>
                  <label>
                    Last Name <span style={{ color: "#ef4444" }}>*</span>
                    <input
                      required
                      value={formValues.lastName || ""}
                      onChange={(e) => setFormValues((c) => ({ ...c, lastName: e.target.value }))}
                    />
                  </label>
                </div>
                <label>
                  Email Address (Candidate Login ID) <span style={{ color: "#ef4444" }}>*</span>
                  <input
                    type="email"
                    required
                    value={formValues.email || ""}
                    onChange={(e) => setFormValues((c) => ({ ...c, email: e.target.value }))}
                  />
                  <small style={{ color: "#2563eb", marginTop: "2px", display: "block" }}>
                    Note: Changing this email also updates the candidate's platform login credential.
                  </small>
                </label>
                <label>
                  Mobile Number (Admin-Only Field)
                  <input
                    value={formValues.phone || ""}
                    onChange={(e) => setFormValues((c) => ({ ...c, phone: e.target.value }))}
                  />
                </label>
                <label>
                  Area of Interest (Rule 2 Fixed List)
                  <select
                    value={formValues.areaOfInterest || AREAS_OF_INTEREST[0]}
                    onChange={(e) => setFormValues((c) => ({ ...c, areaOfInterest: e.target.value }))}
                  >
                    {AREAS_OF_INTEREST.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Headline / Professional Title
                  <input
                    value={formValues.headline || ""}
                    onChange={(e) => setFormValues((c) => ({ ...c, headline: e.target.value }))}
                    placeholder="e.g. Senior Full Stack Engineer (React/Node)"
                  />
                </label>
                <label>
                  Location
                  <input
                    value={formValues.location || ""}
                    onChange={(e) => setFormValues((c) => ({ ...c, location: e.target.value }))}
                    placeholder="e.g. San Jose, CA, USA"
                  />
                </label>
                <label>
                  Reason for Profile Edit (Rule 4 Audit Log) <span style={{ color: "#ef4444" }}>*</span>
                  <input
                    required
                    value={formValues.auditReason || ""}
                    onChange={(e) => setFormValues((c) => ({ ...c, auditReason: e.target.value }))}
                    placeholder="e.g. Verified candidate's STEM OPT extension & updated ATS title"
                  />
                </label>
              </>
            )}

            {/* Change Plan Modal (Page 5: pick plan and status, and a reason that goes into Audit Log; Rule 1: None, Basic, Premium) */}
            {dialog.type === "plan" && (
              <>
                <label>
                  Subscription Plan (Rule 1: Exactly None, Basic, or Premium)
                  <select
                    autoFocus
                    value={formValues.plan || "Basic"}
                    onChange={(e) => setFormValues((c) => ({ ...c, plan: e.target.value }))}
                  >
                    {VALID_PLANS.map((plan) => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Subscription Status (Rule 1: Active, Inactive, Past due, Cancelled)
                  <select
                    value={formValues.status || "Active"}
                    onChange={(e) => setFormValues((c) => ({ ...c, status: e.target.value }))}
                  >
                    {VALID_PLAN_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Reason for Plan Change (Written to Audit Log) <span style={{ color: "#ef4444" }}>*</span>
                  <input
                    required
                    value={formValues.planReason || ""}
                    onChange={(e) => setFormValues((c) => ({ ...c, planReason: e.target.value }))}
                    placeholder="e.g. Candidate enrolled into Full-Service Placement bundle ($1,299/mo)"
                  />
                </label>
              </>
            )}

            {/* Suspend Confirmation */}
            {dialog.type === "suspend" && (
              <p>
                Suspend {dialog.userIds.length} selected candidate account(s)? Candidate marketing submissions and login access will be paused.
              </p>
            )}

            <div className="users-modal-actions">
              <button type="button" onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                {dialog.type === "invite"
                  ? "Send Invite"
                  : dialog.type === "edit"
                    ? "Save Profile Changes"
                    : dialog.type === "plan"
                      ? "Update Plan Tier"
                      : "Confirm Suspend"}
              </button>
            </div>
          </form>
        </div>
      )}

      {notice && (
        <div className="users-toast" role="status">
          {notice}
          <button aria-label="Dismiss notification" onClick={() => setNotice("")}>
            <FiX size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
