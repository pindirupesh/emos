"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../layout";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE } from "../config";
import {
  AlertCircle,
  Clock,
  Calendar,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  LinkIcon,
  Circle,
} from "lucide-react";

interface DashboardData {
  user_name: string;
  stats: {
    pending: number;
    overdue: number;
    done: number;
    total: number;
  };
  pending_commitments: Array<{ id: number; task: string; deadline: string | null }>;
  overdue_commitments: Array<{ id: number; task: string; deadline: string | null }>;
  blocked_tasks: Array<{ blocked_task: string; blocked_owner: string; blocking_task: string; blocking_owner: string }>;
  recent_meetings: Array<{ id: number; title: string; summary: string; meeting_date: string }>;
}

function DonutChart({ stats }: { stats: DashboardData["stats"] }) {
  const total = stats.total || 1;
  const donePct = (stats.done / total) * 100;
  const pendingPct = (stats.pending / total) * 100;
  const overduePct = (stats.overdue / total) * 100;

  const doneDeg = (donePct / 100) * 360;
  const pendingDeg = (pendingPct / 100) * 360;
  const overdueDeg = (overduePct / 100) * 360;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
      <div
        style={{
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          background: `conic-gradient(
            var(--color-success) 0deg ${doneDeg}deg,
            var(--color-warning) ${doneDeg}deg ${doneDeg + pendingDeg}deg,
            var(--color-danger) ${doneDeg + pendingDeg}deg ${doneDeg + pendingDeg + overdueDeg}deg,
            var(--color-surface-elevated) ${doneDeg + pendingDeg + overdueDeg}deg 360deg
          )`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "var(--color-surface)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1 }}>
            {stats.total}
          </span>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Total</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "2px",
              background: "var(--color-success)",
            }}
          />
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Done</span>
          <span style={{ fontSize: "13px", fontWeight: 600, marginLeft: "auto" }}>{stats.done}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "2px",
              background: "var(--color-warning)",
            }}
          />
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Pending</span>
          <span style={{ fontSize: "13px", fontWeight: 600, marginLeft: "auto" }}>{stats.pending}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "2px",
              background: "var(--color-danger)",
            }}
          />
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Overdue</span>
          <span style={{ fontSize: "13px", fontWeight: 600, marginLeft: "auto" }}>{stats.overdue}</span>
        </div>
      </div>
    </div>
  );
}

