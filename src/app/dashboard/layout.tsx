import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import Navigation from "@/components/Navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();
  if (!session) redirect("/login");

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#0B0F1C", color: "#E8DFC8" }}>
      <Navigation />
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
      `}</style>
    </div>
  );
}
