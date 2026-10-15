import {
  FiAlertOctagon,
  FiDatabase,
  FiCreditCard,
  FiCalendar,
  FiKey,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { attentionAlerts } from "../../data/dashboardData";
import "./AttentionBanner.css";

export default function AttentionBanner() {
  const navigate = useNavigate();
  const getAlertIcon = (type) => {
    switch (type) {
      case "job_sources":
        return <FiDatabase className="alert-item-icon color-red" />;
      case "payments":
        return <FiCreditCard className="alert-item-icon color-amber" />;
      case "plans_expiring":
        return <FiCalendar className="alert-item-icon color-amber" />;
      case "service_issue":
        return <FiKey className="alert-item-icon color-amber" />;
      default:
        return null;
    }
  };

  return (
    <div className="attention-strip">
      <div className="attention-header-block">
        <div className="attention-icon-wrapper">
          <FiAlertOctagon className="bell-alert-icon" />
        </div>
        <div className="attention-title-col">
          <div className="attention-heading-row">
            <h4>Needs attention</h4>
            <span className="badge-count">4</span>
          </div>
          <p className="attention-desc">
            Action required to keep the platform running smoothly.
          </p>
        </div>
      </div>

      <div className="attention-cards-row">
        {attentionAlerts.map((alert) => (
          <div key={alert.id} className="alert-card">
            <div className="alert-card-top">
              <div className="alert-card-icon-wrap">
                {getAlertIcon(alert.type)}
              </div>
              <div className="alert-card-content">
                <span className="alert-card-title">{alert.title}</span>
                <span className="alert-card-sub">{alert.subtitle}</span>
                <span className="alert-card-time">{alert.time}</span>
              </div>
            </div>
            <button
              className="alert-action-btn"
              onClick={() =>
                navigate(
                  alert.type === "job_sources"
                    ? "/jobs/sources"
                    : alert.type === "payments"
                      ? "/payments"
                      : alert.type === "plans_expiring"
                        ? "/users"
                        : "/settings",
                )
              }
            >
              {alert.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
