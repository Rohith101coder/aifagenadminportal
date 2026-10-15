import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowUpRight,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiCreditCard,
  FiDownload,
  FiEye,
  FiFileText,
  FiHome,
  FiLink,
  FiLock,
  FiMail,
  FiPlus,
  FiRotateCcw,
  FiShield,
  FiSettings,
  FiEyeOff,
  FiTrash2,
  FiUpload,
  FiUser,
  FiUsers,
  FiX,
  FiActivity,
  FiRefreshCw,
} from "react-icons/fi";
import {
  initialSettingsData,
  sectionAuditHistory,
  settingsNavSections,
} from "../data/settingsData";
import { initialAdminsList } from "../data/adminsData";
import { initialConnectedServices } from "../data/servicesData";
import { logAuditAction } from "../data/auditLogData";
import { matchesGlobalSearch } from "../data/globalSearch";
import "./Settings.css";

const STORAGE_KEY = "aifagen-admin-settings";
const HISTORY_KEY = "aifagen-admin-settings-history";
const ADMINS_STORAGE_KEY = "aifagen-admin-users";

const sectionDefaults = {
  mfaRequired: true,
  ssoEnabled: false,
  loginAlerts: true,
  sessionDuration: "12 hours",
  allowedIpRanges: "",
  defaultJobStatus: "Pending review",
  requireJobReview: true,
  allowEmployerEdits: false,
  maxResumeSize: "10 MB",
  emailDigest: "Daily",
  notificationRecipients: "support@aifagenlabs.com",
  notifyFailedPayments: true,
  notifyJobSourceFailures: true,
  notifySecurityEvents: true,
  billingContact: "finance@aifagenlabs.com",
  invoicePrefix: "AIF-2026",
  taxEnabled: true,
  invoiceFooter: "AIFAGEN INTELLIGENCE PRIVATE LIMITED · Siddipet, Telangana",
  userDataRetention: "365",
  auditLogRetention: "730",
  maskPersonalData: true,
  allowDataExports: true,
  webhookUrl: "",
  webhookEvents: ["payment.completed", "user.created"],
  apiKeys: [
    { id: "key-demo", name: "Development key", masked: "aifagen_demo_••••••••", created: "Demo" },
  ],
};

const defaultSettings = {
  ...initialSettingsData.general,
  ...sectionDefaults,
};

const initialHistory = sectionAuditHistory.recentChanges.map((change) => ({
  ...change,
  snapshot: defaultSettings,
}));

const sectionTitles = {
  general: "Organization Profile & Headquarters",
  admins: "Administrator Accounts",
  services: "Connected Outside Services",
  security: "Security & Sessions",
  "jobs-apps": "Jobs & Application Workflow",
  "email-notifs": "Email & Notifications",
  "payments-tax": "Billing & Invoicing Preferences",
  "data-privacy": "Data Retention & Compliance",
  "integrations-api": "Integrations & API",
};

function readStoredSettings() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(stored) };
  } catch (error) {
    console.error("Could not parse saved settings.", error);
    return defaultSettings;
  }
}

function readStoredHistory() {
  const stored = window.localStorage.getItem(HISTORY_KEY);
  if (!stored) return initialHistory;
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : initialHistory;
  } catch (error) {
    console.error("Could not parse settings history.", error);
    return initialHistory;
  }
}

function readCurrentSettings() {
  return {
    ...readStoredSettings(),
    adminTheme: window.localStorage.getItem("aifagen-theme") === "dark",
  };
}

