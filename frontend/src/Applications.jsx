import { useState, useEffect } from "react";
import { apiRequest } from "./api";

const STATUS_OPTIONS = [
  "Applied",
  "Interview Scheduled",
  "Interviewed",
  "Offer",
  "Rejected",
];

function Applications({ token, onAuthError }) {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // form fields
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Applied");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadApplications() {
    setLoading(true);
    try {
      const data = await apiRequest("/applications", { token });
      setApplications(data);
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

  useEffect(() => {
    loadApplications();
  }, [token]);

  async function handleAddApplication(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await apiRequest("/applications", {
        method: "POST",
        token,
        body: {
          company,
          role,
          status,
          deadline: deadline || undefined,
          notes: notes || undefined,
        },
      });
      // clear the form
      setCompany("");
      setRole("");
      setStatus("Applied");
      setDeadline("");
      setNotes("");
      // refresh the list so the new entry shows up
      await loadApplications();
    } catch (err) {
      if (err.status === 401) {
        onAuthError();
        return;
      }
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await apiRequest(`/applications/${id}`, {
        method: "DELETE",
        token,
      });
      await loadApplications();
    } catch (err) {
      if (err.status === 401) {
        onAuthError();
        return;
      }
      setError(err.message);
    }
  }

  if (loading) return <p>Loading applications...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Add Application</h2>
      <form onSubmit={handleAddApplication}>
        <div>
          <label>Company: </label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} required />
        </div>
        <div>
          <label>Role: </label>
          <input value={role} onChange={(e) => setRole(e.target.value)} required />
        </div>
        <div>
          <label>Status: </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Deadline: </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        <div>
          <label>Notes: </label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add Application"}
        </button>
      </form>
      {formError && <p style={{ color: "red" }}>{formError}</p>}

      <h2>My Applications</h2>
      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <ul>
          {applications.map((app) => (
            <li key={app._id} style={{ marginBottom: "1em" }}>
              <div><strong>Company:</strong> {app.company}</div>
              <div><strong>Role:</strong> {app.role}</div>
              <div><strong>Status:</strong> {app.status}</div>
              {app.deadline && (
                <div><strong>Deadline:</strong> {new Date(app.deadline).toLocaleDateString()}</div>
              )}
              {app.notes && (
                <div><strong>Notes:</strong> {app.notes}</div>
              )}
              <button onClick={() => handleDelete(app._id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Applications;