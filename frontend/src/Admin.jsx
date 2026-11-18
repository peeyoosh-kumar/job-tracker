import { useEffect, useState } from "react";
import { apiRequest } from "./api";
import "./Admin.css";

const HOUR_OPTIONS = [
  { value: 1, label: "Last hour" },
  { value: 24, label: "Last 24 hours" },
  { value: 168, label: "Last 7 days" },
  { value: 720, label: "Last 30 days" },
];

// Admin page: security summary cards and a table of suspicious events.
// It loads once when opened and again when the time window changes or the
// Refresh button is pressed. There is no automatic polling, so it adds very
// few requests to the backend limit.
function Admin({ token, onAuthError }) {
  const [hours, setHours] = useState(24);
  const [reloadKey, setReloadKey] = useState(0);
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [summaryData, eventsData] = await Promise.all([
          apiRequest(`/admin/summary?hours=${hours}`, { token }),
          apiRequest(`/admin/events?hours=${hours}`, { token }),
        ]);
        if (cancelled) return;
        setSummary(summaryData);
        setEvents(Array.isArray(eventsData.events) ? eventsData.events : []);
      } catch (err) {
        if (cancelled) return;
        if (err.status === 401) {
          onAuthError();
          return;
        }
        if (err.status === 403) {
          setError("You do not have admin access.");
        } else if (err.status === 429) {
          setError("Too many requests. Please wait a little and press Refresh.");
        } else {
          setError(err.message || "Could not load admin data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // onAuthError is left out on purpose, like in the bell: it is a new function
    // on every render and would reload the data each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, hours, reloadKey]);

  return (
    <div>
      <h2>Admin</h2>

      <div className="admin-toolbar">
        <label htmlFor="admin-hours">Time window:</label>
        <select
          id="admin-hours"
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
        >
          {HOUR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button className="secondary" onClick={() => setReloadKey((k) => k + 1)}>
          Refresh
        </button>
      </div>

      {loading && <p>Loading admin data...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && summary && (
        <>
          <div className="stats admin-stats">
            <div className="stat">
              <div className="stat-number">{summary.failedLogins ?? 0}</div>
              <div className="stat-label">Failed logins</div>
            </div>
            <div className="stat">
              <div className="stat-number">{summary.rateLimitHits ?? 0}</div>
              <div className="stat-label">Rate limit hits</div>
            </div>
            <div className="stat">
              <div className="stat-number">{summary.deniedAdmin ?? 0}</div>
              <div className="stat-label">Denied admin attempts</div>
            </div>
            <div className="stat">
              <div className="stat-number">{summary.invalidTokens ?? 0}</div>
              <div className="stat-label">Invalid or expired tokens</div>
            </div>
          </div>

          <div className="panel">
            <h3>Suspicious events</h3>
            {events.length === 0 ? (
              <p>No suspicious patterns in this period.</p>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>IP address</th>
                      <th>Type</th>
                      <th>Count</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev, index) => (
                      <tr key={`${ev.ip}-${ev.type}-${index}`}>
                        <td>{ev.ip}</td>
                        <td>{ev.type}</td>
                        <td>{ev.count}</td>
                        <td className={ev.severity === "high" ? "sev-high" : "sev-medium"}>
                          {ev.severity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Admin;