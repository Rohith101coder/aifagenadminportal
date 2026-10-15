import { useState } from "react";
import {
  FiRefreshCw,
  FiMail,
  FiSlash,
  FiChevronDown,
  FiX,
} from "react-icons/fi";
import "./BulkActionBar.css";

export default function BulkActionBar({
  selectedCount,
  allSelected,
  onToggleAll,
  onClear,
  onChangePlan,
  onSendReminder,
  onSuspend,
  onExport,
}) {
  const [showMoreActions, setShowMoreActions] = useState(false);
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-action-bar">
      <div className="bulk-left">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          className="bulk-checkbox"
        />
        <span className="bulk-count-text">
          <strong>{selectedCount} user selected</strong>
        </span>
      </div>

      <div className="bulk-actions">
        <button className="bulk-btn" onClick={onChangePlan}>
          <FiRefreshCw size={13} />
          <span>Change plan</span>
        </button>

        <button className="bulk-btn" onClick={onSendReminder}>
          <FiMail size={13} />
          <span>Send payment reminder</span>
        </button>

        <button className="bulk-btn" onClick={onSuspend}>
          <FiSlash size={13} />
          <span>Suspend account</span>
        </button>

        <button className="bulk-btn" onClick={() => setShowMoreActions((visible) => !visible)} aria-expanded={showMoreActions}>
          <span>More actions</span>
          <FiChevronDown size={13} />
        </button>
        {showMoreActions && <div className="bulk-more-menu">
          <button onClick={() => { onExport(); setShowMoreActions(false); }}>Export selected users</button>
          <button onClick={() => { onClear(); setShowMoreActions(false); }}>Clear selection</button>
        </div>}
      </div>

      <button className="bulk-close-btn" onClick={onClear} aria-label="Dismiss">
        <FiX size={15} />
      </button>
    </div>
  );
}
