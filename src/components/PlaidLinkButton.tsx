"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useSearchParams } from "next/navigation";

interface Props {
  onSuccess: () => void;
}

export default function PlaidLinkButton({ onSuccess }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const oauthStateId = searchParams.get("oauth_state_id");

  useEffect(() => {
    // If returning from OAuth redirect, reuse token from sessionStorage
    if (oauthStateId) {
      const stored = sessionStorage.getItem("plaid_link_token");
      if (stored) { setLinkToken(stored); return; }
    }
    fetch("/api/plaid/create-link-token", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        setLinkToken(d.link_token);
        sessionStorage.setItem("plaid_link_token", d.link_token);
      });
  }, [oauthStateId]);

  const onPlaidSuccess = useCallback(
    async (publicToken: string, metadata: { institution: { institution_id: string; name: string } | null }) => {
      setLoading(true);
      sessionStorage.removeItem("plaid_link_token");
      await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_token: publicToken,
          institution_id: metadata.institution?.institution_id,
          institution_name: metadata.institution?.name,
        }),
      });
      setLoading(false);
      onSuccess();
    },
    [onSuccess]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess: onPlaidSuccess,
    receivedRedirectUri: oauthStateId ? window.location.href : undefined,
  });

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading}
      style={{
        backgroundColor: "#C94A00",
        color: "#E8DFC8",
        border: "none",
        borderRadius: "6px",
        padding: "10px 20px",
        fontFamily: "Georgia, serif",
        fontSize: "0.875rem",
        cursor: ready && !loading ? "pointer" : "not-allowed",
        opacity: ready && !loading ? 1 : 0.6,
      }}
    >
      {loading ? "Connecting…" : "Connect a bank account"}
    </button>
  );
}
