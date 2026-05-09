"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatters";

interface Account {
  id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  current_balance: number | null;
  available_balance: number | null;
  iso_currency: string;
}

interface Props {
  refreshKey: number;
}

export default function AccountsList({ refreshKey }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/plaid/accounts")
      .then((r) => r.json())
      .then((d) => {
        setAccounts(d.accounts ?? []);
        setLoading(false);
      });
  }, [refreshKey]);

  if (loading) return <p style={{ color: "#7A8FA8", fontSize: "0.875rem" }}>Loading accounts…</p>;
  if (accounts.length === 0) return null;

  return (
    <div style={{ width: "100%", maxWidth: "480px" }}>
      <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "12px", color: "#E8DFC8" }}>
        Accounts
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {accounts.map((a) => (
          <div
            key={a.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#161B2E",
              borderRadius: "8px",
              padding: "12px 16px",
            }}
          >
            <div>
              <div style={{ fontSize: "0.875rem", color: "#E8DFC8" }}>{a.name}</div>
              <div style={{ fontSize: "0.75rem", color: "#7A8FA8", textTransform: "capitalize" }}>
                {a.subtype ?? a.type}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.875rem", color: "#E8DFC8" }}>
                {formatCurrency(a.current_balance)}
              </div>
              {a.available_balance != null && a.available_balance !== a.current_balance && (
                <div style={{ fontSize: "0.75rem", color: "#7A8FA8" }}>
                  {formatCurrency(a.available_balance)} avail
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
