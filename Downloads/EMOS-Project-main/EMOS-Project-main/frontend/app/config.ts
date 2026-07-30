export const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.endsWith("replit.dev")
      ? `${window.location.protocol}//${window.location.hostname}:8000`
      : "http://localhost:8000"
    : "http://localhost:8000";
