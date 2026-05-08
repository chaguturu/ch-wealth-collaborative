import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";

export default async function DashboardPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <main style={{
      minHeight: "100dvh",
      backgroundColor: "#0B0F1C",
      color: "#E8DFC8",
      fontFamily: "Georgia, serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "16px",
    }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "700" }}>
        CH Wealth Collaborative
      </h1>
      <p style={{ color: "#7A8FA8" }}>
        Welcome, {session.user.name}. Dashboard coming soon.
      </p>
      <a
        href="/api/auth/logout"
        style={{ color: "#C94A00", fontSize: "0.875rem" }}
      >
        Sign out
      </a>
    </main>
  );
}
