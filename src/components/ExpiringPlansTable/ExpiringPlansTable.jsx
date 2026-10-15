import { useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { expiringPlans } from "../../data/dashboardData";
import "./ExpiringPlansTable.css";

export default function ExpiringPlansTable({ searchTerm = "", onAction }) {
  const [remindedUsers, setRemindedUsers] = useState([]);
  const [ascending, setAscending] = useState(true);
  const navigate = useNavigate();
  const filteredPlans = expiringPlans
    .filter((row) =>
      `${row.name} ${row.email} ${row.plan}`.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) =>
      ascending
        ? new Date(a.expiryDate) - new Date(b.expiryDate)
        : new Date(b.expiryDate) - new Date(a.expiryDate),
    );

  return (
    <div className="card-container expiring-table-card">
      <div className="table-header-block">
        <div>
          <h3>Plans Expiring in 30 Days</h3>
          <span className="sub-caption">Users whose plans will end soon</span>
        </div>
        <button className="view-all-link" onClick={() => navigate("/users")}>View all</button>
      </div>

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>
                <button className="table-sort-button" onClick={() => setAscending((value) => !value)}>
                  Expiry Date {ascending ? "↑" : "↓"}
                </button>
              </th>
              <th>Days Left</th>
              <th>Last Payment</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlans.map((row) => (
              <tr key={row.email}>
                <td>
                  <div className="user-cell">
                    <span className="user-cell-avatar">{row.initials}</span>
                    <div className="user-cell-meta">
                      <span className="user-name-cell">{row.name}</span>
                      <span className="user-email-cell">{row.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`pill-badge ${row.plan.toLowerCase()}`}>
                    {row.plan}
                  </span>
                </td>
                <td className="expiry-cell">{row.expiryDate}</td>
                <td>
                  <span
                    className={`days-tag ${row.daysUrgent ? "urgent" : "warning"}`}
                  >
                    {row.daysLeft}
                  </span>
                </td>
                <td>
                  <div className="payment-cell">
                    <span className="amount">{row.amount}</span>
                    <span className="date-sub">{row.lastPaymentDate}</span>
                  </div>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="reminder-btn"
                      disabled={remindedUsers.includes(row.email)}
                      onClick={() => {
                        setRemindedUsers((users) => [...users, row.email]);
                        onAction?.(`Renewal reminder queued for ${row.name}.`);
                      }}
                    >
                      {remindedUsers.includes(row.email) ? "Sent" : "Send reminder"}
                    </button>
                    <button className="chevron-link" aria-label={`View ${row.name}`} onClick={() => navigate("/users")}>
                      <FiChevronRight size={17.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPlans.length === 0 && (
              <tr><td className="table-empty" colSpan="6">No expiring plans match “{searchTerm}”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
