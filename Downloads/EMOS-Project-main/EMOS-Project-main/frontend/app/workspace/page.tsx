"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE } from "../config";
import {
  Upload, FileText, Loader2, Trash2, Calendar, File,
  ChevronDown, ChevronRight, CheckCircle, AlertTriangle,
  ListChecks, MessageSquare, HelpCircle, Target, Circle
} from "lucide-react";

interface Meeting {
  id: number;
  title: string;
  summary: string;
  meeting_date: string;
  commitment_count: number;
  decisions_count: number;
}

interface MeetingDetail {
  id: number;
  title: string;
  summary: string;
  meeting_date: string;
  decisions: string[];
  action_items: Array<{ task: string; owner: string; deadline: string; priority: string }>;
  risks: string[];
  dependencies: string[];
  questions: string[];
  commitments: Array<{ id: number; task: string; owner: string; deadline: string | null; status: string; priority: string }>;
}

export default function WorkspacePage() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (authUser) fetchMeetings();
  }, [authUser]);

  const fetchMeetings = async () => {
    if (!authUser) return;
    setLoadingMeetings(true);
    try {
      const res = await fetch(`${API_BASE}/meetings/list/${authUser.id}`);
      if (res.ok) {
        setMeetings(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch meetings", e);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const fetchDetail = async (meetingId: number) => {
    if (expandedId === meetingId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(meetingId);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}/detail`);
      if (res.ok) {
        setDetail(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch detail", e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggle = async (commitmentId: number) => {
    try {
      const res = await fetch(`${API_BASE}/meetings/commitments/${commitmentId}/toggle`, { method: "PATCH" });
      if (res.ok && expandedId) fetchDetail(expandedId);
    } catch (e) {
      console.error("Failed to toggle commitment", e);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !authUser) {
      setUploadStatus({ type: "error", message: "Please enter a title and select a file." });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("user_id", String(authUser.id));
    formData.append("title", title);
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/meetings/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadStatus({ type: "success", message: `Meeting "${title}" uploaded successfully!` });
        setTitle("");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchMeetings();
        window.dispatchEvent(new Event("emos-data-changed"));
      } else {
        const errorText = await res.text();
        setUploadStatus({ type: "error", message: `Upload failed: ${errorText}` });
      }
    } catch (err) {
      setUploadStatus({ type: "error", message: "Network error. Is the backend running?" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (meetingId: number) => {
    if (!confirm("Delete this meeting and all its commitments?")) return;

    setDeletingId(meetingId);
    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}`, { method: "DELETE" });
      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
        if (expandedId === meetingId) { setExpandedId(null); setDetail(null); }
        window.dispatchEvent(new Event("emos-data-changed"));
      }
    } catch (err) {
      console.error("Failed to delete meeting", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Upload Section */}
      <div className="card animate-fade-in">
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.3px" }}>
            Meeting Workspace
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
            Upload a meeting transcript to extract commitments, decisions, and action items.
          </p>
        </div>

        <form onSubmit={handleUpload}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" }}>
                Meeting Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Sprint Planning - Week 5"
                style={{
                  width: "100%", padding: "10px 14px",
                  border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                  background: "var(--color-surface)", color: "var(--color-text)",
                  fontSize: "14px", outline: "none", transition: "border-color var(--transition-fast)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-secondary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" }}>
                Transcript File (.txt)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{
                  width: "100%", padding: "10px 14px",
                  border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                  background: "var(--color-surface)", color: "var(--color-text)",
                  fontSize: "14px", outline: "none",
                }}
                required
              />
            </div>
            <button type="submit" disabled={uploading} className="btn btn-primary" style={{ height: "42px", padding: "0 24px", whiteSpace: "nowrap" }}>
              {uploading ? (
                <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Processing...</>
              ) : (
                <><Upload size={16} /> Upload</>
              )}
            </button>
          </div>
        </form>

        {uploadStatus && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: "16px", padding: "12px 16px", borderRadius: "var(--radius-md)", fontSize: "13px",
              background: uploadStatus.type === "success" ? "color-mix(in srgb, var(--color-success) 8%, transparent)" : "color-mix(in srgb, var(--color-danger) 8%, transparent)",
              color: uploadStatus.type === "success" ? "var(--color-success)" : "var(--color-danger)",
              border: `1px solid ${uploadStatus.type === "success" ? "color-mix(in srgb, var(--color-success) 20%, transparent)" : "color-mix(in srgb, var(--color-danger) 20%, transparent)"}`,
            }}
          >
            {uploadStatus.message}
          </div>
        )}
      </div>

      {/* Meeting List */}
      <div className="card animate-fade-in-delay-1">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={16} style={{ color: "var(--color-secondary)" }} />
            Your Meetings
          </h2>
          {meetings.length > 0 && (
            <span className="badge" style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}>
              {meetings.length}
            </span>
          )}
        </div>

        {loadingMeetings ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Loader2 size={24} style={{ color: "var(--color-secondary)", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          </div>
        ) : meetings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <File size={32} style={{ color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No meetings uploaded yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {meetings.map((m, idx) => (
              <div key={m.id} style={{ opacity: 0, animation: `fadeIn 0.3s ease ${idx * 0.05}s forwards` }}>
                {/* Meeting card */}
                <div
                  onClick={() => fetchDetail(m.id)}
                  className="card-hover"
                  style={{
                    padding: "16px",
                    background: expandedId === m.id ? "color-mix(in srgb, var(--color-secondary) 5%, var(--color-surface-elevated))" : "var(--color-surface-elevated)",
                    borderRadius: expandedId === m.id ? "var(--radius-md) var(--radius-md) 0 0" : "var(--radius-md)",
                    borderBottom: expandedId === m.id ? "none" : undefined,
                    borderLeft: expandedId === m.id ? "2px solid var(--color-secondary)" : undefined,
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", cursor: "pointer",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {expandedId === m.id ? (
                        <ChevronDown size={14} style={{ color: "var(--color-secondary)", flexShrink: 0 }} />
                      ) : (
                        <File size={14} style={{ color: "var(--color-secondary)", flexShrink: 0 }} />
                      )}
                      <h3 style={{ fontSize: "14px", fontWeight: 500 }}>{m.title}</h3>
                      <span className="badge" style={{ background: "color-mix(in srgb, var(--color-secondary) 10%, transparent)", color: "var(--color-secondary)", fontSize: "11px" }}>
                        {m.commitment_count} tasks
                      </span>
                      {m.decisions_count > 0 && (
                        <span className="badge" style={{ background: "color-mix(in srgb, var(--color-success) 10%, transparent)", color: "var(--color-success)", fontSize: "11px" }}>
                          {m.decisions_count} decisions
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.summary || "No summary available"}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "8px" }}>
                      <Calendar size={12} style={{ color: "var(--color-text-muted)" }} />
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                        {new Date(m.meeting_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                    disabled={deletingId === m.id}
                    className="btn btn-ghost btn-sm"
                    style={{
                      padding: "6px",
                      color: deletingId === m.id ? "var(--color-text-muted)" : "var(--color-danger)",
                      opacity: deletingId === m.id ? 0.5 : 1, flexShrink: 0,
                    }}
                    aria-label={`Delete ${m.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Expanded detail panel */}
                {expandedId === m.id && (
                  <div
                    className="animate-fade-in"
                    style={{
                      padding: "20px 24px",
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderTop: "none",
                      borderRadius: "0 0 var(--radius-md) var(--radius-md)",
                      marginTop: "-1px",
                    }}
                  >
                    {loadingDetail ? (
                      <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <Loader2 size={20} style={{ color: "var(--color-secondary)", animation: "spin 1s linear infinite" }} />
                      </div>
                    ) : detail ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* Summary */}
                        <div>
                          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Summary</h4>
                          <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--color-text)" }}>{detail.summary}</p>
                        </div>

                        {/* Commitments */}
                        {detail.commitments.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <Target size={14} /> Commitments ({detail.commitments.length})
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {detail.commitments.map((c) => (
                                <div key={c.id} style={{
                                  padding: "10px 14px", borderRadius: "var(--radius-md)",
                                  background: c.status === "Done" ? "color-mix(in srgb, var(--color-success) 5%, var(--color-surface-elevated))" : "var(--color-surface-elevated)",
                                  display: "flex", alignItems: "center", justifyContent: "space-between",
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                                    <button
                                      onClick={() => handleToggle(c.id)}
                                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}
                                      title={c.status === "Done" ? "Mark as pending" : "Mark as done"}
                                    >
                                      {c.status === "Done" ? (
                                        <CheckCircle size={16} style={{ color: "var(--color-success)" }} />
                                      ) : (
                                        <Circle size={16} style={{ color: "var(--color-text-muted)" }} />
                                      )}
                                    </button>
                                    <span style={{ fontSize: "13px", textDecoration: c.status === "Done" ? "line-through" : "none", opacity: c.status === "Done" ? 0.6 : 1 }}>{c.task}</span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--color-text-muted)", flexShrink: 0 }}>
                                    <span>{c.owner}</span>
                                    <span>{c.deadline ? new Date(c.deadline).toLocaleDateString() : "No deadline"}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Decisions */}
                        {detail.decisions.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <CheckCircle size={14} style={{ color: "var(--color-success)" }} /> Decisions
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {detail.decisions.map((d, i) => (
                                <div key={i} style={{ fontSize: "13px", padding: "8px 12px", background: "color-mix(in srgb, var(--color-success) 5%, transparent)", borderRadius: "var(--radius-md)" }}>
                                  {d}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Risks */}
                        {detail.risks.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <AlertTriangle size={14} style={{ color: "var(--color-warning)" }} /> Risks
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {detail.risks.map((r, i) => (
                                <div key={i} style={{ fontSize: "13px", padding: "8px 12px", background: "color-mix(in srgb, var(--color-warning) 5%, transparent)", borderRadius: "var(--radius-md)" }}>
                                  {r}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Questions */}
                        {detail.questions.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <HelpCircle size={14} style={{ color: "var(--color-text-muted)" }} /> Open Questions
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {detail.questions.map((q, i) => (
                                <div key={i} style={{ fontSize: "13px", padding: "8px 12px", background: "var(--color-surface-elevated)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)" }}>
                                  {q}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Dependencies */}
                        {detail.dependencies.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <ListChecks size={14} style={{ color: "var(--color-secondary)" }} /> Dependencies
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {detail.dependencies.map((dep, i) => (
                                <div key={i} style={{ fontSize: "13px", padding: "8px 12px", background: "color-mix(in srgb, var(--color-secondary) 5%, transparent)", borderRadius: "var(--radius-md)" }}>
                                  {dep}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
