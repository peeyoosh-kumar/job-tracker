const API_BASE = "http://localhost:5000/api";

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    // data.message covers the plain error cases; data.errors covers
    // the express-validator shape, in case Peeyoosh wires it in later
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}