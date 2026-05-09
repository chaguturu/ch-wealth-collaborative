import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import Navigation from "@/components/Navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();
  if (!session) redirect("/login");

  const userName  = (session.user?.name  as string | undefined) ?? (session.user?.email as string | undefined) ?? "User";
  const userEmail = (session.user?.email as string | undefined) ?? "";

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#0B0F1C", color: "#E8DFC8" }}>
      <Navigation userName={userName} userEmail={userEmail} />
      <main style={{
        paddingBottom: "calc(64px + env(safe-area-inset-bottom))",
        minHeight: "100dvh",
      }} className="dashboard-main">
        {children}
      </main>
      <style>{`
        @media (min-width: 768px) {
          .dashboard-main {
            margin-left: 220px;
            padding-bottom: 0 !important;
          }
        }
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
