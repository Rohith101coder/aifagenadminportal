import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import Header from "./components/Header/Header";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Payments from "./pages/Payments";
import Jobs from "./pages/Jobs";
import TeamMembers from "./pages/TeamMembers";
import Interviews from "./pages/Interviews";
import AIUsage from "./pages/AIUsage";
import Reports from "./pages/Reports";
import AuditLog from "./pages/AuditLog";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Chatbot from "./components/Chatbot/Chatbot";
import VoiceAgent from "./components/VoiceAgent/VoiceAgent";
import "./App.css";

function AppContent({
  searchTerm,
  setSearchTerm,
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  dateRange,
  setDateRange,
  darkMode,
  setDarkMode,
  currentUser,
  handleSignOut,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  // Route map fallback for voice navigation when DOM click fallback is needed
  const handleVoiceNavigateFallback = (pathOrId, targetId) => {
    if (typeof pathOrId === "string" && pathOrId.startsWith("/")) {
      navigate(pathOrId);
      return;
    }
    const target = pathOrId || targetId;
    const targetMap = {
      "sidebar-nav-dashboard": "/dashboard",
      "executive-dashboard": "/dashboard",
      dashboard: "/dashboard",
      home: "/dashboard",
      "sidebar-nav-candidate-roster": "/users",
      "candidate-roster": "/users",
      candidates: "/users",
      users: "/users",
      "sidebar-nav-billing-invoices": "/payments",
      "billing-invoices": "/payments",
      billing: "/payments",
      invoices: "/payments",
      payments: "/payments",
      "sidebar-nav-job-pipeline": "/jobs/all",
      "job-pipeline": "/jobs/all",
      jobs: "/jobs/all",
      "sidebar-nav-jobs-all": "/jobs/all",
      "job-pipeline-all": "/jobs/all",
      "sidebar-nav-jobs-market": "/jobs/public",
      "job-pipeline-market": "/jobs/public",
      "market-feeds": "/jobs/public",
      "sidebar-nav-jobs-internal": "/jobs/internal",
      "job-pipeline-internal": "/jobs/internal",
      "internal-jobs": "/jobs/internal",
      "sidebar-nav-jobs-crawlers": "/jobs/sources",
      "job-pipeline-crawlers": "/jobs/sources",
      crawlers: "/jobs/sources",
      "crawler-sources": "/jobs/sources",
      "sidebar-nav-interview-pipeline": "/interviews",
      "interview-pipeline": "/interviews",
      interviews: "/interviews",
      "sidebar-nav-delivery-operations": "/team-members",
      "delivery-operations": "/team-members",
      team: "/team-members",
      "team-members": "/team-members",
      "sidebar-nav-placement-analytics": "/reports",
      "placement-analytics": "/reports",
      reports: "/reports",
      analytics: "/reports",
      "sidebar-nav-ai-engine": "/ai-usage",
      "ai-engine": "/ai-usage",
      "ai-usage": "/ai-usage",
      "sidebar-nav-audit-compliance": "/audit-log",
      "audit-compliance": "/audit-log",
      "audit-log": "/audit-log",
      audit: "/audit-log",
      "sidebar-nav-platform-settings": "/settings",
      "platform-settings": "/settings",
      settings: "/settings",
    };
    const path = targetMap[target];
    if (path) {
      navigate(path);
    }
  };

  // Close mobile off-canvas drawer whenever user navigates
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div
      className={`app-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${mobileSidebarOpen ? "mobile-sidebar-open" : ""}`}
      data-theme={darkMode ? "dark" : "light"}
    >
      {mobileSidebarOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((enabled) => !enabled)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />
      <div className="main-wrapper">
        <Header
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onToggleMobileSidebar={() => setMobileSidebarOpen((open) => !open)}
        />
        <div className="content-area">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <Dashboard searchTerm={searchTerm} dateRange={dateRange} />
              }
            />
            <Route path="/payments" element={<Payments key="transactions" globalSearchTerm={searchTerm} />} />
            <Route path="/plans-subscriptions" element={<Payments key="plans" globalSearchTerm={searchTerm} />} />
            <Route path="/plans" element={<Payments key="plans" globalSearchTerm={searchTerm} />} />
            <Route
              path="/ai-usage"
              element={
                <AIUsage searchTerm={searchTerm} dateRange={dateRange} />
              }
            />
            <Route path="/jobs" element={<Jobs globalSearchTerm={searchTerm} />} />
            <Route path="/jobs/:category" element={<Jobs globalSearchTerm={searchTerm} />} />
            <Route path="/internal-jobs" element={<Navigate to="/jobs/internal" replace />} />
            <Route
              path="/job-sources"
              element={<Navigate to="/jobs/sources" replace />}
            />
            <Route path="/users" element={<Users globalSearchTerm={searchTerm} />} />
            <Route path="/team-members" element={<TeamMembers globalSearchTerm={searchTerm} />} />
            <Route
              path="/reports"
              element={
                <Reports searchTerm={searchTerm} dateRange={dateRange} />
              }
            />
            <Route path="/interviews" element={<Interviews globalSearchTerm={searchTerm} />} />
            <Route
              path="/audit-log"
              element={
                <AuditLog searchTerm={searchTerm} dateRange={dateRange} />
              }
            />
            <Route
              path="/settings"
              element={
                <Settings
                  darkMode={darkMode}
                  globalSearchTerm={searchTerm}
                  onToggleTheme={() => setDarkMode((enabled) => !enabled)}
                />
              }
            />
          </Routes>
        </div>
      </div>
      {/* Unified Floating AI Assistants Dock (Voice Navigation Agent + Enterprise Chatbot) */}
      <div className="floating-ai-assistants-dock">
        <VoiceAgent
          onNavigateFallback={handleVoiceNavigateFallback}
          onToggleTheme={() => setDarkMode((enabled) => !enabled)}
          onSignOut={handleSignOut}
          onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
        <Chatbot />
      </div>
    </div>
  );
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [darkMode, setDarkMode] = useState(
    () => window.localStorage.getItem("aifagen-theme") === "dark",
  );

  // Authentication session state conforming to Page 1 spec
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = window.localStorage.getItem("aifagen-admin-session");
      if (stored) return JSON.parse(stored);
      const defaultUser = {
        name: "Rohith P",
        email: "rohith.p@aifagenlabs.com",
        role: "Lead Platform Admin",
        signedInAt: new Date().toISOString(),
      };
      window.localStorage.setItem("aifagen-admin-session", JSON.stringify(defaultUser));
      return defaultUser;
    } catch {
      return {
        name: "Rohith P",
        email: "rohith.p@aifagenlabs.com",
        role: "Lead Platform Admin",
        signedInAt: new Date().toISOString(),
      };
    }
  });

  const [sessionExpiredMsg, setSessionExpiredMsg] = useState("");

  useEffect(() => {
    window.localStorage.setItem("aifagen-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleSignOut = () => {
    try {
      window.localStorage.removeItem("aifagen-admin-session");
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setSessionExpiredMsg("");
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setSessionExpiredMsg("");
  };

  // If unauthenticated or logged out, show Login screen
  if (!currentUser) {
    return (
      <div data-theme={darkMode ? "dark" : "light"}>
        <Login
          onLoginSuccess={handleLogin}
          sessionExpiredMessage={sessionExpiredMsg}
        />
      </div>
    );
  }

  return (
    <Router>
      <AppContent
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        dateRange={dateRange}
        setDateRange={setDateRange}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        handleSignOut={handleSignOut}
      />
    </Router>
  );
}
