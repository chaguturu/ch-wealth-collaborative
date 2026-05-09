export type GrantType = "RSU" | "PSU" | "NQO" | "ISO" | "ESPP";

export interface VestEntry {
  id: string;
  vest_date: string;
  shares: number;
  vested: boolean;
}

export interface EquityGrant {
  id: string;
  grant_id: string;
  grant_type: GrantType;
  total_shares: number;
  strike_price: number | null;
  expiration_date: string | null;
  psu_achievement_pct: number;
  status: string;
  vest_schedule: VestEntry[];
}

export interface EquityEmployer {
  id: string;
  company_name: string;
  ticker_symbol: string;
  price_override: number | null;
  price_fallback: number;
}

export interface EquityData {
  employer: EquityEmployer;
  grants: EquityGrant[];
}

// PSU slider state: grant_id -> achievement pct (0-200)
export type PsuSliders = Record<string, number>;