function BarChart({ stats }: { stats: DashboardData["stats"] }) {
  const max = Math.max(stats.done, stats.pending, stats.overdue, 1);
  const bars = [
    { label: "Done", value: stats.done, color: "var(--color-success)" },
    { label: "Pending", value: stats.pending, color: "var(--color-warning)" },
    { label: "Overdue", value: stats.overdue, color: "var(--color-danger)" },
  ];

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "24px", height: "140px", padding: "0 8px" }}>
      {bars.map((bar) => (
        <div key={bar.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flex: 1 }}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>{bar.value}</span>
          <div
            style={{
              width: "100%",
              maxWidth: "48px",
              height: `${(bar.value / max) * 100}px`,
              minHeight: bar.value > 0 ? "8px" : "2px",
              background: bar.color,
              borderRadius: "4px 4px 0 0",
              transition: "height 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            {bar.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const { user: authUser, loading: authLoading } = useAuth();
  const authUserRef = useRef(authUser);
  authUserRef.current = authUser;

  const fetchDashboard = useCallback(async () => {
    const user = authUserRef.current;
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/meetings/dashboard/${user.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError("Could not load dashboard. Is the backend running?");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      setLoading(false);
      setError("Please log in to view the dashboard.");
      return;
    }
    setLoading(true);
    fetchDashboard();
  }, [authUser, authLoading, fetchDashboard]);

  useEffect(() => {
    if (!authUser) return;

    const handleFocus = () => fetchDashboard();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchDashboard();
    };
    const handleDataChanged = () => fetchDashboard();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("emos-data-changed", handleDataChanged);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("emos-data-changed", handleDataChanged);
    };
  }, [authUser, fetchDashboard]);

  const handleToggle = async (commitmentId: number) => {
    try {
      const res = await fetch(`${API_BASE}/meetings/commitments/${commitmentId}/toggle`, { method: "PATCH" });
      if (res.ok) fetchDashboard();
    } catch (e) {
      console.error("Failed to toggle commitment", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: "400px" }}>
        <div className="animate-fade-in" style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid var(--color-border)",
              borderTopColor: "var(--color-secondary)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>Loading dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card animate-fade-in" style={{ textAlign: "center", padding: "48px" }}>
        <AlertCircle size={40} style={{ color: "var(--color-danger)", margin: "0 auto 16px" }} />
        <p style={{ fontSize: "14px", color: "var(--color-danger)" }}>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div className="animate-fade-in">
        <h1 style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.5px" }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
          {data.user_name}
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
          Here&apos;s your organizational memory snapshot
        </p>
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="animate-fade-in-delay-1">
        <div className="card">
          <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "20px", color: "var(--color-text-secondary)" }}>
            Overview
          </h3>
          <DonutChart stats={data.stats} />
        </div>
        <div className="card">
          <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "20px", color: "var(--color-text-secondary)" }}>
            Status Breakdown
          </h3>
          <BarChart stats={data.stats} />
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }} className="animate-fade-in-delay-2">
        {[
          { label: "Total", value: data.stats.total, color: "var(--color-secondary)", bg: "color-mix(in srgb, var(--color-secondary) 10%, transparent)" },
          { label: "Pending", value: data.stats.pending, color: "var(--color-warning)", bg: "color-mix(in srgb, var(--color-warning) 10%, transparent)" },
          { label: "Overdue", value: data.stats.overdue, color: "var(--color-danger)", bg: "color-mix(in srgb, var(--color-danger) 10%, transparent)" },
          { label: "Done", value: data.stats.done, color: "var(--color-success)", bg: "color-mix(in srgb, var(--color-success) 10%, transparent)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card card-hover"
            style={{ padding: "16px 20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-md)",
                  background: stat.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {stat.label === "Total" && <TrendingUp size={16} style={{ color: stat.color }} />}
                {stat.label === "Pending" && <Clock size={16} style={{ color: stat.color }} />}
                {stat.label === "Overdue" && <AlertCircle size={16} style={{ color: stat.color }} />}
                {stat.label === "Done" && <CheckCircle size={16} style={{ color: stat.color }} />}
              </div>
              <span style={{ fontSize: "28px", fontWeight: 700, color: stat.color }}>
                {stat.value}
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "8px" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Pending & Overdue */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="animate-fade-in-delay-3">
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={16} style={{ color: "var(--color-warning)" }} />
              Pending Tasks
            </h3>
            <span className="badge badge-pending">{data.pending_commitments.length}</span>
          </div>
          {data.pending_commitments.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", padding: "20px 0", textAlign: "center" }}>
              No pending tasks
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {data.pending_commitments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "12px",
                    background: "var(--color-surface-elevated)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <button
                    onClick={() => handleToggle(c.id)}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0, display: "flex" }}
                    title="Mark as done"
                  >
                    <Circle size={16} style={{ color: "var(--color-text-muted)" }} />
                  </button>
                  <span style={{ fontSize: "13px", flex: 1 }}>{c.task}</span>
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)", flexShrink: 0 }}>
                    {c.deadline ? new Date(c.deadline).toLocaleDateString() : "No deadline"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={16} style={{ color: "var(--color-danger)" }} />
              Overdue
            </h3>
            <span className="badge badge-overdue">{data.overdue_commitments.length}</span>
          </div>
          {data.overdue_commitments.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", padding: "20px 0", textAlign: "center" }}>
              Nothing overdue
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {data.overdue_commitments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "12px",
                    background: "color-mix(in srgb, var(--color-danger) 5%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--color-danger) 15%, transparent)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <button
                    onClick={() => handleToggle(c.id)}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0, display: "flex" }}
                    title="Mark as done"
                  >
                    <Circle size={16} style={{ color: "var(--color-danger)" }} />
                  </button>
                  <span style={{ fontSize: "13px", flex: 1 }}>{c.task}</span>
                  <span style={{ fontSize: "11px", color: "var(--color-danger)", fontWeight: 500, flexShrink: 0 }}>
                    {c.deadline ? `Due ${new Date(c.deadline).toLocaleDateString()}` : "No deadline"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Blocked Tasks */}
      {data.blocked_tasks && data.blocked_tasks.length > 0 && (
        <div className="card animate-fade-in-delay-3">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={16} style={{ color: "var(--color-danger)" }} />
              Blocked Tasks
            </h3>
            <span className="badge badge-overdue">{data.blocked_tasks.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.blocked_tasks.map((b, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 16px",
                  background: "color-mix(in srgb, var(--color-warning) 5%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-warning) 15%, transparent)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 500 }}>{b.blocked_task}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "12px", color: "var(--color-text-muted)" }}>
                  <LinkIcon size={12} />
                  <span>
                    Waiting on <strong style={{ color: "var(--color-text-secondary)" }}>{b.blocking_owner}</strong>: {b.blocking_task}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Meetings */}
      <div className="card animate-fade-in-delay-3">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={16} style={{ color: "var(--color-secondary)" }} />
            Recent Meetings
          </h3>
          <a
            href="/workspace"
            style={{
              fontSize: "12px",
              color: "var(--color-secondary)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: 500,
            }}
          >
            View all <ArrowRight size={12} />
          </a>
        </div>
        {data.recent_meetings.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", padding: "20px 0" }}>
            No meetings uploaded yet
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.recent_meetings.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: "14px 16px",
                  background: "var(--color-surface-elevated)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>{m.title}</span>
                  {m.summary && (
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      {m.summary.slice(0, 80)}
                      {m.summary.length > 80 ? "..." : ""}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                  {new Date(m.meeting_date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
