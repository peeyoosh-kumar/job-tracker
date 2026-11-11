import { useState, useEffect } from "react";
import { apiRequest } from "./api";
import Interviews from "./Interviews";

const STATUS_OPTIONS = [
  "Applied",
  "Interview Scheduled",
  "Interviewed",
  "Offer",
  "Rejected",
];

function badgeClass(status) {
  return "badge badge-" + status.toLowerCase().replace(/ /g, "-");
}

// The backend saves resumes under a random name, so we show a clean label instead
function resumeLabel(fileName) {
  if (!fileName) return "none uploaded";
  const ext = fileName.split(".").pop().toUpperCase();
  return `Uploaded (${ext} file)`;
}

function Applications({ token, onAuthError }) {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(true);

  // add form
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Applied");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // edit
  const [editingId, setEditingId] = useState(null);
  const [editCompany, setEditCompany] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState("Applied");
  const [editDeadline, setEditDeadline] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // interviews panel and resume files
  const [openInterviewsId, setOpenInterviewsId] = useState(null);
  const [resumeFiles, setResumeFiles] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const [fileInputKeys, setFileInputKeys] = useState({});

  async function loadApplications() {
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

  // Shared error handling for the buttons on each entry
  function handleActionError(err) {
    if (err.status === 401) {
      onAuthError();
      return;
    }
    setActionError(err.message);
  }

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
      setCompany("");
      setRole("");
      setStatus("Applied");
      setDeadline("");
      setNotes("");
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
    setActionError("");
    try {
      await apiRequest(`/applications/${id}`, { method: "DELETE", token });
      await loadApplications();
    } catch (err) {
      handleActionError(err);
    }
  }

  function startEdit(app) {
    setEditingId(app._id);
    setEditCompany(app.company);
    setEditRole(app.role);
    setEditStatus(app.status);
    setEditDeadline(app.deadline ? app.deadline.slice(0, 10) : "");
    setEditNotes(app.notes || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit(id) {
    setActionError("");
    try {
      await apiRequest(`/applications/${id}`, {
        method: "PUT",
        token,
        body: {
          company: editCompany,
          role: editRole,
          status: editStatus,
          deadline: editDeadline || undefined,
          notes: editNotes || undefined,
        },
      });
      setEditingId(null);
      await loadApplications();
    } catch (err) {
      handleActionError(err);
    }
  }

  async function handleUploadResume(id) {
    const file = resumeFiles[id];
    if (!file) {
      setActionError("Choose a PDF or Word file first");
      return;
    }
    setActionError("");
    setUploadingId(id);
    try {
      const formData = new FormData();
      formData.append("resume", file); // the backend expects the field name "resume"
      await apiRequest(`/applications/${id}/resume`, {
        method: "POST",
        token,
        formData,
      });
      setResumeFiles((prev) => ({ ...prev, [id]: null }));
      // a new key makes React create a fresh, empty file picker
      setFileInputKeys((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
      await loadApplications();
    } catch (err) {
      handleActionError(err);
    } finally {
      setUploadingId(null);
    }
  }

  if (loading) return <p>Loading applications...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <div className="panel">
        <h2>Add Application</h2>
        <form onSubmit={handleAddApplication}>
          <div>
            <label>Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} required />
          </div>
          <div>
            <label>Role</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} required />
          </div>
          <div>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <label>Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Adding..." : "Add Application"}
          </button>
        </form>
        {formError && <p className="error">{formError}</p>}
      </div>

      <h2>My Applications</h2>
      {actionError && <p className="error">{actionError}</p>}
      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <ul className="list">
          {applications.map((app) => (
            <li key={app._id} className="card">
              {editingId === app._id ? (
                <div className="edit">
                  <div>
                    <label>Company</label>
                    <input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
                  </div>
                  <div>
                    <label>Role</label>
                    <input value={editRole} onChange={(e) => setEditRole(e.target.value)} />
                  </div>
                  <div>
                    <label>Status</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Deadline</label>
                    <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
                  </div>
                  <div>
                    <label>Notes</label>
                    <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                  </div>
                  <button onClick={() => handleSaveEdit(app._id)}>Save</button>
                  <button className="secondary" onClick={cancelEdit}>Cancel</button>
                </div>
              ) : (
                <div>
                  <div className="card-head">
                    <span className="card-title">{app.company}</span>
                    <span className={badgeClass(app.status)}>{app.status}</span>
                  </div>
                  <div className="row"><strong>Role:</strong> {app.role}</div>
                  {app.deadline && (
                    <div className="row">
                      <strong>Deadline:</strong> {new Date(app.deadline).toLocaleDateString()}
                    </div>
                  )}
                  {app.notes && <div className="row"><strong>Notes:</strong> {app.notes}</div>}
                  <div className="row">
                    <strong>Resume:</strong> {resumeLabel(app.resumeFileName)}
                  </div>

                  <div className="resume">
                    <input
                      key={`file-${app._id}-${fileInputKeys[app._id] || 0}`}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) =>
                        setResumeFiles((prev) => ({ ...prev, [app._id]: e.target.files[0] || null }))
                      }
                    />{" "}
                    <button
                      className="secondary"
                      onClick={() => handleUploadResume(app._id)}
                      disabled={uploadingId === app._id}
                    >
                      {uploadingId === app._id ? "Uploading..." : "Upload Resume"}
                    </button>
                  </div>

                  <div className="actions">
                    <button onClick={() => startEdit(app)}>Edit</button>
                    <button
                      className="secondary"
                      onClick={() =>
                        setOpenInterviewsId(openInterviewsId === app._id ? null : app._id)
                      }
                    >
                      {openInterviewsId === app._id ? "Hide Interviews" : "Interviews"}
                    </button>
                    <button className="danger" onClick={() => handleDelete(app._id)}>Delete</button>
                  </div>

                  {openInterviewsId === app._id && (
                    <Interviews token={token} appId={app._id} onAuthError={onAuthError} />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Applications;