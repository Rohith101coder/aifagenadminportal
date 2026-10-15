import { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch, FiCalendar, FiChevronDown, FiBell, FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { searchAllData } from "../../data/globalSearch";
import "./Header.css";

const dateRanges = [
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
  "This year",
];

export default function Header({
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  onToggleMobileSidebar,
}) {
  const navigate = useNavigate();
  const [dateOpen, setDateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const searchInputRef = useRef(null);
  const searchResults = useMemo(() => searchAllData(searchTerm), [searchTerm]);

  const openResult = (result) => {
    navigate(result.path);
    setSearchOpen(false);
    setActiveResult(0);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setDateOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="top-header">
      <div className="header-left-cluster">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          <FiMenu size={20} />
        </button>
        <div
          className="header-search"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
        }}
      >
        <FiSearch className="search-icon" />
        <input
          ref={searchInputRef}
          type="search"
          placeholder="Search all users, jobs, payments..."
          className="search-input"
          value={searchTerm}
          onChange={(event) => {
            onSearchChange(event.target.value);
            setActiveResult(0);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && searchResults.length) {
              event.preventDefault();
              setSearchOpen(true);
              setActiveResult((index) => (index + 1) % searchResults.length);
            } else if (event.key === "ArrowUp" && searchResults.length) {
              event.preventDefault();
              setActiveResult((index) => (index - 1 + searchResults.length) % searchResults.length);
            } else if (event.key === "Enter" && searchOpen && searchResults[activeResult]) {
              event.preventDefault();
              openResult(searchResults[activeResult]);
            }
          }}
          aria-label="Search dashboard data"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={searchOpen && Boolean(searchTerm.trim())}
          aria-controls="global-search-results"
          aria-activedescendant={searchOpen ? `global-search-result-${activeResult}` : undefined}
        />
        {searchTerm.trim() && searchOpen && (
          <div className="global-search-results" id="global-search-results" role="listbox" aria-label="Search results">
            {searchResults.length ? searchResults.map((result, index) => (
              <button
                key={result.id}
                id={`global-search-result-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeResult}
                className={`global-search-result ${index === activeResult ? "active" : ""}`}
                onMouseEnter={() => setActiveResult(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => openResult(result)}
              >
                <span className="global-search-result-copy">
                  <strong>{result.title}</strong>
                  <small>{result.detail}</small>
                </span>
                <span className="global-search-result-section">{result.section}</span>
              </button>
            )) : (
              <div className="global-search-empty" role="status">
                No matching records found. Try a name, email, title, or ID.
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="global-search-hint">Use ↑ ↓ to navigate · Enter to open</div>
            )}
          </div>
        )}
        {!(searchTerm.trim() && searchOpen) && <span className="search-shortcut">Ctrl + K</span>}
      </div>
    </div>

      <div className="header-right">
        <div className="header-popover-wrap">
          <button
            className="date-picker-button"
            onClick={() => {
              setDateOpen((open) => !open);
              setNotificationsOpen(false);
              setProfileOpen(false);
            }}
            aria-expanded={dateOpen}
          >
            <FiCalendar className="date-icon" />
            <span>{dateRange}</span>
            <FiChevronDown size={17.5} className="date-arrow" />
          </button>
          {dateOpen && (
            <div className="header-popover date-range-menu">
              <span className="popover-heading">Date range</span>
              {dateRanges.map((range) => (
                <button
                  key={range}
                  className={range === dateRange ? "selected" : ""}
                  onClick={() => {
                    onDateRangeChange(range);
                    setDateOpen(false);
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="header-popover-wrap">
          <button
            className="notification-btn"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setDateOpen(false);
              setProfileOpen(false);
            }}
          >
            <FiBell size={20} />
            <span className="notification-badge">3</span>
          </button>
          {notificationsOpen && (
            <div className="header-popover notifications-menu">
              <span className="popover-heading">Notifications</span>
              <p><strong>2 job sources failed</strong><span>Naukri and Glassdoor need attention.</span></p>
              <p><strong>5 payments failed</strong><span>Review failed payments since Oct 5.</span></p>
              <p><strong>12 plans expiring soon</strong><span>12 users need renewal reminders.</span></p>
            </div>
          )}
        </div>
        <span className="header-divider" />
        <div className="header-popover-wrap">
          <button
            className="profile-button"
            onClick={() => {
              setProfileOpen((open) => !open);
              setDateOpen(false);
              setNotificationsOpen(false);
            }}
            aria-label="Account menu"
            aria-expanded={profileOpen}
          >
            <span className="header-user-avatar">RP</span>
            <FiChevronDown size={15} />
          </button>
          {profileOpen && (
            <div className="header-popover profile-menu">
              <strong>Rohith P</strong>
              <span>Administrator</span>
              <button onClick={() => { navigate("/settings"); setProfileOpen(false); }}>
                Account settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
