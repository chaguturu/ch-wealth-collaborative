// equity.ts
// Equity compensation calculation engine.
// All calculations are pure functions - no API calls, no side effects.
// Runs client-side for real-time updates as price and PSU sliders change.

// TAX DEFAULTS (from build spec)
// Federal: 37%, Massachusetts: 5%, Medicare: 2.35% = 44.35% combined
export const DEFAULT_TAX_RATES = {
  federal:   0.37,
  state:     0.05,
  medicare:  0.0235,
  combined:  0.4435,
};

// calcRsuValue
// RSU value = shares * current price
// After-tax = gross * (1 - combined tax rate)

export function calcRsuValue(params: {
  shares: number;
  price: number;
  taxRate?: number;
}): { gross: number; afterTax: number; taxDue: number } {
  const { shares, price, taxRate = DEFAULT_TAX_RATES.combined } = params;
  const gross = shares * price;
  const taxDue = gross * taxRate;
  const afterTax = gross - taxDue;
  return { gross, afterTax, taxDue };
}

// calcPsuValue
// PSU value = target shares * achievement pct * current price
// achievementPct is 0-200 (percentage points, not decimal)

export function calcPsuValue(params: {
  targetShares: number;
  achievementPct: number;
  price: number;
  taxRate?: number;
}): { shares: number; gross: number; afterTax: number; taxDue: number } {
  const { targetShares, achievementPct, price, taxRate = DEFAULT_TAX_RATES.combined } = params;
  const shares = targetShares * (achievementPct / 100);
  const gross = shares * price;
  const taxDue = gross * taxRate;
  const afterTax = gross - taxDue;
  return { shares, gross, afterTax, taxDue };
}

// calcNqoValue
// NQO spread value = (current price - strike price) * shares
// Only in-the-money options have value.
// NQOs are taxed as ordinary income at exercise.

export function calcNqoValue(params: {
  shares: number;
  currentPrice: number;
  strikePrice: number;
  taxRate?: number;
}): {
  isItm: boolean;
  spread: number;
  gross: number;
  afterTax: number;
  taxDue: number;
} {
  const { shares, currentPrice, strikePrice, taxRate = DEFAULT_TAX_RATES.combined } = params;
  const spread = currentPrice - strikePrice;
  const isItm = spread > 0;
  const gross = isItm ? spread * shares : 0;
  const taxDue = gross * taxRate;
  const afterTax = gross - taxDue;
  return { isItm, spread: isItm ? spread : 0, gross, afterTax, taxDue };
}

// calcTotalEquityValue
// Aggregates RSU + PSU + NQO values across all grants.

export type GrantInput =
  | { type: "RSU"; shares: number; vested: boolean }
  | { type: "PSU"; targetShares: number; achievementPct: number }
  | { type: "NQO"; shares: number; strikePrice: number; vested: boolean };

export function calcTotalEquityValue(params: {
  grants: GrantInput[];
  price: number;
  taxRate?: number;
}): {
  rsuGross: number;
  rsuAfterTax: number;
  psuGross: number;
  psuAfterTax: number;
  nqoGross: number;
  nqoAfterTax: number;
  totalGross: number;
  totalAfterTax: number;
  totalTaxDue: number;
} {
  const { grants, price, taxRate = DEFAULT_TAX_RATES.combined } = params;

  let rsuGross = 0, rsuAfterTax = 0;
  let psuGross = 0, psuAfterTax = 0;
  let nqoGross = 0, nqoAfterTax = 0;

  for (const grant of grants) {
    if (grant.type === "RSU") {
      const v = calcRsuValue({ shares: grant.shares, price, taxRate });
      rsuGross    += v.gross;
      rsuAfterTax += v.afterTax;
    } else if (grant.type === "PSU") {
      const v = calcPsuValue({ targetShares: grant.targetShares, achievementPct: grant.achievementPct, price, taxRate });
      psuGross    += v.gross;
      psuAfterTax += v.afterTax;
    } else if (grant.type === "NQO" && grant.vested) {
      const v = calcNqoValue({ shares: grant.shares, currentPrice: price, strikePrice: grant.strikePrice, taxRate });
      nqoGross    += v.gross;
      nqoAfterTax += v.afterTax;
    }
  }

  const totalGross    = rsuGross + psuGross + nqoGross;
  const totalAfterTax = rsuAfterTax + psuAfterTax + nqoAfterTax;
  const totalTaxDue   = totalGross - totalAfterTax;

  return {
    rsuGross, rsuAfterTax,
    psuGross, psuAfterTax,
    nqoGross, nqoAfterTax,
    totalGross, totalAfterTax, totalTaxDue,
  };
}

// calcConcentration
// Returns CVS equity as a percentage of total net worth.

export function calcConcentration(params: {
  equityGross: number;
  totalNetWorth: number;
}): number {
  const { equityGross, totalNetWorth } = params;
  if (!totalNetWorth || totalNetWorth <= 0) return 0;
  return equityGross / totalNetWorth;
}
