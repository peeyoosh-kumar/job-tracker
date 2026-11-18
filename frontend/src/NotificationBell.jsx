import { useEffect, useRef, useState } from "react";
import { apiRequest } from "./api";
import "./NotificationBell.css";

// Shows a bell with a count badge. Clicking it opens a list of alerts.
// props:
//   token              - the login token
//   onAuthError        - called when the backend says the login is no longer valid (401)
//   onOpenApplications - called when an alert is clicked (opens the Applications page)
//   refreshKey         - a number; when it changes, we load the alerts again
function NotificationBell({ token, onAuthError, onOpenApplications, refreshKey }) {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const boxRef = useRef(null);

  // Loads the alerts now, then again every 60 seconds.
  // When refreshKey or token changes, the cleanup below stops the old timer
  // before a new one starts, so there is never more than one timer.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiRequest("/notifications", { token });
        if (cancelled) return;
        const list = Array.isArray(data.items) ? data.items : [];
        setItems(list);
        setCount(typeof data.count === "number" ? data.count : list.length);
        setError("");
      } catch (err) {
        if (cancelled) return;
        if (err.status === 401) {
          onAuthError();
          return;
        }
        if (err.status === 429) {
          setError("Too many requests. Trying again soon.");
        } else {
          setError("Could not load alerts.");
        }
      }
    }

    load();
    const timer = setInterval(load, 60000); // 60 seconds, never faster

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // onAuthError is left out on purpose: it is a new function on every render
    // and would restart the timer each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, refreshKey]);

  // Closes the dropdown when the user clicks anywhere outside it.
  useEffect(() => {
    function handleClickOutside(event) {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleItemClick() {
    setOpen(false);
    onOpenApplications();
  }

  return (
    <div className="bell" ref={boxRef}>
      <button
        className="bell-button"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        🔔
        {count > 0 && <span className="bell-badge">{count}</span>}
      </button>

      {open && (
        <div className="bell-menu">
          {error && <div className="bell-error">{error}</div>}

          {items.length === 0 && !error && (
            <div className="bell-empty">Nothing due</div>
          )}

          {items.map((item) => (
            <button
              key={`${item.applicationId}-${item.type}`}
              className={`bell-item bell-${item.severity}`}
              onClick={handleItemClick}
            >
              <span className="bell-type">
                {item.type === "followup" ? "Follow up" : "Deadline"}
              </span>
              <span className="bell-message">{item.message}</span>
              <span className="bell-sub">
                {item.company} - {item.role}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;