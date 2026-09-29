import { useState } from "react";
import Register from "./Register";
import Login from "./Login";
import Applications from "./Applications";

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  function handleAuthed(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
  }

  if (token) {
    return (
      <div>
        <h1>Job Application Tracker</h1>
        <p>Logged in as {user.name} ({user.email})</p>
        <button onClick={handleLogout}>Logout</button>
        <Applications token={token} />
      </div>
    );
  }

  return (
    <div>
      <h1>Job Application Tracker</h1>
      {showLogin ? (
        <Login onLoggedIn={handleAuthed} />
      ) : (
        <Register onRegistered={handleAuthed} />
      )}
      <button onClick={() => setShowLogin(!showLogin)}>
        {showLogin ? "Need an account? Register" : "Already have an account? Login"}
      </button>
    </div>
  );
}

export default App;