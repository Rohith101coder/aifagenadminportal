import { useState } from "react";
import {
  FiLock,
  FiMail,
  FiAlertCircle,
  FiShield,
  FiGlobe,
  FiChevronDown,
  FiEye,
  FiEyeOff,
  FiBarChart2,
  FiSliders,
  FiCheck,
  FiInfo,
  FiX
} from "react-icons/fi";
import { initialAdminsList } from "../data/adminsData";
import "./Login.css";

export default function Login({ onLoginSuccess, sessionExpiredMessage = "" }) {
  const [email, setEmail] = useState("rohith.p@aifagenlabs.com");
  const [password, setPassword] = useState("admin@2026");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(sessionExpiredMessage);
  const [infoNotice, setInfoNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Language Dropdown State
  const [selectedLang, setSelectedLang] = useState("English");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Legal / Support Modal State
  const [activeModal, setActiveModal] = useState(null);

  const languages = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
  ];

  const getAdmins = () => {
    try {
      const stored = window.localStorage.getItem("aifagen-admin-users");
      return stored ? JSON.parse(stored) : initialAdminsList;
    } catch {
      return initialAdminsList;
    }
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    setError("");
    setInfoNotice("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const inputEmail = email.trim().toLowerCase();
      const admins = getAdmins();

      // Check if email is on the authorized admin roster
      const matchedAdmin = admins.find((a) => a.email.toLowerCase() === inputEmail);

      if (!matchedAdmin) {
        setError(
          "Admin access required: This account is not on the authorized administrators list. Regular platform users cannot access this internal portal."
        );
        return;
      }

      // Check password (minimum 4 characters for security)
      if (!password || password.length < 4) {
        setError("Please enter a valid administrative password (minimum 4 characters).");
        return;
      }

      // Successful authentication session
      const sessionData = {
        email: matchedAdmin.email,
        name: matchedAdmin.name,
        role: matchedAdmin.role || "Administrator",
        signedInAt: new Date().toISOString(),
        rememberMe,
      };

      try {
        window.localStorage.setItem("aifagen-admin-session", JSON.stringify(sessionData));
      } catch (err) {
        console.error("Storage error:", err);
      }

      onLoginSuccess(sessionData);
    }, 450);
  };

  const fillQuickAdmin = (adminEmail) => {
    setEmail(adminEmail);
    setPassword("admin@2026");
    setError("");
    setInfoNotice("");
  };

  const testNonAdmin = () => {
    setEmail("candidate.seeker@gmail.com");
    setPassword("pass1234");
    setError("");
    setInfoNotice("");
  };

  const handleForgotPassword = () => {
    setInfoNotice(
      "To reset your admin password, please contact Lead Admin (rohith.p@aifagenlabs.com) or the Siddipet IT Operations desk."
    );
  };

  return (
    <div className="login-viewport">
      <div className="login-split-card">
        {/* ========================================================= */}
        {/* LEFT HERO BRAND PANEL (Midnight Blue with curved styling) */}
        {/* ========================================================= */}
        <div className="hero-brand-panel">
          {/* Subtle Ambient Curved Glowing Layers */}
          <div className="hero-ambient-shape hero-ambient-top" />
          <div className="hero-ambient-shape hero-ambient-bottom" />
          <div className="hero-ambient-shape hero-ambient-accent" />

          <div className="hero-panel-inner">
            {/* Top Brand Logo */}
            <div className="hero-brand-header">
              <div className="hero-logo-container">
                <img
                  src="/aifagenlogo-icon.png"
                  alt="AiFAGen Logo"
                  className="hero-logo-image"
                />
              </div>
              <div className="hero-brand-meta">
                <span className="hero-brand-title">AiFAGen</span>
                <span className="hero-brand-tagline">Admin Portal</span>
              </div>
            </div>

            {/* Main Headline & Subtitle */}
            <div className="hero-copy-block">
              <h1 className="hero-main-heading">
                Manage <br />
                with <span className="hero-heading-highlight">confidence</span>
              </h1>
              <p className="hero-main-description">
                Secure access for administrators to manage users, jobs, payments and platform settings.
              </p>
            </div>

            {/* Feature Highlights with Sleek Badges */}
            <div className="hero-features-list">
              <div className="hero-feature-item">
                <div className="feature-icon-badge">
                  <FiBarChart2 className="feature-icon" size={20} />
                </div>
                <div className="feature-text-block">
                  <h4 className="feature-title">Platform insights</h4>
                  <p className="feature-desc">Monitor users, jobs and revenue</p>
                </div>
              </div>

              <div className="hero-feature-item">
                <div className="feature-icon-badge">
                  <FiSliders className="feature-icon" size={20} />
                </div>
                <div className="feature-text-block">
                  <h4 className="feature-title">Complete control</h4>
                  <p className="feature-desc">Manage settings, permissions and integrations</p>
                </div>
              </div>

              <div className="hero-feature-item">
                <div className="feature-icon-badge">
                  <FiShield className="feature-icon" size={20} />
                </div>
                <div className="feature-text-block">
                  <h4 className="feature-title">Enterprise security</h4>
                  <p className="feature-desc">SSO, 2FA and audit logs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIGN-IN FORM PANEL (Crisp White)                   */}
        {/* ========================================================= */}
        <div className="form-portal-panel">
          {/* Top Bar with Language Selector */}
          <div className="form-portal-topbar">
            <div className="language-selector-wrapper">
              <button
                type="button"
                className="language-selector-button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                aria-label="Select Language"
              >
                <FiGlobe size={15} className="lang-globe-icon" />
                <span className="lang-text">{selectedLang}</span>
                <FiChevronDown
                  size={14}
                  className={`lang-chevron ${langDropdownOpen ? "rotated" : ""}`}
                />
              </button>

              {langDropdownOpen && (
                <div className="language-dropdown-menu">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      className={`lang-option-btn ${selectedLang === lang.label ? "active" : ""}`}
                      onClick={() => {
                        setSelectedLang(lang.label);
                        setLangDropdownOpen(false);
                      }}
                    >
                      <span>{lang.label}</span>
                      {selectedLang === lang.label && <FiCheck size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Content Area */}
          <div className="form-portal-body">
            <div className="form-intro-block">
              <h2 className="portal-heading">Admin sign in</h2>
              <p className="portal-subheading">Access the AiFAGen admin portal.</p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="login-alert-box error" role="alert">
                <FiAlertCircle className="alert-box-icon" size={18} />
                <div className="alert-box-content">
                  <strong>Access Denied</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Informational Toast Notice */}
            {infoNotice && (
              <div className="login-alert-box info" role="status">
                <FiInfo className="alert-box-icon" size={18} />
                <div className="alert-box-content">
                  <p>{infoNotice}</p>
                </div>
                <button
                  type="button"
                  className="alert-close-btn"
                  onClick={() => setInfoNotice("")}
                  aria-label="Close message"
                >
                  <FiX size={14} />
                </button>
              </div>
            )}

            {/* Main Sign-In Form */}
            <form onSubmit={handleSignIn} className="admin-signin-form">
              {/* Email Address */}
              <div className="input-field-group">
                <label htmlFor="admin-email" className="field-label">
                  Email address
                </label>
                <div className="field-control-wrapper">
                  <FiMail className="field-leading-icon" size={17} />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@aifagen.com"
                    className="field-text-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="input-field-group">
                <div className="password-label-row">
                  <label htmlFor="admin-password" className="field-label">
                    Password
                  </label>
                  <button
                    type="button"
                    className="forgot-password-button"
                    onClick={handleForgotPassword}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="field-control-wrapper">
                  <FiLock className="field-leading-icon" size={17} />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="field-text-input has-trailing-action"
                  />
                  <button
                    type="button"
                    className="password-toggle-action"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="remember-me-row">
                <label className="remember-me-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="remember-checkbox-input"
                  />
                  <span className="remember-checkbox-custom">
                    {rememberMe && <FiCheck size={12} className="check-svg" />}
                  </span>
                  <span className="remember-checkbox-text">Remember me</span>
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="signin-primary-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="btn-loading-content">
                    <span className="btn-spinner" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Box (Preserving previous login functionality) */}
            <div className="quick-demo-section">
              <div className="quick-demo-title">
                <FiShield size={13} />
                <span>Quick Sign-In (Demo Credentials)</span>
              </div>
              <div className="quick-demo-pills">
                <button
                  type="button"
                  className="quick-demo-pill"
                  onClick={() => fillQuickAdmin("rohith.p@aifagenlabs.com")}
                  title="Click to fill Rohith P credentials"
                >
                  <span className="pill-status-dot online" />
                  <span className="pill-label">Rohith P (Super Admin)</span>
                </button>
                <button
                  type="button"
                  className="quick-demo-pill"
                  onClick={() => fillQuickAdmin("operations@aifagenlabs.com")}
                  title="Click to fill Siddipet Operations credentials"
                >
                  <span className="pill-status-dot online" />
                  <span className="pill-label">Siddipet Operations</span>
                </button>
                <button
                  type="button"
                  className="quick-demo-pill unauthorized"
                  onClick={testNonAdmin}
                  title="Test non-admin account rejection"
                >
                  <span className="pill-status-dot red" />
                  <span className="pill-label">Test Non-Admin</span>
                </button>
              </div>
            </div>
          </div>

          {/* Legal / Policy Footer */}
          <div className="form-portal-footer">
            <div className="footer-links-group">
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => setActiveModal("privacy")}
              >
                Privacy Policy
              </button>
              <span className="footer-link-separator">|</span>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => setActiveModal("terms")}
              >
                Terms of Service
              </button>
              <span className="footer-link-separator">|</span>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => setActiveModal("support")}
              >
                Support
              </button>
            </div>
            <div className="footer-copyright-text">
              © 2026 AiFAGen. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LEGAL & SUPPORT MODAL                                     */}
      {/* ========================================================= */}
      {activeModal && (
        <div className="login-modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="login-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header-row">
              <h3 className="modal-title">
                {activeModal === "privacy" && "AiFAGen Privacy Policy"}
                {activeModal === "terms" && "Terms of Administrative Service"}
                {activeModal === "support" && "AiFAGen Internal IT Support"}
              </h3>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={() => setActiveModal(null)}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="modal-body-scroll">
              {activeModal === "privacy" && (
                <>
                  <p>
                    <strong>AIFAGEN INTELLIGENCE PRIVATE LIMITED</strong> is dedicated to safeguarding all candidate, employee, and platform operational data in accordance with enterprise security standards.
                  </p>
                  <p>
                    All administrative sessions are logged, monitored, and retained within the immutable audit telemetry system for 365 days.
                  </p>
                </>
              )}
              {activeModal === "terms" && (
                <>
                  <p>
                    Authorized internal administrative access only. Any unauthorized attempts to access or exfiltrate platform candidate resumes, billing records, or crawler telemetry will be reported to legal compliance.
                  </p>
                  <p>
                    CIN: U62099TS2025PTC207849 · Siddipet Operations Hub, Telangana.
                  </p>
                </>
              )}
              {activeModal === "support" && (
                <>
                  <p>
                    <strong>IT Helpdesk &amp; Account Recovery:</strong>
                  </p>
                  <p>Email: <code>operations@aifagenlabs.com</code></p>
                  <p>Super Admin: <code>rohith.p@aifagenlabs.com</code></p>
                  <p>Headquarters: 12-4-89/3, Saraswathi Nagar, Siddipet, Telangana 502103</p>
                </>
              )}
            </div>
            <div className="modal-footer-row">
              <button
                type="button"
                className="modal-dismiss-btn"
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
