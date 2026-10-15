import { useState } from "react";
import {
  FiX,
  FiCopy,
  FiExternalLink,
  FiDownload,
  FiMail,
  FiAlertCircle,
  FiMoreHorizontal,
  FiEye,
} from "react-icons/fi";
import "./PaymentDetailsDrawer.css";

export default function PaymentDetailsDrawer({
  payment,
  onClose,
  onRefund,
  onSendReceipt,
  onDownloadInvoice,
  onNotify,
  onCopy,
  onRetry,
}) {
  const [showMoreActions, setShowMoreActions] = useState(false);
  if (!payment) return null;

  const copyToClipboard = (text) => onCopy(text);

  return (
    <aside className="payment-details-drawer">
      {/* Top Header */}
      <div className="drawer-top-header">
        <h2 className="drawer-main-title">Payment Details</h2>
        <button
          className="drawer-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX size={18} />
        </button>
      </div>

      <div className="drawer-scroll-body">
        {/* Payment ID & Status Badge */}
        <div className="payment-id-headline">
          <div className="id-copy-row">
            <span className="pay-id-text">{payment.id}</span>
            <button
              className="copy-icon-btn"
              onClick={() => copyToClipboard(payment.id)}
            >
              <FiCopy size={13} />
            </button>
          </div>
          <span
            className={`drawer-status-pill ${payment.status.toLowerCase()}`}
          >
            <span className="pill-dot"></span>
            {payment.status}
          </span>
        </div>

        <div className="payment-datetime-sub">
          {payment.paymentDate} at {payment.paymentTime} (IST)
        </div>

        {/* Big Amount Row */}
        <div className="amount-action-block">
          <div className="amount-big">{payment.amount}</div>
          <button
            className="external-gateway-btn"
            onClick={() =>
              window.open(
                `https://dashboard.razorpay.com/app/payments/${payment.id}`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <span>View in Razorpay</span>
            <FiExternalLink size={12} />
          </button>
        </div>

        {/* Key Attributes */}
        <div className="payment-info-list">
          <div className="info-kv-row">
            <span className="info-label">Plan</span>
            <span className="plan-chip">{payment.plan}</span>
          </div>

          <div className="info-kv-row">
            <span className="info-label">Payment Type</span>
            <span className="info-val">{payment.paymentType}</span>
          </div>

          <div className="info-kv-row">
            <span className="info-label">Payment Method</span>
            <span className="info-val method-wrap">
              {payment.paymentMethod.includes("Visa") && (
                <span className="card-badge visa">VISA</span>
              )}
              {payment.paymentMethod.includes("Mastercard") && (
                <span className="card-badge master">MC</span>
              )}
              {payment.paymentMethod}
            </span>
          </div>

          <div className="info-kv-row">
            <span className="info-label">Billing Cycle</span>
            <span className="info-val">{payment.billingCycle}</span>
          </div>

          <div className="info-kv-row">
            <span className="info-label">Gateway Fee (incl. GST)</span>
            <span className="info-val">{payment.gatewayFee}</span>
          </div>

          <div className="info-kv-row">
            <span className="info-label">Net Amount (to be settled)</span>
            <span className="info-val bold">{payment.netAmount}</span>
          </div>
        </div>

        {/* User Information */}
        <div className="drawer-panel-card">
          <div className="panel-card-header">
            <h4>User Information</h4>
            <button
              className="panel-link-btn"
              onClick={() => (window.location.href = "/users")}
            >
              <span>View user</span>
              <FiExternalLink size={11} />
            </button>
          </div>
          <div className="drawer-user-meta-row">
            <div className="drawer-user-avatar">{payment.initials}</div>
            <div className="drawer-user-details">
              <div className="user-name-line">
                <span className="name-bold">{payment.userName}</span>
                <span className="badge-active-mini">{payment.userStatus}</span>
              </div>
              <div className="sub-user-line">
                <span>{payment.userEmail}</span>
                <button
                  className="copy-icon-btn"
                  onClick={() => copyToClipboard(payment.userEmail)}
                >
                  <FiCopy size={11} />
                </button>
              </div>
              <div className="sub-user-line">
                <span>{payment.phone}</span>
                <FiEye size={12} className="eye-field-icon" />
              </div>
              <div className="sub-user-line location">
                <span>{payment.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="drawer-panel-card">
          <div className="panel-card-header">
            <h4>Invoice Details</h4>
            <button
              className="panel-link-btn"
              onClick={() => onDownloadInvoice(payment)}
            >
              <span>View invoice</span>
              <FiExternalLink size={11} />
            </button>
          </div>
          <div className="invoice-kv-stack">
            <div className="info-kv-row">
              <span className="info-label">Invoice No.</span>
              <span className="info-val">{payment.invoiceNo}</span>
            </div>
            <div className="info-kv-row">
              <span className="info-label">Invoice Date</span>
              <span className="info-val">{payment.paymentDate}</span>
            </div>
            <div className="info-kv-row">
              <span className="info-label">Subtotal</span>
              <span className="info-val">{payment.subtotal}</span>
            </div>
            <div className="info-kv-row">
              <span className="info-label">GST (18%)</span>
              <span className="info-val">{payment.gst}</span>
            </div>
            <div className="info-kv-row total">
              <span className="info-label bold">Total Amount</span>
              <span className="info-val bold">{payment.amount}</span>
            </div>

            <button
              className="download-invoice-cta"
              onClick={() => onDownloadInvoice(payment)}
            >
              <FiDownload size={13} />
              <span>Download invoice</span>
            </button>
          </div>
        </div>

        {/* Payment Timeline */}
        <div className="drawer-panel-card">
          <h4 className="panel-title-plain">Payment Timeline</h4>
          <div className="payment-timeline-stack">
            {payment.timeline?.map((step, idx) => (
              <div key={idx} className="timeline-node">
                <div className="node-marker-wrap">
                  <span className="node-marker-dot"></span>
                  {idx !== payment.timeline.length - 1 && (
                    <span className="node-line"></span>
                  )}
                </div>
                <div className="node-content">
                  <span className="node-title">{step.title}</span>
                  <span className="node-time">{step.time}</span>
                  {step.utr && (
                    <div className="utr-box">
                      <span>UTR: {step.utr}</span>
                      <button
                        className="copy-icon-btn"
                        onClick={() => copyToClipboard(step.utr)}
                      >
                        <FiCopy size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="drawer-sticky-footer">
        <button
          className="footer-action-btn receipt-btn"
          onClick={() => onSendReceipt(payment)}
        >
          <FiMail size={13} />
          <span>Send Receipt</span>
        </button>
        <button
          className="footer-action-btn refund-btn"
          onClick={() => onRefund(payment)}
          disabled={payment.status !== "Successful"}
          title={payment.status !== "Successful" ? "Only successful payments can be refunded" : "Issue refund"}
        >
          <FiAlertCircle size={13} />
          <span>Issue Refund</span>
        </button>
        <button
          className="footer-more-btn"
          aria-label="More payment actions"
          aria-expanded={showMoreActions}
          onClick={() => setShowMoreActions((visible) => !visible)}
        >
          <FiMoreHorizontal size={14} />
        </button>
        {showMoreActions && <div className="drawer-more-actions">
          <button onClick={() => { onCopy(payment.id); setShowMoreActions(false); }}><FiCopy size={13} />Copy payment ID</button>
          <button onClick={() => { onDownloadInvoice(payment); setShowMoreActions(false); }}><FiDownload size={13} />Download invoice</button>
          {payment.status === "Failed" && <button onClick={() => { onRetry(payment.id); setShowMoreActions(false); }}><FiAlertCircle size={13} />Retry payment</button>}
          <button onClick={() => { onNotify(`Payment ${payment.id} is ${payment.status.toLowerCase()}.`); setShowMoreActions(false); }}><FiEye size={13} />Payment status</button>
        </div>}
      </div>
    </aside>
  );
}
