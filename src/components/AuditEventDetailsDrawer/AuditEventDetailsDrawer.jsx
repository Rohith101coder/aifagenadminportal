import {
  FiX,
  FiFileText,
  FiExternalLink,
  FiCopy,
  FiLayers,
  FiChevronUp,
} from "react-icons/fi";
import "./AuditEventDetailsDrawer.css";

export default function AuditEventDetailsDrawer({ event, onClose }) {
  if (!event) return null;

  const copyToClipboard = (txt) => {
    navigator.clipboard.writeText(txt);
    alert(`Copied: ${txt}`);
  };

  return (
    <aside className="audit-drawer-container">
      {/* Top Header */}
      <div className="audit-drawer-header">
        <h2 className="drawer-title-bold">Event Details</h2>
        <button
          className="drawer-close-cross"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX size={18} />
        </button>
      </div>

      <div className="audit-drawer-scroll-area">
        {/* Event Headline */}
        <div className="event-headline-banner">
          <div className="event-icon-box">
            <FiFileText size={16} color="#2563eb" />
          </div>
          <div className="event-title-stack">
            <h3>{event.eventTitle}</h3>
            <span className="event-timestamp-muted">
              {event.date}, {event.time} IST
            </span>
          </div>
        </div>

        {/* Actor Section */}
        <section className="drawer-info-block">
          <span className="block-label-heading">Actor</span>
          <div className="actor-profile-row">
            {event.actorType === "system" ? (
              <div className="system-avatar-sq">⚙</div>
            ) : (
              <div className="actor-avatar-circle">{event.actorInitials}</div>
            )}
            <div className="actor-info-stack">
              <span className="actor-fullname-bold">{event.actor}</span>
              <span className="actor-role-muted">{event.actorRole}</span>
              <span className="actor-email-link">{event.actorEmail}</span>
            </div>
          </div>

          <div className="actor-meta-table">
            <div className="meta-kv-line">
              <span className="meta-key">IP address</span>
              <span className="meta-val">{event.actorIp}</span>
            </div>
            <div className="meta-kv-line">
              <span className="meta-key">Actor role at event</span>
              <span className="meta-val">{event.actorRole}</span>
            </div>
            <div className="meta-kv-line">
              <span className="meta-key">Session ID</span>
              <span className="meta-val monospace">{event.sessionId}</span>
            </div>
          </div>
        </section>

        {/* Target Section */}
        <section className="drawer-info-block">
          <span className="block-label-heading">Target</span>
          <div className="target-card-box">
            <div className="target-icon-cube">
              <FiFileText size={15} color="#2563eb" />
            </div>
            <div className="target-text-stack">
              <span className="target-title-bold">{event.targetName}</span>
              <span className="target-type-muted">{event.targetType}</span>
              <div className="target-id-row">
                <span className="target-id-text">ID {event.targetId}</span>
              </div>
              <button
                className="target-link-btn"
                onClick={() =>
                  alert(`Navigating to ${event.targetType} (${event.targetId})`)
                }
              >
                <span>{event.targetLinkText}</span>
              </button>
            </div>
          </div>
        </section>

        {/* What Changed Section */}
        {event.whatChanged && (
          <section className="drawer-info-block">
            <span className="block-label-heading">What changed</span>
            <div className="what-changed-table">
              <div className="diff-row">
                <span className="diff-label">Field</span>
                <span className="diff-val monospace">
                  {event.whatChanged.field}
                </span>
              </div>

              <div className="diff-row">
                <span className="diff-label">Previous value</span>
                <span className="diff-val-badge gray">
                  {event.whatChanged.previousValue}
                </span>
              </div>

              <div className="diff-row">
                <span className="diff-label">New value</span>
                <span className="diff-val-badge green">
                  {event.whatChanged.newValue}
                </span>
              </div>

              <div className="diff-row">
                <span className="diff-label">Reason</span>
                <span className="diff-val">{event.whatChanged.reason}</span>
              </div>
            </div>
          </section>
        )}

        {/* Technical Details Section */}
        <section className="drawer-info-block">
          <div className="technical-collapsible-header">
            <span className="block-label-heading">Technical details</span>
            <FiChevronUp size={14} color="#64748b" />
          </div>

          <div className="technical-kv-table">
            <div className="meta-kv-line">
              <span className="meta-key">Event ID</span>
              <span className="meta-val monospace">{event.id}</span>
            </div>
            <div className="meta-kv-line">
              <span className="meta-key">Request ID</span>
              <span className="meta-val monospace">{event.requestId}</span>
            </div>
            <div className="meta-kv-line">
              <span className="meta-key">Correlation ID</span>
              <span className="meta-val monospace">{event.correlationId}</span>
            </div>
            <div className="meta-kv-line">
              <span className="meta-key">User agent</span>
              <span className="meta-val">{event.userAgent}</span>
            </div>
            <div className="meta-kv-line">
              <span className="meta-key">IP address</span>
              <span className="meta-val">{event.ipAddress}</span>
            </div>
            <div className="meta-kv-line">
              <span className="meta-key">Session ID</span>
              <span className="meta-val monospace">{event.sessionId}</span>
            </div>
          </div>
        </section>

        {/* Actions Section */}
        <section className="drawer-info-block">
          <span className="block-label-heading">Actions</span>
          <div className="actions-button-grid">
            <button
              className="action-pill-btn primary"
              onClick={() => alert(`Opening target resource ${event.targetId}`)}
            >
              <span>Open target</span>
              <FiExternalLink size={12} />
            </button>
            <button
              className="action-pill-btn"
              onClick={() =>
                alert(`Filtering logs related to ${event.targetName}`)
              }
            >
              <FiLayers size={12} />
              <span>Related events</span>
            </button>
            <button
              className="action-pill-btn full-width"
              onClick={() =>
                copyToClipboard(
                  `https://app.aifagen.com/audit-log?event=${event.id}`,
                )
              }
            >
              <FiCopy size={12} />
              <span>Copy event link</span>
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
