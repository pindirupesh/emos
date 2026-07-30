"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { Zap, Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    let result;
    if (isSignup) {
      if (!name.trim()) {
        setError("Name is required");
        setSubmitting(false);
        return;
      }
      result = await signup(name, email, password);
    } else {
      result = await login(email, password);
    }

    setSubmitting(false);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Something went wrong");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-surface)",
        padding: "24px",
      }}
    >
      <div className="animate-fade-in" style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-lg)",
              background: "var(--color-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Zap size={24} color="white" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.5px" }}>EMOS</h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
            Enterprise Memory OS
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
            {isSignup ? "Create account" : "Welcome back"}
          </h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "24px" }}>
            {isSignup ? "Sign up to start tracking your meetings" : "Sign in to your account"}
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {isSignup && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" }}>
                    Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <User
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--color-text-muted)",
                      }}
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 38px",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-surface)",
                        color: "var(--color-text)",
                        fontSize: "14px",
                        outline: "none",
                        transition: "border-color var(--transition-fast)",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--color-secondary)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" }}>
                  Email
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-muted)",
                    }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-surface)",
                      color: "var(--color-text)",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color var(--transition-fast)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--color-secondary)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-muted)",
                    }}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-surface)",
                      color: "var(--color-text)",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color var(--transition-fast)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--color-secondary)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div
                className="animate-fade-in"
                style={{
                  marginTop: "14px",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "13px",
                  background: "color-mix(in srgb, var(--color-danger) 8%, transparent)",
                  color: "var(--color-danger)",
                  border: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: "100%",
                marginTop: "20px",
                padding: "11px 16px",
                fontSize: "14px",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  {isSignup ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                <>
                  {isSignup ? "Create account" : "Sign in"}
                  <ArrowRight size={16} />
                </>
              )}
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: "20px",
              fontSize: "13px",
              color: "var(--color-text-muted)",
            }}
          >
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-secondary)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
                padding: 0,
                textDecoration: "underline",
                textUnderlineOffset: "2px",
              }}
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
