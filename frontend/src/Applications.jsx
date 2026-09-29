import { useState, useEffect } from "react";
import { apiRequest } from "./api";

function Applications({ token }) {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApplications() {
      try {
        const data = await apiRequest("/applications", { token });
        // data is a plain array of application objects
        setApplications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadApplications();
  }, [token]);

  if (loading) return <p>Loading applications...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>My Applications</h2>
      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <ul>
          {applications.map((app) => (
            <li key={app._id}>
              {JSON.stringify(app)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Applications;