function downloadJson(settings) {
  const blob = new Blob([JSON.stringify(settings, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `aifagen-settings-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function createApiKey() {
  const bytes = new Uint8Array(18);
  window.crypto.getRandomValues(bytes);
  return `aifagen_demo_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function createLocalId(prefix) {
  const bytes = new Uint8Array(8);
  window.crypto.getRandomValues(bytes);
  return `${prefix}-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

const iconByType = {
  building: FiHome,
  user: FiUsers,
  users: FiUsers,
  link: FiLink,
  lock: FiLock,
  briefcase: FiBriefcase,
  mail: FiMail,
  card: FiCreditCard,
  shield: FiShield,
};

export default function Settings({ darkMode = false, onToggleTheme, globalSearchTerm = "" }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(() =>
    settingsNavSections.find((section) => matchesGlobalSearch(section, globalSearchTerm))?.id ?? "general",
  );
  const [savedSettings, setSavedSettings] = useState(readCurrentSettings);
  const [formData, setFormData] = useState(readCurrentSettings);
  const [history, setHistory] = useState(readStoredHistory);
  const [notice, setNotice] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const noticeTimer = useRef(null);
  const logoInput = useRef(null);

  // Admins state (Page 1 & 6 Spec)
  const [admins, setAdmins] = useState(() => {
    try {
      const stored = window.localStorage.getItem(ADMINS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : initialAdminsList;
    } catch {
      return initialAdminsList;
    }
  });
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("Support Admin");
  const [adminToRemove, setAdminToRemove] = useState(null);

  // Connected Services state (Page 6 Spec)
  const [services, setServices] = useState(initialConnectedServices);
  const [pingingServiceId, setPingingServiceId] = useState(null);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedSettings),
    [formData, savedSettings],
  );

  useEffect(() => () => {
    window.clearTimeout(noticeTimer.current);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  const notify = (message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3500);
  };

  const persistAdmins = (next) => {
    setAdmins(next);
    try {
      window.localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  };

  // Add Admin Handler (Page 1 & 6 Spec)
  const handleAddAdmin = (e) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;

    if (!email.includes("@") || !email.includes(".")) {
      notify("Please enter a valid email address.");
      return;
    }

    if (admins.some((a) => a.email.toLowerCase() === email)) {
      notify("This administrator email address is already registered.");
      return;
    }

    const nameFromEmail = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const newAdmin = {
      id: `adm-${Date.now()}`,
      name: nameFromEmail,
      email,
      role: newAdminRole,
      addedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      initials: nameFromEmail.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      isSelf: false,
    };

    const nextAdmins = [...admins, newAdmin];
    persistAdmins(nextAdmins);
    setNewAdminEmail("");

    logAuditAction({
      category: "Admin changes",
      eventTitle: "New admin added",
      eventSummary: `Granted administrative access to ${email}`,
      targetName: email,
      targetType: "Admin",
      targetId: newAdmin.id,
      field: "admin_access",
      previousValue: "None",
      newValue: newAdminRole,
      reason: "Admin added to portal team from Settings page",
    });

    notify(`Administrator ${email} successfully added.`);
  };

  // Remove Admin Handler (Page 1 & 6 & 8 Spec: Cannot remove self, cannot remove last admin, asks confirmation, writes to audit log)
  const initiateRemoveAdmin = (admin) => {
    // Page 1: "An admin can't remove themselves"
    if (admin.isSelf || admin.email === "rohith.p@aifagenlabs.com") {
      notify("An administrator cannot remove their own account from the portal.");
      return;
    }

    // Page 1: "the last admin can't be removed"
    if (admins.length <= 1) {
      notify("The last administrator account cannot be removed.");
      return;
    }

    setAdminToRemove(admin);
  };

  const confirmRemoveAdmin = () => {
    if (!adminToRemove) return;
    const target = adminToRemove;
    const nextAdmins = admins.filter((a) => a.id !== target.id);
    persistAdmins(nextAdmins);

    logAuditAction({
      category: "Admin changes",
      eventTitle: "Admin removed",
      eventSummary: `Revoked administrative access for ${target.email}`,
      targetName: target.email,
      targetType: "Admin",
      targetId: target.id,
      field: "admin_access",
      previousValue: target.role,
      newValue: "Revoked",
      reason: "Administrator access removed from Settings",
    });

    notify(`Administrator ${target.email} removed.`);
    setAdminToRemove(null);
  };

  // Ping Connected Service
  const handlePingService = (service) => {
    setPingingServiceId(service.id);
    notify(`Pinging ${service.name} at ${service.endpoint}...`);

    setTimeout(() => {
      setPingingServiceId(null);
      if (service.status === "OK") {
        notify(`${service.name} responded in 142ms. Health status: OK.`);
      } else {
        notify(`${service.name} ping result: ${service.details}`);
      }
    }, 800);
  };

  const update = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const saveChanges = () => {
    const snapshot = { ...savedSettings };
    const changedFields = Object.keys(formData).filter(
      (key) => JSON.stringify(formData[key]) !== JSON.stringify(savedSettings[key]),
    );
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
    const nextHistory = [
      ...history,
      {
        id: createLocalId("settings"),
        action: `Updated ${changedFields.length} setting${changedFields.length === 1 ? "" : "s"} in ${sectionTitles[activeSection]}`,
        author: "Rohith P",
        time: `${timestamp} IST`,
        iconType: "edit",
        snapshot,
      },
    ].slice(-30);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
      setSavedSettings(formData);
      setHistory(nextHistory);
      if (formData.adminTheme !== undefined && formData.adminTheme !== darkMode) {
        onToggleTheme?.();
      }
      notify("Settings saved on this device.");
    } catch (error) {
      console.error("Could not save settings.", error);
      notify("Settings could not be saved. Check browser storage and try again.");
    }
  };

  const discardChanges = () => {
    setFormData(savedSettings);
    setNewApiKey("");
    notify("Unsaved changes discarded.");
  };

  const restoreHistory = (item) => {
    if (!item.snapshot) {
      notify("This older history entry has no restorable settings snapshot.");
      return;
    }
    setFormData({ ...defaultSettings, ...item.snapshot });
    setActiveSection("general");
    notify("Previous settings restored as unsaved changes.");
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validType = ["image/png", "image/svg+xml"].includes(file.type);
    if (!validType || file.size > 2 * 1024 * 1024) {
      notify("Choose a PNG or SVG logo smaller than 2 MB.");
      event.target.value = "";
      return;
    }
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
    update("organizationLogoName", file.name);
  };

  const generateApiKey = () => {
    const secret = createApiKey();
    const entry = {
      id: createLocalId("key"),
      name: `Dashboard key ${formData.apiKeys.length + 1}`,
      masked: `${secret.slice(0, 17)}••••••••`,
      created: "Unsaved",
    };
    update("apiKeys", [entry, ...formData.apiKeys]);
    setNewApiKey(secret);
    notify("Demo key generated. Save settings to keep its entry.");
  };

  const revokeApiKey = (key) => {
    update(
      "apiKeys",
      formData.apiKeys.filter((item) => item.id !== key.id),
    );
    if (key.id === formData.apiKeys[0]?.id) setNewApiKey("");
    notify(`${key.name} removed.`);
  };

  const renderField = (label, key, options = {}) => (
    <label className={`settings-field ${options.full ? "full" : ""}`} key={key}>
      <span>{label}{options.required && <i aria-hidden="true"> *</i>}</span>
      {options.type === "textarea" ? (
        <textarea
          rows={options.rows || 3}
          value={formData[key] ?? ""}
          onChange={(event) => update(key, event.target.value)}
          required={options.required}
          placeholder={options.placeholder}
        />
      ) : options.options ? (
        <select
          value={formData[key] ?? ""}
          onChange={(event) => update(key, event.target.value)}
        >
          {options.options.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>
              {option.label ?? option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={options.type || "text"}
          value={formData[key] ?? ""}
          onChange={(event) => update(key, event.target.value)}
          required={options.required}
          maxLength={options.maxLength}
          min={options.min}
          max={options.max}
          placeholder={options.placeholder}
          autoComplete={options.autoComplete}
        />
      )}
      {options.help && <small>{options.help}</small>}
    </label>
  );

  const renderToggle = (label, description, key) => (
    <label className="settings-toggle-row" key={key}>
      <span><strong>{label}</strong><small>{description}</small></span>
      <input
        type="checkbox"
        checked={Boolean(formData[key])}
        onChange={(event) => update(key, event.target.checked)}
        aria-label={label}
      />
    </label>
  );

  // Section: General
  const renderGeneral = () => (
    <>
      <section className="settings-panel-card">
        <div className="settings-panel-heading">
          <div>
            <h3>Organization Profile &amp; Location</h3>
            <p>Corporate identity registered with Ministry of Corporate Affairs (ZaubaCorp).</p>
          </div>
        </div>
        <div className="settings-fields-grid">
          {renderField("Legal Entity Name", "legalName", { required: true })}
          {renderField("CIN", "cin", { help: "Corporate Identification Number" })}
          {renderField("Registered Address", "registeredAddress", { type: "textarea", full: true })}
          {renderField("Industry / Sector", "industry", { full: true })}
          {renderField("Target Market", "targetMarket", { full: true })}
          {renderField("Support Email", "supportEmail", { type: "email", required: true })}
          {renderField("Marketing Website", "marketingWebsite", { type: "url" })}
          {renderField("Platform URL", "platformUrl", { type: "url" })}
          {renderField("Time Zone", "timezone", { options: ["(GMT+05:30) Asia/Kolkata (IST)", "(GMT-05:00) Eastern Time (US)", "(GMT-08:00) Pacific Time (US)"] })}
          {renderField("Primary Billing Currency", "currency", { options: ["USD ($) / INR (₹)", "USD ($)", "INR (₹)"] })}
        </div>
      </section>
      <section className="settings-panel-card">
        <div className="settings-panel-heading">
          <div>
            <h3>Admin Appearance</h3>
            <p>Toggle light or dark theme for the internal dashboard console.</p>
          </div>
        </div>
        {renderToggle("Dark Theme", "Use sleek dark theme appearance throughout the admin console.", "adminTheme")}
      </section>
    </>
  );

  // Section: Admins (Page 1 & 6 Spec)
  const renderAdmins = () => (
    <>
      <section className="settings-panel-card">
        <div className="settings-panel-heading">
          <div>
            <h3>Add Authorized Administrator</h3>
            <p>Existing admins can add someone by their email. Only accounts on this list can log in.</p>
          </div>
          <FiUsers className="settings-heading-icon" />
        </div>
        <form onSubmit={handleAddAdmin} className="add-admin-form">
          <div className="add-admin-inputs">
            <input
              type="email"
              required
              placeholder="admin.email@aifagenlabs.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              aria-label="New admin email"
            />
            <select
              value={newAdminRole}
              onChange={(e) => setNewAdminRole(e.target.value)}
              aria-label="Admin role"
            >
              <option value="Super Admin">Super Admin</option>
              <option value="Operations Admin">Operations Admin (Siddipet HQ)</option>
              <option value="Placement Admin">Placement Admin (US Placements)</option>
              <option value="Support Admin">Support Admin</option>
            </select>
            <button type="submit" className="settings-primary-button">
              <FiPlus size={14} /> Add Admin
            </button>
          </div>
          <small className="admin-rules-note">
            Rules: An admin cannot remove themselves, and the last admin cannot be removed. Destructive removals ask for confirmation.
          </small>
        </form>
      </section>

      <section className="settings-panel-card">
        <div className="settings-panel-heading">
          <div>
            <h3>Authorized Administrators ({admins.length})</h3>
            <p>Accounts with permission to access the internal console.</p>
          </div>
        </div>
        <div className="admins-list-wrapper">
          <table className="admins-table">
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Role</th>
                <th>Date Added</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td>
                    <div className="admin-meta-cell">
                      <span className="admin-avatar">{admin.initials || "AD"}</span>
                      <div>
                        <strong>{admin.name}</strong>
                        <span>{admin.email}</span>
                      </div>
                      {admin.isSelf && <span className="self-tag">You (Active Session)</span>}
                    </div>
                  </td>
                  <td>
                    <span className="role-pill">{admin.role}</span>
                  </td>
                  <td>
                    <span className="added-date-text">{admin.addedDate}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-remove-admin"
                      disabled={admin.isSelf || admin.email === "rohith.p@aifagenlabs.com"}
                      title={admin.isSelf ? "You cannot remove yourself" : "Remove admin"}
                      onClick={() => initiateRemoveAdmin(admin)}
                    >
                      <FiTrash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  // Section: Connected Outside Services (Page 6 Spec)
  const renderServices = () => (
    <section className="settings-panel-card">
      <div className="settings-panel-heading">
        <div>
          <h3>Connected Outside Services Status</h3>
          <p>
            Status list showing whether each outside service is set up correctly (OK or Needs attention), with a short explanation for anything not OK.
          </p>
        </div>
        <FiLink className="settings-heading-icon" />
      </div>
      <div className="services-list-container">
        {services.map((svc) => (
          <div key={svc.id} className={`service-item-row ${svc.status === "OK" ? "status-ok" : "status-attention"}`}>
            <div className="service-info-col">
              <div className="service-name-row">
                <strong>{svc.name}</strong>
                <span className="svc-category">{svc.category}</span>
              </div>
              <span className="svc-endpoint">{svc.endpoint}</span>
              <p className="svc-details-text">
                {svc.status !== "OK" && <FiAlertTriangle size={13} className="svc-warn-icon" />}
                {svc.details}
              </p>
            </div>

            <div className="service-status-col">
              <span className={`svc-status-pill ${svc.status === "OK" ? "ok" : "attention"}`}>
                <span className="dot"></span>
                {svc.status === "OK" ? "OK" : "Needs attention"}
              </span>
              <small className="last-checked">Checked {svc.lastChecked}</small>
              <button
                className="btn-ping-service"
                onClick={() => handlePingService(svc)}
                disabled={pingingServiceId === svc.id}
              >
                <FiRefreshCw size={12} className={pingingServiceId === svc.id ? "spin" : ""} />
                <span>Test Connection</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderSectionContent = () => {
    if (activeSection === "general") return renderGeneral();
    if (activeSection === "admins") return renderAdmins();
    if (activeSection === "services") return renderServices();
    if (activeSection === "security") return (
      <section className="settings-panel-card">
        <div className="settings-panel-heading"><div><h3>Authentication & Sessions</h3><p>Configure session duration and sign-in verification controls.</p></div><FiShield className="settings-heading-icon" /></div>
        {renderToggle("Require multi-factor authentication", "Require additional verification for administrator sign-ins.", "mfaRequired")}
        {renderToggle("Sign-in alerts", "Notify the security contact about new administrator sign-ins.", "loginAlerts")}
        <div className="settings-fields-grid">{renderField("Session duration", "sessionDuration", { options: ["1 hour", "4 hours", "12 hours", "24 hours"] })}{renderField("Allowed IP ranges", "allowedIpRanges", { placeholder: "e.g. 203.0.113.0/24 (Siddipet HQ CIDR)" })}</div>
      </section>
    );
    if (activeSection === "jobs-apps") return (
      <section className="settings-panel-card">
        <div className="settings-panel-heading"><div><h3>Jobs & Application Workflow</h3><p>Default review policies and automated submission parameters.</p></div><FiBriefcase className="settings-heading-icon" /></div>
        <div className="settings-fields-grid">{renderField("New job default status", "defaultJobStatus", { options: ["Pending review", "Draft", "Active"] })}{renderField("Maximum resume size", "maxResumeSize", { options: ["5 MB", "10 MB", "20 MB"] })}</div>
        {renderToggle("Require job review before publishing", "Scraped or imported jobs remain pending until approved.", "requireJobReview")}
      </section>
    );
    if (activeSection === "email-notifs") return (
      <section className="settings-panel-card">
        <div className="settings-panel-heading"><div><h3>Email & Notifications</h3><p>Manage administrative alert recipients and error digests.</p></div><FiMail className="settings-heading-icon" /></div>
        <div className="settings-fields-grid">{renderField("Notification recipients", "notificationRecipients", { type: "email" })}{renderField("Summary frequency", "emailDigest", { options: ["Immediately", "Daily", "Weekly"] })}</div>
        {renderToggle("Failed payment alerts", "Alert when a candidate retainer charge fails.", "notifyFailedPayments")}
        {renderToggle("Job source failure alerts", "Alert when crawler scraping encounters a block or error.", "notifyJobSourceFailures")}
      </section>
    );
    if (activeSection === "payments-tax") return (
      <section className="settings-panel-card">
        <div className="settings-panel-heading"><div><h3>Billing & Invoicing Preferences</h3><p>USD retainer defaults and placement commission invoicing.</p></div><FiCreditCard className="settings-heading-icon" /></div>
        <div className="settings-fields-grid">{renderField("Billing contact", "billingContact", { type: "email" })}{renderField("Invoice number prefix", "invoicePrefix", { maxLength: 20 })}{renderField("Default Currency", "currency", { options: ["USD ($)", "INR (₹)"] })}{renderField("Invoice footer note", "invoiceFooter", { type: "textarea", full: true })}</div>
      </section>
    );
    return (
      <section className="settings-panel-card">
        <div className="settings-panel-heading"><div><h3>Data Retention & Compliance</h3><p>Audit logging retention and candidate PII masking rules.</p></div><FiShield className="settings-heading-icon" /></div>
        <div className="settings-fields-grid">{renderField("Candidate data retention (days)", "userDataRetention", { type: "number", min: 30, max: 3650 })}{renderField("Audit log retention (days)", "auditLogRetention", { type: "number", min: 30, max: 3650 })}</div>
        {renderToggle("Mask personal data in candidate lists", "Conceal phone numbers and personal emails where possible.", "maskPersonalData")}
        <div className="settings-action-row"><div><strong>Export settings</strong><small>Download a JSON copy of saved platform settings.</small></div><button className="settings-secondary-button" onClick={() => downloadJson(savedSettings)}><FiDownload size={14} /> Export JSON</button></div>
      </section>
    );
  };

  const CurrentSectionIcon = iconByType[settingsNavSections.find((item) => item.id === activeSection)?.iconType] || FiSettings;

  return (
    <div className="settings-functional-page">
      <header className="settings-functional-header">
        <div>
          <h1>Settings</h1>
          <p>Manage AIFAGen Labs organization details, authorized administrators, and outside services.</p>
        </div>
      </header>
      <div className="settings-functional-layout">
        <nav className="settings-functional-nav" aria-label="Settings sections">
          {settingsNavSections.map((section) => {
            const Icon = iconByType[section.iconType] || FiSettings;
            return (
              <button
                key={section.id}
                className={activeSection === section.id ? "active" : ""}
                onClick={() => setActiveSection(section.id)}
                aria-current={activeSection === section.id ? "page" : undefined}
              >
                <Icon size={16} />
                <span>
                  <strong>{section.name}</strong>
                  <small>{section.desc}</small>
                </span>
              </button>
            );
          })}
        </nav>
        <main className="settings-functional-content">
          <div className="settings-content-title">
            <span><CurrentSectionIcon size={18} /></span>
            <div>
              <h2>{sectionTitles[activeSection] || "Settings Section"}</h2>
              <p>Configuration updates take effect across all portal sessions.</p>
            </div>
          </div>
          {renderSectionContent()}
        </main>
        <aside className="settings-history-panel">
          <h2>Settings History</h2>
          <div className="settings-last-editor">
            <small>Last changed by</small>
            <span className="settings-history-avatar">{sectionAuditHistory.lastChangedBy.initials}</span>
            <strong>{sectionAuditHistory.lastChangedBy.name}</strong>
            <small>{history.length ? history.at(-1).time : sectionAuditHistory.lastChangedBy.timestamp}</small>
          </div>
          <button className="settings-history-link" onClick={() => navigate("/audit-log")}>
            View audit log <FiArrowUpRight size={13} />
          </button>
          <div className="settings-history-list">
            <strong>Recent changes</strong>
            {[...history].reverse().slice(0, 6).map((item) => (
              <article key={item.id}>
                <span className="settings-history-dot"><FiFileText size={12} /></span>
                <div>
                  <b>{item.action}</b>
                  <small>{item.author} · {item.time}</small>
                  {item.snapshot && <button onClick={() => restoreHistory(item)}><FiRotateCcw size={11} /> Restore</button>}
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>

      {hasUnsavedChanges && (
        <div className="settings-save-bar">
          <div>
            <span className="settings-unsaved-dot" />
            <strong>Unsaved changes</strong>
            <span>Save or discard your edits before leaving.</span>
          </div>
          <div>
            <button className="settings-secondary-button" onClick={discardChanges}>Discard</button>
            <button className="settings-primary-button" onClick={saveChanges}><FiCheck size={14} /> Save changes</button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Removing Admin (Page 1, 6, 8 Spec) */}
      {adminToRemove && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-icon-alert">
                <FiAlertTriangle size={20} />
              </div>
              <div>
                <h3>Remove Administrator Access?</h3>
                <p>This action will immediately terminate their portal access.</p>
              </div>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to remove <strong>{adminToRemove.name} ({adminToRemove.email})</strong> from the authorized administrators list?
              </p>
              <p className="modal-subtext">
                They will no longer be able to log in to the AIFAGen Admin Portal. This change is permanently recorded in the Audit Log.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setAdminToRemove(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmRemoveAdmin}>
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="settings-toast" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss notification">
            <FiX size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
