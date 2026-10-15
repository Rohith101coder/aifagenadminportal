import { useState } from "react";
import { FiMoreHorizontal } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { jobSources } from "../../data/dashboardData";
import "./JobSourceStatusTable.css";

export default function JobSourceStatusTable({ searchTerm = "", onAction }) {
  const [sourceStatuses, setSourceStatuses] = useState(
    Object.fromEntries(jobSources.map((source) => [source.source, source.status])),
  );
  const [activeMenu, setActiveMenu] = useState("");
  const navigate = useNavigate();
  const filteredSources = jobSources.filter((row) =>
    `${row.source} ${sourceStatuses[row.source]}`.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="card-container job-source-card">
      <div className="table-header-block">
        <div>
          <h3>Job Source Status</h3>
          <span className="sub-caption">
            12 sources connected • 3 need attention
          </span>
        </div>
        <button className="view-all-link" onClick={() => navigate("/jobs/sources")}>View all</button>
      </div>

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Status</th>
              <th>Last Run</th>
              <th>Next Run</th>
              <th>Jobs (24h)</th>
              <th>Action</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredSources.map((row) => (
              <tr key={row.source}>
                <td className="source-name">{row.source}</td>
                <td>
                  <div className="status-indicator-wrap">
                    <span className={`status-dot ${sourceStatuses[row.source] === "Working" ? "success" : sourceStatuses[row.source] === "Stalled" ? "stalled" : "failed"}`}></span>
                    <span className="status-label">{sourceStatuses[row.source]}</span>
                  </div>
                </td>
                <td className="multi-line-cell">
                  {row.lastRun.split("\n").map((line, lIdx) => (
                    <span key={lIdx} className={lIdx === 1 ? "sub-run" : ""}>
                      {line}
                    </span>
                  ))}
                </td>
                <td className="next-run-cell">{row.nextRun}</td>
                <td className="jobs-count-cell">{row.jobs24h}</td>
                <td>
                  <button
                    className="run-now-btn"
                    disabled={sourceStatuses[row.source] === "Working"}
                    onClick={() => {
                      setSourceStatuses((statuses) => ({ ...statuses, [row.source]: "Working" }));
                      onAction?.(`${row.source} sync started.`);
                    }}
                  >
                    {sourceStatuses[row.source] === "Working" ? "Working" : "Run now"}
                  </button>
                </td>
                <td>
                  <button
                    className="icon-more-btn"
                    aria-label={`More actions for ${row.source}`}
                    aria-expanded={activeMenu === row.source}
                    onClick={() => setActiveMenu((source) => source === row.source ? "" : row.source)}
                  >
                    <FiMoreHorizontal />
                  </button>
                  {activeMenu === row.source && (
                    <div className="source-row-menu">
                      <button onClick={() => { navigate("/jobs/sources"); setActiveMenu(""); }}>Source details</button>
                      <button onClick={() => { onAction?.(`${row.source} sync history opened.`); setActiveMenu(""); }}>View run history</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredSources.length === 0 && (
              <tr><td className="table-empty" colSpan="7">No job sources match “{searchTerm}”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
