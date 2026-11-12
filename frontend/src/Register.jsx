import { useState, useRef } from "react";
import { apiRequest } from "./api";

function Register({ onRegistered }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // handles to the next boxes, so Enter can jump forward
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Enter on this box moves to nextRef instead of submitting the form
  function moveOnEnter(e, nextRef) {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef.current.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      // data looks like: { token, user: { id, name, email, role } }
      onRegistered(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name: </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => moveOnEnter(e, emailRef)}
          />
        </div>
        <div>
          <label>Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => moveOnEnter(e, passwordRef)}
            ref={emailRef}
          />
        </div>
        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            ref={passwordRef}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Register;