import { useState } from "react";
import {
  FiX,
  FiEye,
  FiCopy,
  FiEdit2,
  FiInfo,
  FiCreditCard,
  FiSend,
  FiMoreHorizontal,
  FiBookmark,
  FiUserCheck,
  FiFileText,
  FiAward,
  FiCheckCircle,
  FiBriefcase,
  FiExternalLink,
  FiCalendar,
  FiCpu,
} from "react-icons/fi";
import { BsArrowDownRight, BsArrowUpRight } from "react-icons/bs";
import "./UserDetailsDrawer.css";

export default function UserDetailsDrawer({
  user,
  onClose,
  onEdit,
  onChangePlan,
  onContact,
  onSuspend,
  onNotify,
}) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [showMoreActions, setShowMoreActions] = useState(false);

  if (!user) return null;

  const copyToClipboard = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      onNotify(`${label} copied.`);
    } catch {
      onNotify(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "#10b981"; // emerald
    if (score >= 80) return "#2563eb"; // blue
    if (score >= 70) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  return (
    <aside className="user-details-drawer">
      {/* Drawer Header */}
      <div className="drawer-header">
        <div className="drawer-user-info-row">
          <div className="drawer-avatar">{user.initials}</div>
          <div className="drawer-title-meta">
            <div className="drawer-name-badge">
              <h2>{user.name}</h2>
              <span className={`user-status-pill ${(user.accountStatus || "active").toLowerCase()}`}>
                {user.accountStatus}
              </span>
            </div>
            <div className="drawer-email-row">
              <span className="drawer-email">{user.email}</span>
              <button
                className="icon-copy-btn"
                aria-label="Copy email address"
                title="Copy email address"
                onClick={() => copyToClipboard(user.email, "Email address")}
              >
                <FiCopy size={13} />
              </button>
            </div>
            <div className="drawer-phone-row">
              <span className="drawer-phone">{user.phone}</span>
              <button
                className="icon-copy-btn"
                aria-label="Copy phone number"
                title="Copy phone number"
                onClick={() => copyToClipboard(user.phone, "Phone number")}
              >
                <FiCopy size={13} />
              </button>
            </div>
            <span className="drawer-meta-sub">
              Joined {user.joinedDate || user.joinDate} · Last active {user.lastActive}
            </span>
          </div>
        </div>
        <button className="close-drawer-btn" onClick={onClose} aria-label="Close">
          <FiX size={18} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="drawer-tabs">
        {["Overview", "Resumes & ATS", "Applications", "Saved Jobs", "Billing"].map((tab) => (
          <button
            key={tab}
            className={`drawer-tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Scrollable Content Body */}
      <div className="drawer-content-scroll">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "Overview" && (
          <>
            {/* Key Information Box */}
            <section className="drawer-section">
              <div className="section-title-row">
                <h4>Key Information</h4>
                <button className="edit-btn" onClick={onEdit}>
                  <FiEdit2 size={12} />
                  <span>Edit Profile</span>
                </button>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name</label>
                  <p>{user.name}</p>
                </div>
                <div className="info-item">
                  <label>Email (Login ID)</label>
                  <p>{user.email}</p>
                </div>
                <div className="info-item">
                  <label>Mobile</label>
                  <div className="item-with-action">
                    <p>{user.phone}</p>
                    <FiEye size={13} className="field-icon" />
                  </div>
                </div>
                <div className="info-item">
                  <label>Location</label>
                  <p>{user.location || "Not provided"}</p>
                </div>
                <div className="info-item">
                  <label>Area of Interest</label>
                  <p className="area-badge-highlight">{user.areaOfInterest || "Not provided"}</p>
                </div>
                <div className="info-item">
                  <label>Headline</label>
                  <p>{user.headline || "Not provided"}</p>
                </div>
              </div>
            </section>

            {/* Job Preferences Box (Page 7 Spec) */}
            <section className="drawer-section">
              <div className="section-title-row">
                <h4>Candidate Job Preferences</h4>
                <span className="sub-note">US Placement Parameters</span>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <label>Target Role</label>
                  <p>{user.jobPreferences?.targetRole || "Software Engineering"}</p>
                </div>
                <div className="info-item">
                  <label>Work Authorization</label>
                  <span className="visa-badge">
                    {user.jobPreferences?.workAuth || "STEM OPT / H-1B"}
                  </span>
                </div>
                <div className="info-item">
                  <label>Preferred US Location</label>
                  <p>{user.jobPreferences?.preferredLocation || "US Wide / Remote"}</p>
                </div>
                <div className="info-item">
                  <label>Target Compensation</label>
                  <p>{user.jobPreferences?.expectedSalary || "$110,000+ / yr or $65/hr C2C"}</p>
                </div>
              </div>
            </section>

            {/* Quick Resumes Preview */}
            <section className="drawer-section">
              <div className="section-title-row">
                <h4>Uploaded Resumes &amp; ATS Match</h4>
                <button className="view-link-btn" onClick={() => setActiveTab("Resumes & ATS")}>
                  View all ({user.resumes?.length || 0})
                </button>
              </div>
              <div className="resumes-compact-list">
                {(user.resumes || []).slice(0, 2).map((res) => (
                  <div key={res.id} className="resume-compact-row">
                    <div className="resume-icon-block">
                      <FiFileText size={16} />
                    </div>
                    <div className="resume-compact-info">
                      <span className="resume-name">{res.fileName}</span>
                      <small>Uploaded {res.uploadedDate}</small>
                    </div>
                    <div className="score-badges-row">
                      <span className="score-badge" style={{ borderColor: getScoreColor(res.resumeScore), color: getScoreColor(res.resumeScore) }}>
                        Score {res.resumeScore}%
                      </span>
                      <span className="score-badge ats" style={{ borderColor: getScoreColor(res.atsScore), color: getScoreColor(res.atsScore) }}>
                        ATS {res.atsScore}%
                      </span>
                    </div>
                  </div>
                ))}
                {(!user.resumes || user.resumes.length === 0) && (
                  <p className="drawer-empty-state">No resumes uploaded yet.</p>
                )}
              </div>
            </section>

            {/* Usage Summary */}
            <section className="drawer-section">
              <div className="section-title-row">
                <h4>
                  Platform &amp; AI Usage <span className="sub-note">(Last 30 days)</span>
                </h4>
              </div>
              <div className="usage-cards-row">
                <div className="usage-stat-box">
                  <div className="usage-icon-bubble purple-bubble">
                    <FiCpu size={14} />
                  </div>
                  <div className="usage-meta">
                    <span className="usage-name">AI Calls</span>
                    <div className="usage-num-row">
                      <span className="usage-number">{user.aiUse30Days || user.aiCalls || 0}</span>
                      <span className={`usage-trend ${(user.aiCallsChange ?? "0%").startsWith("-") ? "down" : "up"}`}>
                        {(user.aiCallsChange ?? "0%").startsWith("-") ? <BsArrowDownRight size={10} /> : <BsArrowUpRight size={10} />}{" "}
                        {user.aiCallsChange ?? "+12%"}
                      </span>
                    </div>
                    <span className="usage-footnote">Resume &amp; mock prep queries</span>
                  </div>
                </div>

                <div className="usage-stat-box">
                  <div className="usage-icon-bubble green-bubble">
                    <FiBookmark size={14} />
                  </div>
                  <div className="usage-meta">
                    <span className="usage-name">Saved Jobs</span>
                    <div className="usage-num-row">
                      <span className="usage-number">{user.savedJobsList?.length || user.savedJobs || 0}</span>
                      <span className={`usage-trend ${(user.savedJobsChange ?? "0%").startsWith("-") ? "down" : "up"}`}>
                        {(user.savedJobsChange ?? "0%").startsWith("-") ? <BsArrowDownRight size={10} /> : <BsArrowUpRight size={10} />}{" "}
                        {user.savedJobsChange ?? "+8%"}
                      </span>
                    </div>
                    <span className="usage-footnote">Targeted openings</span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* TAB 2: RESUMES & ATS (Specification Page 5 & 7) */}
        {activeTab === "Resumes & ATS" && (
          <section className="drawer-section">
            <div className="section-title-row">
              <h4>Candidate Uploaded Resumes</h4>
              <span className="sub-note">{user.resumes?.length || 0} files on file</span>
            </div>
            <div className="resumes-full-list">
              {(user.resumes || []).map((res) => (
                <div key={res.id} className="resume-detail-card">
                  <div className="resume-card-top">
                    <div className="resume-type-icon">
                      <FiFileText size={20} />
                    </div>
                    <div className="resume-meta-block">
                      <strong className="resume-title">{res.fileName}</strong>
                      <span className="resume-format">{res.format || "PDF"}</span>
                      <small>Uploaded on {res.uploadedDate} · Evaluated by AIFAGen ATS Engine</small>
                    </div>
                  </div>
                  <div className="scores-benchmark-grid">
                    <div className="score-metric-box">
                      <span className="metric-label">Overall Resume Score</span>
                      <div className="score-ring-row">
                        <span className="score-number" style={{ color: getScoreColor(res.resumeScore) }}>
                          {res.resumeScore} / 100
                        </span>
                        <span className="score-tag-text">
                          {res.resumeScore >= 90 ? "Excellent" : "Good"}
                        </span>
                      </div>
                      <small>Keyword density, grammar, impact metrics</small>
                    </div>

                    <div className="score-metric-box">
                      <span className="metric-label">ATS Compatibility Score</span>
                      <div className="score-ring-row">
                        <span className="score-number" style={{ color: getScoreColor(res.atsScore) }}>
                          {res.atsScore} / 100
                        </span>
                        <span className="score-tag-text ats">Workday &amp; Taleo Ready</span>
                      </div>
                      <small>Passed parsing without table/formatting errors</small>
                    </div>
                  </div>
                  <div className="resume-card-actions">
                    <button
                      className="btn-download-resume"
                      onClick={() => onNotify(`Downloading ${res.fileName} from AWS S3...`)}
                    >
                      <span>Download Resume</span>
                    </button>
                    <button
                      className="btn-view-keywords"
                      onClick={() => onNotify(`Matched keywords: ${user.areaOfInterest}, REST APIs, Cloud architecture.`)}
                    >
                      <span>View Keywords Match</span>
                    </button>
                  </div>
                </div>
              ))}
              {(!user.resumes || user.resumes.length === 0) && (
                <div className="empty-section-box">
                  <FiFileText size={28} />
                  <p>No resumes uploaded yet.</p>
                  <small>Candidates upload resumes on their portal to be engineered by our team.</small>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 3: APPLICATIONS (Specification Page 5 & 7) */}
        {activeTab === "Applications" && (
          <section className="drawer-section">
            <div className="section-title-row">
              <h4>Automated &amp; Team Submissions</h4>
              <span className="sub-note">{user.applications?.length || 0} applications</span>
            </div>
            <div className="applications-timeline">
              {(user.applications || []).map((app) => (
                <div key={app.id} className="application-item-card">
                  <div className="app-header-row">
                    <div>
                      <strong className="app-role">{app.role}</strong>
                      <span className="app-company">{app.company}</span>
                    </div>
                    <span className={`app-status-badge ${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="app-meta-footer">
                    <span>
                      <FiCalendar size={12} /> Applied on {app.appliedDate}
                    </span>
                    <span className="app-source-tag">Source: {app.source || "Automated Batch"}</span>
                  </div>
                </div>
              ))}
              {(!user.applications || user.applications.length === 0) && (
                <div className="empty-section-box">
                  <FiBriefcase size={28} />
                  <p>No job applications submitted yet.</p>
                  <small>Automated daily batches will appear here once candidate marketing begins.</small>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 4: SAVED JOBS (Specification Page 5) */}
        {activeTab === "Saved Jobs" && (
          <section className="drawer-section">
            <div className="section-title-row">
              <h4>Candidate Saved Jobs</h4>
              <span className="sub-note">{user.savedJobsList?.length || 0} bookmarked</span>
            </div>
            <div className="saved-jobs-list">
              {(user.savedJobsList || []).map((sj) => (
                <div key={sj.id} className="saved-job-card">
                  <div>
                    <strong className="sj-title">{sj.title}</strong>
                    <span className="sj-company">{sj.company} · {sj.location}</span>
                  </div>
                  <span className="sj-date">{sj.date}</span>
                </div>
              ))}
              {(!user.savedJobsList || user.savedJobsList.length === 0) && (
                <div className="empty-section-box">
                  <FiBookmark size={28} />
                  <p>No saved jobs found for this candidate.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 5: BILLING & ACCOUNT */}
        {activeTab === "Billing" && (
          <section className="drawer-section">
            <div className="section-title-row">
              <h4>Subscription &amp; Retainer</h4>
              <button className="edit-btn" onClick={onChangePlan}>
                <FiCreditCard size={12} />
                <span>Change Plan</span>
              </button>
            </div>
            <div className="sub-key-value-list">
              <div className="sub-row">
                <span className="sub-label">Current Plan</span>
                <span className="plan-badge-inline">{user.plan}</span>
              </div>
              <div className="sub-row">
                <span className="sub-label">Subscription Status</span>
                <span className="status-inline-tag">
                  <span className="dot-green"></span>
                  {user.subscriptionStatus}
                </span>
              </div>
              <div className="sub-row">
                <span className="sub-label">Joined Date</span>
                <span className="sub-value">{user.joinedDate || user.joinDate || "N/A"}</span>
              </div>
              <div className="sub-row">
                <span className="sub-label">Plan End / Renewal</span>
                <span className="sub-value renewal-wrap">
                  {user.planEndDate || user.nextRenewal || "N/A"}
                  <FiInfo size={12} className="info-bubble" />
                </span>
              </div>
              <div className="sub-row">
                <span className="sub-label">Last Payment</span>
                <span className="sub-value">{user.lastPayment || "None"}</span>
              </div>
              <div className="sub-row">
                <span className="sub-label">Payment Method</span>
                <span className="sub-value payment-method-tag">
                  {user.paymentMethod || "Not added"}
                </span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Drawer Action Footer */}
      <div className="drawer-footer">
        <button className="action-btn outline-btn" onClick={() => onNotify("Impersonation token created. Opening candidate portal in demo mode.")}>
          <FiUserCheck size={14} />
          <span>Impersonate</span>
        </button>
        <button className="action-btn primary-btn" onClick={onContact}>
          <FiSend size={14} />
          <span>Contact Candidate</span>
        </button>
        <div className="drawer-more-wrap">
          <button
            className="more-btn"
            aria-label="More user actions"
            aria-expanded={showMoreActions}
            onClick={() => setShowMoreActions((visible) => !visible)}
          >
            <FiMoreHorizontal size={15} />
          </button>
          {showMoreActions && (
            <div className="drawer-more-menu">
              <button
                onClick={() => {
                  onSuspend(user);
                  setShowMoreActions(false);
                }}
              >
                {user.accountStatus === "Suspended" ? "Reactivate account" : "Suspend account"}
              </button>
              <button
                onClick={() => {
                  onChangePlan();
                  setShowMoreActions(false);
                }}
              >
                Change Plan Tier
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
