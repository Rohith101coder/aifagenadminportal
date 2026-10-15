import { useState, useMemo, useRef } from "react";
import {
  FiBriefcase,
  FiPlus,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiExternalLink,
  FiMail,
  FiSearch,
} from "react-icons/fi";
import { initialInternalJobsList } from "../data/internalJobsData";
import { logAuditAction } from "../data/auditLogData";
import "./InternalJobs.css";

const emptyForm = {
  title: "",
  department: "Talent Delivery & Sourcing",
  location: "Siddipet, Telangana (Hybrid)",
  type: "Full-time",
  description: "",
  skills: "",
  applyLink: "",
  visible: true,
};

export default function InternalJobs({ globalSearchTerm = "" }) {
  const [jobs, setJobs] = useState(() => {
    try {
      const stored = window.localStorage.getItem("aifagen-internal-jobs");
      return stored ? JSON.parse(stored) : initialInternalJobsList;
    } catch {
      return initialInternalJobsList;
    }
  });

  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [notice, setNotice] = useState({ text: "", type: "success" });
  const [searchQuery, setSearchQuery] = useState("");
  const noticeTimer = useRef(null);

  const notify = (text, type = "success") => {
    setNotice({ text, type });
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice({ text: "", type: "success" }), 4000);
  };

  const persistJobs = (nextJobs) => {
    setJobs(nextJobs);
    try {
      window.localStorage.setItem("aifagen-internal-jobs", JSON.stringify(nextJobs));
    } catch (e) {
      console.error(e);
    }
  };

  // Rule 7: Links must be safe (https or mailto)
  const validateLink = (link) => {
    if (!link || !link.trim()) return false;
    const trimmed = link.trim();
    return trimmed.startsWith("https://") || trimmed.startsWith("mailto:");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Required fields check
    if (!formData.title.trim()) {
      notify("Job Title is required.", "error");
      return;
    }
    if (!formData.description.trim()) {
      notify("Job Description is required.", "error");
      return;
    }

    // Rule 7 validation
    if (!validateLink(formData.applyLink)) {
      notify("Apply link is rejected: Links must be safe web links (https://...) or email links (mailto:...).", "error");
      return;
    }

    if (editingId) {
      // Editing existing job
      const original = jobs.find((j) => j.id === editingId);
      const updated = jobs.map((j) => (j.id === editingId ? { ...j, ...formData } : j));
      persistJobs(updated);

      logAuditAction({
        category: "Internal job changes",
        eventTitle: "Internal job updated",
        eventSummary: `Updated internal job: ${formData.title}`,
        targetName: formData.title,
        targetType: "Internal Job",
        targetId: editingId,
        field: "internal_job_details",
        previousValue: original ? original.title : "-",
        newValue: formData.title,
        reason: "Administrative update of internal opening",
      });

      notify(`Internal job "${formData.title}" updated successfully.`);
      setEditingId(null);
    } else {
      // Creating new job
      const newJob = {
        ...formData,
        id: `ijob-${Date.now()}`,
        createdBy: "Rohith P",
        createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        applicationsCount: 0,
      };
      const updated = [newJob, ...jobs];
      persistJobs(updated);

      logAuditAction({
        category: "Internal job changes",
        eventTitle: "Internal job posted",
        eventSummary: `Posted internal opening: ${formData.title}`,
        targetName: formData.title,
        targetType: "Internal Job",
        targetId: newJob.id,
        field: "posting",
        previousValue: "None",
        newValue: formData.visible ? "Active (Visible)" : "Draft (Hidden)",
        reason: "New internal job position opened for team recruitment",
      });

      notify(`Internal job "${formData.title}" posted successfully.`);
    }

    setFormData(emptyForm);
  };

  const startEdit = (job) => {
    setEditingId(job.id);
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      description: job.description,
      skills: job.skills,
      applyLink: job.applyLink,
      visible: Boolean(job.visible),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const toggleVisibility = (job) => {
    const nextVisible = !job.visible;
    const updated = jobs.map((j) => (j.id === job.id ? { ...j, visible: nextVisible } : j));
    persistJobs(updated);

    logAuditAction({
      category: "Internal job changes",
      eventTitle: "Internal job visibility toggled",
      eventSummary: `Changed visibility for "${job.title}": ${job.visible ? "Visible → Hidden" : "Hidden → Visible"}`,
      targetName: job.title,
      targetType: "Internal Job",
      targetId: job.id,
      field: "visible",
      previousValue: job.visible ? "Visible" : "Hidden",
      newValue: nextVisible ? "Visible" : "Hidden",
      reason: "Adjusted job listing visibility for candidates",
    });

    notify(`"${job.title}" is now ${nextVisible ? "visible on the site" : "hidden from candidates"}.`);
  };

  // Rule 5: Confirm destructive actions (delete asks for confirmation and can't be undone)
  const confirmDelete = () => {
    if (!deleteCandidate) return;
    const target = deleteCandidate;
    const updated = jobs.filter((j) => j.id !== target.id);
    persistJobs(updated);

    logAuditAction({
      category: "Internal job changes",
      eventTitle: "Internal job deleted",
      eventSummary: `Permanently deleted internal job: ${target.title}`,
      targetName: target.title,
      targetType: "Internal Job",
      targetId: target.id,
      field: "job_record",
      previousValue: target.title,
      newValue: "Deleted",
      reason: "Position filled or cancelled by management",
    });

    notify(`Internal job "${target.title}" permanently deleted.`);
    setDeleteCandidate(null);
  };

  const filteredJobs = useMemo(() => {
    const q = (searchQuery || globalSearchTerm).toLowerCase().trim();
    if (!q) return jobs;
    return jobs.filter((j) =>
      j.title.toLowerCase().includes(q) ||
      j.department.toLowerCase().includes(q) ||
      j.skills.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q)
    );
  }, [jobs, searchQuery, globalSearchTerm]);

  return (
    <div className="internal-jobs-page">
      {/* Banner Messages */}
      {notice.text && (
        <div className={`internal-jobs-banner ${notice.type}`} role="alert">
          <div className="banner-content">
            {notice.type === "error" ? <FiAlertTriangle size={18} /> : <FiCheck size={18} />}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice({ text: "", type: "success" })} aria-label="Dismiss">
            <FiX size={15} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Internal Jobs</h1>
          <p className="page-subtitle">
            Jobs posted by our own team for AIFAGen Labs operations, reverse recruiting, and technical prep mentors.
          </p>
        </div>
        <div className="stats-pill">
          <span>{jobs.filter((j) => j.visible).length} Visible</span> · <span>{jobs.filter((j) => !j.visible).length} Hidden</span>
        </div>
      </div>

      {/* 1. Form at Top (Required by Specification Page 5) */}
      <section className="internal-job-form-card">
        <div className="form-card-header">
          <div className="form-title-wrap">
            <FiBriefcase className="form-icon" />
            <div>
              <h3>{editingId ? "Edit Internal Job Posting" : "Post a New Internal Job"}</h3>
              <p>Form fields validate safety rules (links must be https:// or mailto:).</p>
            </div>
          </div>
          {editingId && (
            <button className="cancel-edit-btn" onClick={cancelEdit}>
              <FiX size={14} /> Cancel Editing
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="internal-job-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="job-title">
                Job Title <span className="req">*</span>
              </label>
              <input
                id="job-title"
                type="text"
                placeholder="e.g. US Technical Recruiter, ATS Resume Writer, Mock Interviewer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="job-dept">Department</label>
              <select
                id="job-dept"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Talent Delivery & Sourcing">Talent Delivery & Sourcing</option>
                <option value="Profile Optimization">Profile Optimization (ATS Resumes)</option>
                <option value="Candidate Preparation">Candidate Preparation (Mock Interviews)</option>
                <option value="Engineering & Tools">Engineering & Tools</option>
                <option value="Corporate Staffing & Sales">Corporate Staffing & Sales</option>
                <option value="Operations & Support">Operations & Support (Siddipet HQ)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="job-type">Employment Type</label>
              <select
                id="job-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contractor">Contractor (C2C / 1099)</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="job-loc">Location</label>
              <input
                id="job-loc"
                type="text"
                placeholder="e.g. Siddipet, Telangana (HQ) or Remote (US/India)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="job-link">
                Apply Link (Web or Email) <span className="req">*</span>
              </label>
              <input
                id="job-link"
                type="text"
                placeholder="https://... or mailto:careers@..."
                value={formData.applyLink}
                onChange={(e) => setFormData({ ...formData, applyLink: e.target.value })}
                required
              />
              <small className="help-text">Links must start with <strong>https://</strong> or <strong>mailto:</strong></small>
            </div>

            <div className="form-group full-width">
              <label htmlFor="job-skills">Skills (Comma-separated)</label>
              <input
                id="job-skills"
                type="text"
                placeholder="e.g. US IT Staffing, Boolean Search, ATS Optimization, Python, AWS"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="job-desc">
                Job Description <span className="req">*</span>
              </label>
              <textarea
                id="job-desc"
                rows={3}
                placeholder="Describe role responsibilities, deliverables, and requirements..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="form-group checkbox-group full-width">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={formData.visible}
                  onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                />
                <span>
                  <strong>Visible on the site</strong> — Make this job active and visible to candidates immediately.
                </span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            {editingId && (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary">
              <FiPlus size={15} />
              <span>{editingId ? "Save Changes" : "Post Internal Job"}</span>
            </button>
          </div>
        </form>
      </section>

      {/* 2. List of All Postings Below (Required by Specification Page 5) */}
      <section className="internal-jobs-list-card">
        <div className="list-card-header">
          <div className="header-left">
            <h3>Internal Job Postings ({filteredJobs.length})</h3>
            <span className="sub-tag">Managed by internal admin team</span>
          </div>
          <div className="search-wrap">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search internal postings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="internal-jobs-table">
            <thead>
              <tr>
                <th>Job Title &amp; Department</th>
                <th>Location &amp; Type</th>
                <th>Skills Required</th>
                <th>Apply Channel</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    No internal jobs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className={!job.visible ? "hidden-job-row" : ""}>
                    <td>
                      <div className="job-title-col">
                        <span className="job-main-title">{job.title}</span>
                        <span className="job-dept-badge">{job.department}</span>
                      </div>
                    </td>
                    <td>
                      <div className="job-loc-col">
                        <span>{job.location}</span>
                        <small>{job.type}</small>
                      </div>
                    </td>
                    <td>
                      <div className="job-skills-tags">
                        {job.skills
                          ? job.skills.split(",").slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="skill-pill">
                                {skill.trim()}
                              </span>
                            ))
                          : "General"}
                        {job.skills && job.skills.split(",").length > 3 && (
                          <span className="skill-pill more">+{job.skills.split(",").length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="apply-link-cell">
                        {job.applyLink?.startsWith("mailto:") ? (
                          <a href={job.applyLink} className="link-badge email" title={job.applyLink}>
                            <FiMail size={12} /> {job.applyLink.replace("mailto:", "")}
                          </a>
                        ) : (
                          <a href={job.applyLink} target="_blank" rel="noopener noreferrer" className="link-badge web" title={job.applyLink}>
                            <FiExternalLink size={12} /> External Portal
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`visibility-pill ${job.visible ? "visible" : "hidden"}`}>
                        <span className="status-dot"></span>
                        {job.visible ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <span className="created-text">{job.createdAt || "Recent"}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-actions-group">
                        <button
                          className="action-icon-btn edit"
                          title="Edit Job"
                          onClick={() => startEdit(job)}
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          className="action-icon-btn toggle"
                          title={job.visible ? "Hide from candidates" : "Show to candidates"}
                          onClick={() => toggleVisibility(job)}
                        >
                          {job.visible ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                        </button>
                        <button
                          className="action-icon-btn delete"
                          title="Delete Job"
                          onClick={() => setDeleteCandidate(job)}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirmation Modal for Delete (Rule 5: Delete asks for confirmation and can't be undone) */}
      {deleteCandidate && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-icon-alert">
                <FiAlertTriangle size={22} />
              </div>
              <div>
                <h3>Delete Internal Job?</h3>
                <p>This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to permanently delete <strong>"{deleteCandidate.title}"</strong>?
              </p>
              <p className="modal-subtext">
                Deleting this posting will remove all internal candidate applications associated with it and create an audit log record.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteCandidate(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmDelete}>
                Delete Posting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
