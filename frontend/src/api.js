const API_BASE = "http://localhost:5000/api";

export async function apiRequest(path, { method = "GET", body, formData, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (formData) {
    // File upload: the browser sets the Content-Type itself, so we must not
    payload = formData;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    let message = data.message || "Something went wrong";
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      message = data.errors.map((e) => e.msg).join(". ");
    }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

// Downloads a file (like a resume). Returns the file as a "blob".
// Needs the token, which is why a plain <a href> link would not work.
export async function apiDownload(path, { token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers });

  if (!res.ok) {
    let message = "Download failed";
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      // the error reply wasn't JSON, so keep the default message
    }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return res.blob();
}