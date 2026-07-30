"use client";

import "./globals.css";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { API_BASE } from "./config";
import {
  LayoutDashboard,
  FolderOpen,
  MessageSquare,
  Sun,
  Moon,
  User,
  Zap,
  X,
  LogOut,
} from "lucide-react";

interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  created_at: string;
  meeting_count: number;
  commitment_count: number;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workspace", label: "Workspace", icon: FolderOpen },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
];

function ProfileModal({
  user,
  onClose,
}: {
  user: UserProfile | null;
  onClose: () => void;
}) {
  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-in"
        style={{ width: "400px", maxWidth: "90vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Profile</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: "4px" }}
            aria-label="Close profile"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "var(--color-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <User size={32} color="white" />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 600 }}>{user.name}</h3>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
            {user.email}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div
            style={{
              padding: "16px",
              background: "var(--color-surface-elevated)",
              borderRadius: "var(--radius-md)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-secondary)" }}>
              {user.meeting_count}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Meetings</div>
          </div>
          <div
            style={{
              padding: "16px",
              background: "var(--color-surface-elevated)",
              borderRadius: "var(--radius-md)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-success)" }}>
              {user.commitment_count}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Commitments</div>
          </div>
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "var(--color-surface-elevated)",
            borderRadius: "var(--radius-md)",
            fontSize: "12px",
            color: "var(--color-text-muted)",
          }}
        >
          Member since{" "}
          {user.created_at
            ? new Date(user.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })
            : "N/A"}
        </div>
      </div>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: any;
  isActive: boolean;
}) {
  return (
    <a
      href={href}
      className="btn btn-ghost btn-sm"
      style={{
        background: isActive ? "var(--color-surface-elevated)" : "transparent",
        color: isActive ? "var(--color-text)" : "var(--color-text-secondary)",
        fontWeight: isActive ? 600 : 400,
        borderRadius: "var(--radius-md)",
        padding: "8px 14px",
        fontSize: "13px",
        gap: "6px",
        transition: "all var(--transition-fast)",
      }}
    >
      <Icon size={16} />
      {label}
    </a>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState("light");
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, logout } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem("emos-theme");
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      fetch(`${API_BASE}/meetings/user/${authUser.id}`)
        .then((res) => res.json())
        .then(setProfile)
        .catch(() => {});
    }
  }, [authUser]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("emos-theme", next);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isLoginPage = pathname === "/login";

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {!isLoginPage && authUser && (
          <nav
            style={{
              background: "var(--color-nav-bg)",
              borderBottom: "1px solid var(--color-border)",
              padding: "0 24px",
              height: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "sticky",
              top: 0,
              zIndex: 40,
              backdropFilter: "blur(12px)",
              backgroundColor: "color-mix(in srgb, var(--color-nav-bg) 85%, transparent)",
              transition: "all var(--transition-base)",
            }}
          >
            {/* Left: Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={16} color="white" />
              </div>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                  color: "var(--color-text)",
                }}
              >
                EMOS
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--color-text-muted)",
                  fontWeight: 500,
                  marginLeft: "4px",
                }}
              >
                Enterprise Memory OS
              </span>
            </div>

            {/* Center: Navigation */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={pathname === item.href}
                />
              ))}
            </div>

            {/* Right: Theme toggle + Profile + Logout */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={toggleTheme}
                className="btn btn-ghost btn-sm"
                style={{ padding: "8px", borderRadius: "var(--radius-md)" }}
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <Moon size={16} className="theme-toggle-icon" />
                ) : (
                  <Sun size={16} className="theme-toggle-icon" style={{ color: "#FDE68A" }} />
                )}
              </button>

              <button
                onClick={() => setShowProfile(true)}
                className="btn btn-ghost btn-sm"
                style={{ padding: "4px 10px 4px 4px", borderRadius: "var(--radius-md)", gap: "8px" }}
                aria-label="View profile"
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "var(--color-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={14} color="white" />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text)" }}>
                  {authUser?.name || "User"}
                </span>
              </button>

              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
                style={{ padding: "8px", borderRadius: "var(--radius-md)" }}
                aria-label="Logout"
              >
                <LogOut size={16} style={{ color: "var(--color-text-muted)" }} />
              </button>
            </div>
          </nav>
        )}

        <main
          style={{
            flex: 1,
            maxWidth: isLoginPage ? "none" : "1200px",
            width: "100%",
            margin: "0 auto",
            padding: isLoginPage ? "0" : "32px 24px",
          }}
        >
          {children}
        </main>

        {!isLoginPage && showProfile && (
          <ProfileModal user={profile} onClose={() => setShowProfile(false)} />
        )}
      </div>
    </ThemeContext.Provider>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('emos-theme');
                if (t) document.documentElement.setAttribute('data-theme', t);
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
