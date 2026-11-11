import { useState, useEffect } from "react";
import { apiRequest } from "./api";

const STATUS_ORDER = [
  "Applied",
  "Interview Scheduled",
  "Interviewed",
  "Offer",
  "Rejected",
];

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
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!data) return null;

  return (
    <div>
      <h2>Dashboard</h2>

      <p>
        <strong>Total applications:</strong> {data.totalApplications}
      </p>
      <p>
        <strong>Upcoming interviews:</strong> {data.upcomingInterviews}
      </p>

      <h3>Applications by status</h3>
      <ul style={{ listStylePosition: "inside", padding: 0 }}>
        {STATUS_ORDER.map((status) => (
          <li key={status}>
            {status}: {data.statusCounts[status] ?? 0}
          </li>
        ))}
      </ul>

      <h3>Next deadlines</h3>
      {data.upcomingDeadlines.length === 0 ? (
        <p>No upcoming deadlines.</p>
      ) : (
        <ul style={{ listStylePosition: "inside", padding: 0 }}>
          {data.upcomingDeadlines.map((app) => (
            <li key={app._id} style={{ marginBottom: "0.5em" }}>
              <strong>{app.company}</strong> - {app.role} ({app.status})
              <div>Deadline: {new Date(app.deadline).toLocaleDateString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;