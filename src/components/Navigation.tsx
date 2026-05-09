"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/dashboard",
    label: "Net Worth",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#E8DFC8" : "#7A8FA8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/accounts",
    label: "Accounts",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#E8DFC8" : "#7A8FA8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/equity",
    label: "Equity",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#E8DFC8" : "#7A8FA8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/scenarios",
    label: "Scenarios",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#E8DFC8" : "#7A8FA8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10"/>
        <line x1="18" y1="20" x2="18" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="16"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#E8DFC8" : "#7A8FA8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile bottom tab bar */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: "#111827",
        borderTop: "1px solid #1E2D4A",
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
              padding: "10px 0 8px",
              textDecoration: "none",
              gap: "3px",
              minHeight: "56px",
            }}>
              {tab.icon(active)}
              <span style={{
                fontSize: "10px",
                color: active ? "#E8DFC8" : "#7A8FA8",
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
        backgroundColor: "#111827",
        borderRight: "1px solid #1E2D4A",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        zIndex: 50,
      }} className="md-show">
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #1E2D4A" }}>
          <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "#E8DFC8", fontFamily: "Georgia, serif" }}>
            CH Wealth
          </div>
          <div style={{ fontSize: "0.75rem", color: "#7A8FA8", marginTop: "2px" }}>
            Collaborative
          </div>
        </div>
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link key={tab.href} href={tab.href} style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "6px",
                textDecoration: "none",
                marginBottom: "2px",
                backgroundColor: active ? "#1E2D4A" : "transparent",
              }}>
                {tab.icon(active)}
                <span style={{
                  fontSize: "0.875rem",
                  color: active ? "#E8DFC8" : "#7A8FA8",
                  fontFamily: "Georgia, serif",
                }}>
                  {tab.label}
                </span>
                {active && (
                  <div style={{
                    marginLeft: "auto",
                    width: "3px",
                    height: "16px",
                    backgroundColor: "#C94A00",
                    borderRadius: "2px",
                  }} />
                )}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #1E2D4A" }}>
          <a href="/auth/logout" style={{
            fontSize: "0.75rem",
            color: "#7A8FA8",
            textDecoration: "none",
          }}>
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
