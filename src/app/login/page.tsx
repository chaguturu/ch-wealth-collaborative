import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";

function LoginButton() {
  return (
    <a
      href="/api/auth/login"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#C94A00",
        color: "#E8DFC8",
        fontFamily: "Georgia, serif",
        fontSize: "1rem",
        fontWeight: "700",
        padding: "14px 32px",
        borderRadius: "8px",
        textDecoration: "none",
        minHeight: "44px",
        letterSpacing: "0.02em",
      }}
    >
      Sign In
    </a>
  );
}

function LoginLogo() {
  return (
    <div style={{
      width: "72px",
      height: "72px",
      backgroundColor: "#111827",
      border: "1px solid #1E2D4A",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      <span style={{
        fontFamily: "Georgia, serif",
        fontSize: "1.75rem",
        fontWeight: "700",
        color: "#E8B84B",
        letterSpacing: "-0.02em",
      }}>
        CW
      </span>
      <div style={{
        position: "absolute",
        bottom: "8px",
        left: "12px",
        right: "12px",
        height: "3px",
        backgroundColor: "#C94A00",
        borderRadius: "2px",
      }} />
    </div>
  );
}

function LoginCard() {
  return (
    <div style={{
      backgroundColor: "#111827",
      border: "1px solid #1E2D4A",
      borderRadius: "12px",
      padding: "40px 32px",
      width: "100%",
      maxWidth: "400px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
    }}>
      <LoginLogo />
      <h1 style={{
        fontFamily: "Georgia, serif",
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#E8DFC8",
        marginBottom: "8px",
        letterSpacing: "-0.01em",
      }}>
        CH Wealth Collaborative
      </h1>
      <p style={{
        fontFamily: "Georgia, serif",
        fontSize: "0.9rem",
        color: "#7A8FA8",
        marginBottom: "32px",
        lineHeight: "1.5",
      }}>
        Private household wealth management.
        <br />
        Authorized access only.
      </p>
      <LoginButton />
    </div>
  );
}

export default async function LoginPage() {
  const session = await auth0.getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main style={{
      minHeight: "100dvh",
      backgroundColor: "#0B0F1C",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      <LoginCard />
    </main>
  );
}
