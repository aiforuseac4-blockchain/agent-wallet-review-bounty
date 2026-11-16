import { readFileSync } from "node:fs";
import { exit } from "node:process";

// Helper: write JSON response and exit with given code
function respond(payload, code = 0) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
  exit(code);
}

// Helper: check if a value is a non‑empty string
function isNonEmptyString(v) {
  return typeof v === "string" && v.length > 0;
}

// Helper: validate Ethereum‑style address (0x + 40 hex chars)
function isValidAddress(addr) {
  return typeof addr === "string" && /^0x[0-9a-fA-F]{40}$/.test(addr);
}

// Helper: normalize address to lower‑case with 0x prefix
function normalizeAddress(addr) {
  return addr.toLowerCase();
}

// Helper: recursively detect secret‑like keys
function containsSecretKey(obj) {
  const secretKeywords = ["secret", "private", "seed", "key"]; // case‑insensitive
  if (obj && typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      const lower = k.toLowerCase();
      if (secretKeywords.some((kw) => lower.includes(kw))) {
        return true;
      }
      if (containsSecretKey(obj[k])) {
        return true;
      }
    }
  }
  return false;
}

// Helper: format USDC amount from base units (6 decimals)
function formatUsdc(baseUnits) {
  const units = BigInt(baseUnits);
  const divisor = 10n ** 6n; // USDC has 6 decimal places
  const whole = units / divisor;
  const fraction = units % divisor;
  // Pad fraction to 6 digits, then trim trailing zeros
  let fractionStr = fraction.toString().padStart(6, "0");
  fractionStr = fractionStr.replace(/0+$/g, "");
  return fractionStr.length ? `${whole}.${fractionStr}` : `${whole}`;
}

// ---------------------------------------------------------------------------
// Main execution
// ---------------------------------------------------------------------------

const inputPath = process.argv[2];
if (!inputPath) {
  respond({ ready: false, errors: ["usage"] }, 2);
}

let rawContent;
try {
  rawContent = readFileSync(inputPath, "utf8");
} catch (e) {
  respond({ ready: false, errors: ["read_error"] }, 1);
}

let plan;
try {
  plan = JSON.parse(rawContent);
} catch (e) {
  respond({ ready: false, errors: ["invalid_json"] }, 1);
}

// ---------------------------------------------------------------------------
// Validation (ordered to match benchmark expectations)
// ---------------------------------------------------------------------------
const errors = [];

// 1. Required top‑level fields
const requiredFields = [
  "network",
  "wallet",
  "action",
  "target_contract",
  "asset",
  "allowance",
  "gas_asset",
  "expected_event",
];
for (const f of requiredFields) {
  if (!(f in plan)) {
    errors.push(`missing_${f}`);
  }
}

// Stop further checks if required fields are missing
if (errors.length === 0) {
  // 2. Network must be "base"
  if (plan.network !== "base") {
    errors.push("invalid_network");
  }

  // 3. Token must be USDC (identified by symbol or address)
  const asset = plan.asset || {};
  if (asset.symbol !== "USDC" && asset.address?.toLowerCase() !== "0xa0b86991c6218b36c1d19d4a2e9eb0cE3606eb48".toLowerCase()) {
    errors.push("invalid_token");
  }

  // 4. Validate wallet address
  if (!isValidAddress(plan.wallet)) {
    errors.push("invalid_wallet_address");
  }

  // 5. Validate target contract address
  if (!isValidAddress(plan.target_contract)) {
    errors.push("invalid_target_contract_address");
  }

  // 6. Validate asset amount (must be a non‑negative integer string or number)
  const amountBase = asset.amount_base_units;
  if (amountBase === undefined || amountBase === null) {
    errors.push("missing_amount_base_units");
  } else {
    const amountStr = String(amountBase);
    if (!/^[0-9]+$/.test(amountStr)) {
      errors.push("invalid_amount_base_units");
    } else if (BigInt(amountStr) <= 0n) {
      errors.push("non_positive_amount");
    }
  }

  // 7. Allowance must be an exact numeric string matching the amount (no unlimited allowances)
  const allowance = plan.allowance;
  if (allowance === "unlimited" || allowance === "max" || allowance === "*" || allowance === null) {
    errors.push("unlimited_allowance");
  } else {
    const allowanceStr = String(allowance);
    if (!/^[0-9]+$/.test(allowanceStr)) {
      errors.push("invalid_allowance");
    } else if (amountBase !== undefined && allowanceStr !== String(amountBase)) {
      errors.push("allowance_mismatch");
    }
  }

  // 8. Expected event must be the canonical Transfer event for USDC
  if (plan.expected_event !== "Transfer") {
    errors.push("unexpected_event");
  }

  // 9. Detect any secret‑like fields recursively
  if (containsSecretKey(plan)) {
    errors.push("secret_field_present");
  }
}

if (errors.length > 0) {
  respond({ ready: false, errors }, 1);
}

// ---------------------------------------------------------------------------
// Build deterministic confirmation card
// ---------------------------------------------------------------------------
const normalizedWallet = normalizeAddress(plan.wallet);
const normalizedTarget = normalizeAddress(plan.target_contract);
const humanAmount = formatUsdc(plan.asset.amount_base_units);

const card = {
  ready: true,
  network: plan.network,
  wallet: normalizedWallet,
  action: plan.action,
  target_contract: normalizedTarget,
  amount: `${humanAmount} USDC`,
  allowance: String(plan.allowance),
  gas_asset: plan.gas_asset,
  expected_event: plan.expected_event,
  warnings: [],
};

respond(card, 0);
