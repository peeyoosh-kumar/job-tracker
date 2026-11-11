import { useState } from "react";
import Register from "./Register";
import Login from "./Login";
import Applications from "./Applications";
import Dashboard from "./Dashboard";

// Reads token/user back out of localStorage when the app first loads.
// Wrapped in try/catch in case the saved "user" isn't valid JSON for some reason.
function getStoredAuth() {
  try {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");
    if (!token || !userRaw) return { token: null, user: null };
    return { token, user: JSON.parse(userRaw) };
  } catch {
    return { token: null, user: null };
  }
}

function App() {
  const stored = getStoredAuth();
  const [token, setToken] = useState(stored.token);
  const [user, setUser] = useState(stored.user);
  const [showLogin, setShowLogin] = useState(true);
  const [view, setView] = useState("applications");

  function handleAuthed(newToken, newUser) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setView("applications");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setShowLogin(true);
  }

  if (token && user) {
    return (
      <div>
        <div className="topbar">
          <h1>Job Application Tracker</h1>
          <div>
            <span className="who">
              {user.name} ({user.email}){" "}
            </span>
            <button className="secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="tabs">
          <button
            className={view === "applications" ? "active" : ""}
            onClick={() => setView("applications")}
          >
            Applications
          </button>
          <button
            className={view === "dashboard" ? "active" : ""}
            onClick={() => setView("dashboard")}
          >
            Dashboard
          </button>
        </div>

        {view === "dashboard" ? (
          <Dashboard token={token} onAuthError={handleLogout} />
        ) : (
          <Applications token={token} onAuthError={handleLogout} />
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="auth-title">Job Application Tracker</h1>
      <div className="auth-card">
        {showLogin ? (
          <Login onLoggedIn={handleAuthed} />
        ) : (
          <Register onRegistered={handleAuthed} />
        )}
        <div className="auth-switch">
          <button className="link" onClick={() => setShowLogin(!showLogin)}>
            {showLogin ? "Need an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;