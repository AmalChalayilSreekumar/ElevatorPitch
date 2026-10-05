// Empty in dev (Vite proxies /api to the backend); set VITE_API_URL when the API lives on another origin.
const API_URL = import.meta.env.VITE_API_URL ?? '';

// Resolves to { profile, projects, experience, stack, stackBoards } from backend/server.js.
export async function loadContent() {
  const res = await fetch(`${API_URL}/api/content`);
  if (!res.ok) throw new Error(`Content request failed: ${res.status} ${res.statusText}`);
  return res.json();
}
