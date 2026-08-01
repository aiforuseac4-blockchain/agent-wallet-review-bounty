import { readFileSync } from "node:fs";

const inputPath = process.argv[2];

if (!inputPath) {
  process.stdout.write(`${JSON.stringify({ ready: false, errors: ["usage"] })}\n`);
  process.exit(2);
}

const plan = JSON.parse(readFileSync(inputPath, "utf8"));

// Deliberately incomplete starter: it renders unvalidated fields, exposes raw
// base units, and does not reject dangerous allowance or secret-bearing input.
const card = {
  ready: true,
  network: plan.network,
  wallet: plan.wallet,
  action: plan.action,
  target_contract: plan.target_contract,
  amount: `${plan.asset?.amount_base_units ?? "0"} USDC base units`,
  allowance: plan.allowance,
  gas_asset: plan.gas_asset,
  expected_event: plan.expected_event,
  warnings: [],
};

process.stdout.write(`${JSON.stringify(card)}\n`);
