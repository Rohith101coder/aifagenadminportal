import { useState } from "react";
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiEdit2,
  FiCopy,
  FiRefreshCw,
  FiSlash,
  FiEyeOff,
  FiMoreHorizontal,
  FiVolume2,
} from "react-icons/fi";
import { BsLinkedin } from "react-icons/bs";
import "./JobDetailsDrawer.css";

export default function JobDetailsDrawer({
  job,
  currentIndex,
  totalCount,
  onNext,
  onPrev,
  onClose,
  onExpire,
  onHide,
  onRefetch,
  onEdit,
  onNotify,
  onCopy,
}) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showFooterMoreActions, setShowFooterMoreActions] = useState(false);

  if (!job) return null;

  const copyText = (txt) => onCopy(txt);
  const openLink = (url) => window.open(url, "_blank", "noopener,noreferrer");

  return (
    <aside className="job-details-drawer">
      {/* Drawer Top Navigation Header */}
      <div className="drawer-top-bar">
        <h2 className="drawer-heading-title">Job Details</h2>
        <div className="drawer-nav-actions">
          <button
            className="nav-arrow-btn"
            onClick={onPrev}
            disabled={currentIndex <= 0}
          >
            <FiChevronLeft size={14} />
          </button>
          <span className="index-counter">
            {currentIndex + 1} of {totalCount}
          </span>
          <button
            className="nav-arrow-btn"
            onClick={onNext}
            disabled={currentIndex >= totalCount - 1}
          >
            <FiChevronRight size={14} />
          </button>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <FiX size={17} />
          </button>
        </div>
      </div>

      <div className="drawer-scrollable-area">
        {/* Main Job Banner */}
        <div className="job-header-card">
          <div className="job-logo-area">
            {job.logo ? (
              <img
                src={job.logo}
                alt={job.company}
                className="drawer-company-logo"
              />
            ) : job.isInternal || job.source === "AiFAGen" || job.company?.toLowerCase().includes("aifagen") ? (
              <img
                src="/aifagenlogo-icon.png"
                alt="AiFAGen"
                className="drawer-company-logo"
              />
            ) : (
              <div className="drawer-company-placeholder">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#3b82f6" />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="job-header-info">
            <div className="job-title-row">
              <h3>{job.title}</h3>
              <span className={`status-pill ${job.status.toLowerCase()}`}>
                <span className="dot"></span>
                {job.status}
              </span>
            </div>

            <div className="company-sound-row">
              <span className="company-title-bold">{job.company}</span>
              <button
                className="sound-icon-btn"
                aria-label={`Speak company name ${job.company}`}
                onClick={() => {
                  if (!("speechSynthesis" in window)) {
                    onNotify("Speech playback is not supported in this browser.");
                    return;
                  }
                  window.speechSynthesis.cancel();
                  window.speechSynthesis.speak(new SpeechSynthesisUtterance(job.company));
                }}
              >
                <FiVolume2 size={13} />
              </button>
            </div>

            <div className="badges-meta-row">
              <span className="public-job-tag">
                {job.type === "internal" ? "Internal Job" : "Public Job"}
              </span>
              <span className="source-pill-meta">
                <BsLinkedin size={11} color="#0077b5" />
                <span>From {job.source}</span>
              </span>
              {job.duplicatesCount && (
                <span className="duplicates-tag">
                  {job.source} {job.duplicatesCount} duplicates
                </span>
              )}
            </div>

            <div className="fetch-timestamps-list">
              <span className="timestamp-line">
                <span className="time-dot"></span>
                Posted ~{job.postedOnSource}
              </span>
              <span className="timestamp-line">
                <span className="time-dot"></span>
                Fetched {job.fetchedOn}
              </span>
            </div>
          </div>
        </div>

        {/* CTA Buttons Row */}
        <div className="drawer-cta-row">
          <button
            className="btn-primary-blue"
            onClick={() => openLink(job.applicationLink)}
          >
            <span>View Original</span>
            <FiExternalLink size={13} />
          </button>
          <button
            className="btn-outline-action"
            onClick={() => openLink(job.sourceDetails.sourceUrl)}
          >
            <span>Open source</span>
            <FiExternalLink size={13} />
          </button>
          <button
            className="btn-icon-more"
            aria-label="More job actions"
            aria-expanded={showMoreActions}
            onClick={() => setShowMoreActions((visible) => !visible)}
          >
            <FiMoreHorizontal size={15} />
          </button>
          {showMoreActions && <div className="job-drawer-more-menu">
            <button onClick={() => { onEdit(job); setShowMoreActions(false); }}><FiEdit2 size={13} />Edit job</button>
            <button onClick={() => { onCopy(job.id); setShowMoreActions(false); }}><FiCopy size={13} />Copy job ID</button>
            <button onClick={() => { onRefetch(job); setShowMoreActions(false); }}><FiRefreshCw size={13} />Refresh record</button>
          </div>}
        </div>

        {/* Navigation Tabs */}
        <div className="drawer-navigation-tabs">
          {[
            "Overview",
            "Description",
            "Company",
            "Source Info",
            "Activity",
          ].map((tab) => (
            <button
              key={tab}
              className={`drawer-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && <>
        {/* Section: Basic Information */}
        <section className="drawer-content-box">
          <div className="section-head">
            <h4>Basic Information</h4>
            <button
              className="btn-edit-badge"
              onClick={() => onEdit(job)}
            >
              <FiEdit2 size={11} />
              <span>Edit</span>
            </button>
          </div>

          <div className="kv-grid-two-column">
            <div className="kv-item">
              <label>Job Title</label>
              <p>{job.title}</p>
            </div>
            <div className="kv-item">
              <label>Company</label>
              <p>{job.company}</p>
            </div>
            <div className="kv-item">
              <label>Job Type</label>
              <p>{job.employmentType.split(" · ")[0]}</p>
            </div>
            <div className="kv-item">
              <label>Experience</label>
              <p>{job.experience}</p>
            </div>
            <div className="kv-item">
              <label>Location</label>
              <div className="loc-wrap">
                <p>{job.location}</p>
                <span className="mode-pill">{job.workMode}</span>
              </div>
            </div>
            <div className="kv-item">
              <label>Salary</label>
              <p className="salary-val">
                {job.salary} <span className="sub-note">{job.salaryNote}</span>
              </p>
            </div>
            <div className="kv-item">
              <label>Posted On (source)</label>
              <p>{job.postedOnSource}</p>
            </div>
            <div className="kv-item">
              <label>Fetched On</label>
              <p>{job.fetchedOn}</p>
            </div>
          </div>

          <div className="application-link-strip">
            <label>Application Link</label>
            <div className="link-copy-row">
              <a
                href={job.applicationLink}
                target="_blank"
                rel="noreferrer"
                className="raw-link"
              >
                {job.applicationLink}
              </a>
              <button
                className="copy-link-btn"
                onClick={() => copyText(job.applicationLink)}
              >
                <FiExternalLink size={12} />
              </button>
            </div>
          </div>

          {/* 4 Analytics Metrics */}
          <div className="job-mini-kpis-grid">
            <div className="mini-kpi">
              <span className="mini-label">Applications</span>
              <span className="mini-val">{job.appsCount}</span>
            </div>
            <div className="mini-kpi">
              <span className="mini-label">Saves</span>
              <span className="mini-val">{job.savesCount}</span>
            </div>
            <div className="mini-kpi">
              <span className="mini-label">Views</span>
              <span className="mini-val">{job.viewsCount}</span>
            </div>
            <div className="mini-kpi">
              <span className="mini-label">Conversion</span>
              <span className="mini-val">{job.conversionRate}</span>
            </div>
          </div>
        </section>

        {/* Section: Job Source Information */}
        <section className="drawer-content-box">
          <div className="section-head">
            <h4>Job Source Information</h4>
            <button
              className="btn-text-link"
              onClick={() => openLink(job.sourceDetails.sourceUrl)}
            >
              View Source
            </button>
          </div>

          <div className="source-provider-badge">
            <span className="source-in-box">in</span>
            <span className="source-name-bold">
              {job.sourceDetails.sourceName}
            </span>
          </div>

          <div className="source-specs-list">
            <div className="spec-row">
              <span className="spec-label">Source Job ID</span>
              <span className="spec-val-copy">
                {job.sourceDetails.sourceJobId}
                <FiCopy
                  size={11}
                  className="copy-icon"
                  onClick={() => copyText(job.sourceDetails.sourceJobId)}
                />
              </span>
            </div>

            <div className="spec-row">
              <span className="spec-label">Source URL</span>
              <a
                href={job.sourceDetails.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="spec-link"
              >
                {job.sourceDetails.sourceUrl}
                <FiExternalLink size={11} />
              </a>
            </div>

            <div className="spec-row">
              <span className="spec-label">Source Status</span>
              <span className="status-healthy">
                <span className="dot-green"></span>
                {job.sourceDetails.status}
              </span>
            </div>

            <div className="spec-row">
              <span className="spec-label">Last Fetched</span>
              <span className="spec-val">{job.sourceDetails.lastFetched}</span>
            </div>

            <div className="spec-row">
              <span className="spec-label">Next Scheduled Fetch</span>
              <span className="spec-val">
                {job.sourceDetails.nextScheduled}
              </span>
            </div>
          </div>
        </section>

        {/* Section: Duplicates */}
        {job.duplicates && job.duplicates.length > 0 && (
          <section className="drawer-content-box">
            <div className="section-head">
              <h4>Duplicates ({job.duplicates.length})</h4>
              <button
                className="btn-text-link"
                onClick={() => onNotify(`${job.duplicates.length} matching posting(s) are listed below.`)}
              >
                View all
              </button>
            </div>

            <div className="duplicates-stack">
              {job.duplicates.map((dup, idx) => (
                <div key={idx} className="dup-item-row">
                  <div className="dup-left">
                    <span className={`dup-source-icon ${dup.icon}`}>
                      {dup.portal.charAt(0)}
                    </span>
                    <div className="dup-text-meta">
                      <span className="dup-job-title">{job.title}</span>
                      <span className="dup-sub">
                        {dup.portal} · {dup.timeAgo}
                      </span>
                    </div>
                  </div>

                  <div className="dup-right">
                    <span className="match-score-badge">
                      Match {dup.matchScore}
                    </span>
                    <button
                      className="btn-view-dup"
                      onClick={() => openLink(job.applicationLink)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        </>}
        {activeTab === "Description" && <section className="drawer-content-box">
          <div className="section-head"><h4>Job Description</h4><button className="btn-edit-badge" onClick={() => onEdit(job)}><FiEdit2 size={11} />Edit</button></div>
          <p className="job-drawer-copy">{job.description || `${job.title} at ${job.company}. ${job.employmentType} role based in ${job.location} (${job.workMode}), requiring ${job.experience} of experience. ${job.salary ? `Compensation: ${job.salary}.` : ""}`}</p>
        </section>}
        {activeTab === "Company" && <section className="drawer-content-box">
          <h4>Company Information</h4>
          <div className="kv-grid-two-column">
            <div className="kv-item"><label>Company</label><p>{job.company}</p></div>
            <div className="kv-item"><label>Listing type</label><p>{job.type === "internal" ? "Internal opening" : "Public posting"}</p></div>
            <div className="kv-item"><label>Work mode</label><p>{job.workMode}</p></div>
            <div className="kv-item"><label>Source</label><p>{job.sourceDetails.sourceName}</p></div>
          </div>
          <a className="spec-link" href={job.sourceDetails.sourceUrl} target="_blank" rel="noreferrer">Company/job source <FiExternalLink size={11} /></a>
        </section>}
        {activeTab === "Source Info" && <section className="drawer-content-box">
          <h4>Source Information</h4>
          <div className="source-specs-list">
            <div className="spec-row"><span className="spec-label">Provider</span><span className="spec-val">{job.sourceDetails.sourceName}</span></div>
            <div className="spec-row"><span className="spec-label">Source job ID</span><span className="spec-val-copy">{job.sourceDetails.sourceJobId}<button className="copy-link-btn" aria-label="Copy source job ID" onClick={() => copyText(job.sourceDetails.sourceJobId)}><FiCopy size={11} /></button></span></div>
            <div className="spec-row"><span className="spec-label">Source health</span><span className="status-healthy">{job.sourceDetails.status}</span></div>
            <div className="spec-row"><span className="spec-label">Last fetched</span><span className="spec-val">{job.sourceDetails.lastFetched}</span></div>
            <div className="spec-row"><span className="spec-label">Next scheduled</span><span className="spec-val">{job.sourceDetails.nextScheduled}</span></div>
          </div>
          <a className="spec-link" href={job.sourceDetails.sourceUrl} target="_blank" rel="noreferrer">Open source listing <FiExternalLink size={11} /></a>
        </section>}
        {activeTab === "Activity" && <section className="drawer-content-box">
          <h4>Job Activity</h4>
          <div className="job-activity-item"><span className="job-activity-dot" /><div><strong>{job.status}</strong><p>Current job status</p></div></div>
          <div className="job-activity-item"><span className="job-activity-dot" /><div><strong>{job.fetchedOn}</strong><p>Latest source fetch</p></div></div>
          <div className="job-activity-item"><span className="job-activity-dot" /><div><strong>{job.addedTimestamp}</strong><p>Added to AiFAGen</p></div></div>
        </section>}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="drawer-bottom-bar">
        <button className="bar-action-btn" onClick={() => onRefetch(job)}>
          <FiRefreshCw size={12} />
          <span>Re-fetch</span>
        </button>
        <button className="bar-action-btn" onClick={() => onExpire(job)} disabled={job.status === "Expired" || job.status === "Hidden"}>
          <FiSlash size={12} />
          <span>Mark as expired</span>
        </button>
        <button
          className="bar-action-btn btn-danger-fill"
          onClick={() => onHide(job)}
        >
          <FiEyeOff size={12} />
          <span>Hide job</span>
        </button>
        <button className="bar-more-btn" aria-label="More footer job actions" aria-expanded={showFooterMoreActions} onClick={() => setShowFooterMoreActions((visible) => !visible)}>
          <FiMoreHorizontal size={14} />
        </button>
        {showFooterMoreActions && <div className="job-drawer-more-menu footer-more-menu">
          <button onClick={() => { onEdit(job); setShowFooterMoreActions(false); }}><FiEdit2 size={13} />Edit job</button>
          <button onClick={() => { onCopy(job.applicationLink); setShowFooterMoreActions(false); }}><FiCopy size={13} />Copy application link</button>
          <button onClick={() => { onRefetch(job); setShowFooterMoreActions(false); }}><FiRefreshCw size={13} />Re-fetch details</button>
        </div>}
      </div>
    </aside>
  );
}
