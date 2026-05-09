"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { C } from "@/lib/tokens";

const TABS = [
  {
    href: "/dashboard",
    label: "Net Worth",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? C.text : C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/accounts",
    label: "Accounts",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? C.text : C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/equity",
    label: "Equity",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? C.text : C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/scenarios",
    label: "Scenarios",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? C.text : C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? C.text : C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface NavigationProps {
  userName: string;
  userEmail: string;
}

export default function Navigation({ userName, userEmail }: NavigationProps) {
  const pathname = usePathname();
  const initials = getInitials(userName);
  const firstName = userName.split(" ")[0];

  return (
    <>
      {/* Mobile bottom tab bar */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: C.panel,
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom)",
      }} className="md-hide">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link key={tab.href} href={tab.href} style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 0 6px",
              textDecoration: "none",
              gap: "3px",
              minHeight: "56px",
              borderTop: active ? `2px solid ${C.gold}` : "2px solid transparent",
              marginTop: -1,
            }}>
              {tab.icon(active)}
              <span style={{
                fontSize: "10px",
                color: active ? C.text : C.muted,
                fontFamily: "Georgia, serif",
                letterSpacing: "0.02em",
              }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop sidebar */}
      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: "220px",
        backgroundColor: C.panel,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }} className="md-show">

        {/* Logo / household */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent, marginBottom: 2 }}>
            CH Wealth
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: C.text, fontFamily: "Georgia, serif" }}>
            Collaborative
          </div>
        </div>

        {/* User identity */}
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.accent} 0%, #8b3400 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            letterSpacing: "0.05em",
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.85rem", color: C.text, fontWeight: 600, fontFamily: "Georgia, serif" }}>{firstName}</div>
            <div style={{ fontSize: "0.7rem", color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link key={tab.href} href={tab.href} style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 10px",
                borderRadius: "7px",
                textDecoration: "none",
                marginBottom: "2px",
                backgroundColor: active ? "#192338" : "transparent",
                borderLeft: active ? `3px solid ${C.gold}` : "3px solid transparent",
                transition: "background-color 0.15s",
              }}>
                {tab.icon(active)}
                <span style={{
                  fontSize: "0.875rem",
                  color: active ? C.text : C.muted,
                  fontFamily: "Georgia, serif",
                  fontWeight: active ? 600 : 400,
                }}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}` }}>
          <a href="/auth/logout" style={{
            fontSize: "0.75rem",
            color: C.muted,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </a>
        </div>
      </aside>

      <style>{`
        @media (min-width: 768px) { .md-hide { display: none !important; } }
        @media (max-width: 767px) { .md-show { display: none !important; } }
      `}</style>
    </>
  );
}
