import { useState } from "react";
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiEdit2,
  FiExternalLink,
  FiSlash,
  FiCheckCircle,
  FiMoreHorizontal,
  FiArrowUpRight,
} from "react-icons/fi";
import "./InterviewDetailsDrawer.css";

export default function InterviewDetailsDrawer({
  candidate,
  currentIndex,
  totalCount,
  onNext,
  onPrev,
  onClose,
  onMoveToNextRound,
  onRejectCandidate,
  onReschedule,
  onCancelInterview,
  onEditCandidate,
  onSaveNotes,
}) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [notes, setNotes] = useState(candidate?.notes || "");

  if (!candidate) return null;

  return (
    <aside className="interview-details-drawer">
      {/* Top Header Pagination */}
      <div className="drawer-top-bar">
        <div className="empty-spacer"></div>
        <div className="top-nav-cluster">
          <button
            className="arrow-btn"
            onClick={onPrev}
            disabled={currentIndex <= 0}
          >
            <FiChevronLeft size={14} />
          </button>
          <span className="count-label">
            {currentIndex + 1} of {totalCount}
          </span>
          <button
            className="arrow-btn"
            onClick={onNext}
            disabled={currentIndex >= totalCount - 1}
          >
            <FiChevronRight size={14} />
          </button>
          <button
            className="close-drawer-x"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={17} />
          </button>
        </div>
      </div>

      <div className="drawer-body-scroll">
        {/* Candidate Summary Card */}
        <div className="candidate-header-block">
          <div
            className="candidate-avatar-lg"
            style={{ backgroundColor: candidate.avatarBg }}
          >
            {candidate.initials}
          </div>
          <div className="candidate-meta-stack">
            <div className="name-badge-line">
              <h3>{candidate.name}</h3>
              <span className={`candidate-drawer-status ${candidate.statusClass}`}>
                <span className="dot-blue"></span> {candidate.status}
              </span>
            </div>
            <span className="candidate-role-sub">{candidate.jobTitle}</span>
            <div className="contact-details-line">
              <span>{candidate.location}</span>
              <span>·</span>
              <a href={`mailto:${candidate.email}`}>{candidate.email}</a>
              <span>·</span>
              <a href={`tel:${candidate.phone}`}>{candidate.phone}</a>
            </div>
          </div>
        </div>

        {/* Tab Links */}
        <div className="drawer-tabs-strip">
          {["Overview", "Interviews", "Feedback", "Activity", "Notes"].map(
            (tab) => (
              <button
                key={tab}
                className={`drawer-tab-item ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ),
          )}
        </div>

        {(activeTab === "Overview" || activeTab === "Activity") && <>
        {/* Current Hiring Progress */}
        <section className="drawer-card-box">
          <div className="card-box-header">
            <h4>Current Hiring Progress</h4>
            <button
              className="link-view-job"
              onClick={() => window.location.assign("/jobs")}
            >
              <span>View in Job</span>
              <FiArrowUpRight size={13} />
            </button>
          </div>

          <div className="target-job-banner">
            <div className="job-logo-box">
              {candidate.logo ? (
                <img
                  src={candidate.logo}
                  alt={candidate.company}
                  className="logo-img"
                />
              ) : candidate.company?.toLowerCase().includes("aifagen") ? (
                <img
                  src="/aifagenlogo.png"
                  alt="AiFAGen"
                  className="logo-img"
                />
              ) : (
                <span className="logo-placeholder">{candidate.company ? candidate.company.charAt(0) : "A"}</span>
              )}
            </div>
            <div className="target-job-info">
              <span className="job-title-bold">{candidate.jobTitle}</span>
              <span className="job-sub-desc">
                {candidate.department} · {candidate.employmentType}
              </span>
            </div>
          </div>

          {/* Vertical Stepper Timeline */}
          <div className="stepper-timeline">
            {(candidate.hiringProgress && candidate.hiringProgress.length > 0
              ? candidate.hiringProgress
              : [
                  { stage: "Applied", date: "Sep 28, 2026", completed: true },
                  { stage: "Screening", date: "Oct 1, 2026", completed: true },
                  {
                    stage: "Technical Round 1",
                    date: "Oct 5, 2026",
                    completed: true,
                  },
                  {
                    stage: "Technical Round 2",
                    date: "Oct 12, 2026 · 11:00 AM",
                    current: true,
                  },
                  { stage: "Manager Round", date: "", pending: true },
                  { stage: "HR Round", date: "", pending: true },
                  { stage: "Offer", date: "", pending: true },
                  { stage: "Hired", date: "", pending: true },
                ]
            ).map((step, idx) => (
              <div key={idx} className="stepper-node">
                <div className="stepper-node-marker">
                  {step.completed && (
                    <span className="marker-dot completed"></span>
                  )}
                  {step.current && <span className="marker-dot current"></span>}
                  {step.pending && <span className="marker-dot pending"></span>}
                  {idx < 7 && <span className="marker-vertical-line"></span>}
                </div>
                <div className="stepper-node-body">
                  <span
                    className={`node-stage-name ${step.current ? "current-active" : ""}`}
                  >
                    {step.stage}
                  </span>
                  {step.date && (
                    <span className="node-stage-date">{step.date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
        </>}

        {(activeTab === "Overview" || activeTab === "Interviews") && <>
        {/* Interview Details */}
        <section className="drawer-card-box">
          <div className="card-box-header">
            <h4>Interview Details</h4>
            <button
              className="btn-edit-badge"
              onClick={() => onEditCandidate(candidate)}
            >
              <FiEdit2 size={11} />
              <span>Edit</span>
            </button>
          </div>

          <div className="details-kv-table">
            <div className="kv-item-row">
              <span className="kv-label">Stage</span>
              <span className="kv-val">{candidate.currentStage}</span>
            </div>
            <div className="kv-item-row">
              <span className="kv-label">Interview Date</span>
              <span className="kv-val date-cal">
                {candidate.interviewDate}, {candidate.interviewTime}
                <FiCalendar size={12} className="cal-icon" />
              </span>
            </div>
            <div className="kv-item-row">
              <span className="kv-label">Mode</span>
              <span className="kv-val link-mode">
                {candidate.mode}
                {candidate.meetingUrl ? <a href={candidate.meetingUrl} target="_blank" rel="noreferrer" aria-label="Open meeting link"><FiExternalLink size={11} /></a> : null}
              </span>
            </div>
            <div className="kv-item-row">
              <span className="kv-label">Interviewers</span>
              <div className="interviewers-chips-col">
                {candidate.interviewers.map((int, i) => (
                  <div key={i} className="interviewer-chip-line">
                    <span
                      className="avatar-micro"
                      style={{ backgroundColor: int.bg }}
                    >
                      {int.initials}
                    </span>
                    <span className="int-name">{int.name}</span>
                    {int.title && (
                      <span className="int-title-muted">{int.title}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="kv-item-row">
              <span className="kv-label">Duration</span>
              <span className="kv-val">{candidate.duration}</span>
            </div>
            <div className="kv-item-row">
              <span className="kv-label">Focus Areas</span>
              <span className="kv-val">{candidate.focusAreas}</span>
            </div>
            <div className="kv-item-row">
              <span className="kv-label">Status</span>
              <span className="status-scheduled-badge">{candidate.status}</span>
            </div>
          </div>

          <div className="reschedule-cancel-row">
            <button
              className="btn-box-outline"
              onClick={() => onReschedule(candidate)}
              disabled={["Completed", "Withdrawn", "Rejected", "Hired"].includes(candidate.status)}
            >
              <FiCalendar size={12} />
              <span>Reschedule</span>
            </button>
            <button
              className="btn-box-outline danger"
              onClick={() => onCancelInterview(candidate)}
              disabled={["Withdrawn", "Rejected", "Hired"].includes(candidate.status)}
            >
              <FiSlash size={12} />
              <span>Cancel interview</span>
            </button>
          </div>
        </section>
        </>}

        {/* Past Rounds */}
        {(activeTab === "Overview" || activeTab === "Interviews" || activeTab === "Feedback") && (
          <section className="drawer-card-box">
            <div className="card-box-header">
              <h4>{activeTab === "Feedback" ? "Interview feedback" : "Past Rounds"}</h4>
              <button
                className="btn-view-all-link"
                onClick={() => setActiveTab(activeTab === "Feedback" ? "Interviews" : "Feedback")}
              >
                {activeTab === "Feedback" ? "View rounds" : "View feedback"}
              </button>
            </div>

            <div className="past-rounds-table-wrap">
              <table className="past-rounds-table">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Date</th>
                    <th>Interviewer</th>
                    <th>Feedback</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(candidate.pastRounds || []).map((r, idx) => (
                    <tr key={idx}>
                      <td className="bold">{r.round}</td>
                      <td>{r.date}</td>
                      <td>{r.interviewer}</td>
                      <td className="bold">{r.feedback}</td>
                      <td>
                        <span className="badge-passed">{r.status}</span>
                      </td>
                    </tr>
                  ))}
                  {!candidate.pastRounds?.length && <tr><td colSpan="5" className="drawer-empty-cell">No past interview rounds have been recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {activeTab === "Activity" && <section className="drawer-card-box">
          <div className="card-box-header"><h4>Candidate activity</h4></div>
          {(candidate.hiringProgress || []).length
            ? candidate.hiringProgress.map((item, index) => <div className="candidate-activity-entry" key={`${item.stage}-${index}`}><strong>{item.stage}</strong><span>{item.date || (item.pending ? "Pending" : "In progress")}</span></div>)
            : <p className="drawer-empty-cell">No activity history has been recorded.</p>}
        </section>}
        {activeTab === "Notes" && <section className="drawer-card-box">
          <div className="card-box-header"><h4>Recruiter notes</h4></div>
          <textarea className="candidate-notes-input" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add interview notes for this candidate..." />
          <button className="btn-edit-badge" onClick={() => onSaveNotes(candidate, notes)}>Save notes</button>
          <p className="notes-disclaimer">Notes are held in this page session only; no backend is connected.</p>
        </section>}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="drawer-bottom-bar">
        <button
          className="btn-bottom-primary-green"
          onClick={() => onMoveToNextRound(candidate)}
          disabled={candidate.status === "Hired" || candidate.status === "Rejected" || candidate.status === "Withdrawn"}
        >
          <FiCheckCircle size={13} />
          <span>Move to Next Round</span>
        </button>
        <button
          className="btn-bottom-outline-reject"
          onClick={() => onRejectCandidate(candidate)}
          disabled={["Hired", "Rejected", "Withdrawn"].includes(candidate.status)}
        >
          <FiSlash size={13} />
          <span>Reject Candidate</span>
        </button>
        <button className="btn-bottom-sq-more" aria-label="Interview options" onClick={() => setActiveTab("Notes")}>
          <FiMoreHorizontal size={14} />
        </button>
      </div>
    </aside>
  );
}
