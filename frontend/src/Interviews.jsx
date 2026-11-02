import { useState, useEffect } from "react";
import { apiRequest } from "./api";

const MODES = ["Online", "In-person", "Phone"];
const OUTCOMES = ["Pending", "Passed", "Failed"];

function Interviews({ token, appId, onAuthError }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [round, setRound] = useState("");
  const [date, setDate] = useState("");
  const [mode, setMode] = useState("Online");
  const [interviewerName, setInterviewerName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [outcome, setOutcome] = useState("Pending");
  const [submitting, setSubmitting] = useState(false);

  async function loadInterviews() {
    try {
      const data = await apiRequest(`/interviews/${appId}`, { token });
      setInterviews(data);
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
    loadInterviews();
  }, [appId]);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiRequest(`/interviews/${appId}`, {
        method: "POST",
        token,
        body: {
          round,
          date: date || undefined,
          mode,
          interviewerName,
          feedback,
          outcome,
        },
      });
      setRound("");
      setDate("");
      setMode("Online");
      setInterviewerName("");
      setFeedback("");
      setOutcome("Pending");
      await loadInterviews();
    } catch (err) {
      if (err.status === 401) {
        onAuthError();
        return;
      }
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: "0.5em" }}>
      <h3>Interviews</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <p>Loading interviews...</p>
      ) : interviews.length === 0 ? (
        <p>No interviews yet.</p>
      ) : (
        <ul>
          {interviews.map((iv) => (
            <li key={iv._id} style={{ marginBottom: "0.8em" }}>
              <div><strong>Round:</strong> {iv.round || "-"}</div>
              {iv.date && (
                <div><strong>Date:</strong> {new Date(iv.date).toLocaleDateString()}</div>
              )}
              <div><strong>Mode:</strong> {iv.mode}</div>
              {iv.interviewerName && (
                <div><strong>Interviewer:</strong> {iv.interviewerName}</div>
              )}
              <div><strong>Outcome:</strong> {iv.outcome}</div>
              {iv.feedback && <div><strong>Feedback:</strong> {iv.feedback}</div>}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd}>
        <div>
          <label>Round: </label>
          <input value={round} onChange={(e) => setRound(e.target.value)} placeholder="e.g. Technical Round 1" />
        </div>
        <div>
          <label>Date: </label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label>Mode: </label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            {MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Interviewer: </label>
          <input value={interviewerName} onChange={(e) => setInterviewerName(e.target.value)} />
        </div>
        <div>
          <label>Outcome: </label>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Feedback: </label>
          <input value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add Interview"}
        </button>
      </form>
    </div>
  );
}

export default Interviews;