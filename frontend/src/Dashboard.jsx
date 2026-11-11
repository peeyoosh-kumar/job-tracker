import { useState, useEffect } from "react";
import { apiRequest } from "./api";

const STATUS_ORDER = [
  "Applied",
  "Interview Scheduled",
  "Interviewed",
  "Offer",
  "Rejected",
];

function badgeClass(status) {
  return "badge badge-" + status.toLowerCase().replace(/ /g, "-");
}

function Dashboard({ token, onAuthError }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const result = await apiRequest("/dashboard", { token });
        setData(result);
      } catch (err) {
        if (err.status === 401) {
          onAuthError();
          return;
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [token]);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return null;

  return (
    <div>
      <h2>Dashboard</h2>

      <div className="stats">
        <div className="stat">
          <div className="stat-number">{data.totalApplications}</div>
          <div className="stat-label">Total applications</div>
        </div>
        <div className="stat">
          <div className="stat-number">{data.upcomingInterviews}</div>
          <div className="stat-label">Upcoming interviews</div>
        </div>
      </div>

      <div className="panel">
        <h3>Applications by status</h3>
        {STATUS_ORDER.map((status) => (
          <div key={status} className="status-row">
            <span className={badgeClass(status)}>{status}</span>
            <span className="status-count">{data.statusCounts[status] ?? 0}</span>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3>Next deadlines</h3>
        {data.upcomingDeadlines.length === 0 ? (
          <p>No upcoming deadlines.</p>
        ) : (
          data.upcomingDeadlines.map((app) => (
            <div key={app._id} className="deadline-item">
              <div className="card-head">
                <span className="card-title">{app.company}</span>
                <span className={badgeClass(app.status)}>{app.status}</span>
              </div>
              <div>{app.role}</div>
              <div className="deadline-date">
                Deadline: {new Date(app.deadline).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;