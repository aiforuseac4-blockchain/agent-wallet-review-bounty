import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const benchmarkRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = process.argv[2] ?? "/workspace";
const candidate = join(workspaceRoot, "scripts", "render-agent-wallet-review.mjs");
const fixtures = join(benchmarkRoot, "fixtures");

function fail(message) {
  process.stderr.write(`FAIL: ${message}\n`);
  process.exit(1);
}

function run(args) {
  return spawnSync(process.execPath, [candidate, ...args], {
    encoding: "utf8",
    timeout: 5_000,
    env: { PATH: process.env.PATH ?? "" },
  });
}

function expectCase(name, args, expectedStatus, expectedStdout) {
  const result = run(args);
  if (result.error) fail(`${name}: ${result.error.message}`);
  if (result.status !== expectedStatus) {
    fail(`${name}: exit ${result.status}, expected ${expectedStatus}`);
  }
  if (result.signal !== null) fail(`${name}: unexpected signal ${result.signal}`);
  if (result.stderr !== "") fail(`${name}: stderr must be empty`);
  if (result.stdout !== expectedStdout) fail(`${name}: stdout mismatch`);
  if (!result.stdout.endsWith("\n") || result.stdout.slice(0, -1).includes("\n")) {
    fail(`${name}: output must be exactly one line`);
  }
  return result.stdout;
}

const validClaim = `${JSON.stringify({
  ready: true,
  network: "Base (8453)",
  wallet: "0xa111111111111111111111111111111111111111",
  action: "claim",
  target_contract: "0xb222222222222222222222222222222222222222",
  asset: {
    symbol: "USDC",
    token: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    amount: "0.01 USDC",
    amount_base_units: "10000",
  },
  allowance: {
    spender: "0xb222222222222222222222222222222222222222",
    amount_base_units: "10000",
    scope: "exact",
  },
  gas_asset: "ETH",
  expected_event: "BountyClaimed",
  warnings: [],
})}\n`;

const validFund = `${JSON.stringify({
  ready: true,
  network: "Base (8453)",
  wallet: "0xa111111111111111111111111111111111111111",
  action: "fund",
  target_contract: "0xc333333333333333333333333333333333333333",
  asset: {
    symbol: "USDC",
    token: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    amount: "1 USDC",
    amount_base_units: "1000000",
  },
  allowance: {
    spender: "0xc333333333333333333333333333333333333333",
    amount_base_units: "1000000",
    scope: "exact",
  },
  gas_asset: "ETH",
  expected_event: "FundingAdded",
  warnings: [],
})}\n`;

const rejected = (errors) => `${JSON.stringify({ ready: false, errors })}\n`;

const claimOutput = expectCase(
  "valid claim",
  [join(fixtures, "valid-claim.json")],
  0,
  validClaim,
);
expectCase("valid fund", [join(fixtures, "valid-fund.json")], 0, validFund);
expectCase(
  "wrong chain",
  [join(fixtures, "wrong-chain.json")],
  1,
  rejected(["wrong_network", "wrong_chain_id"]),
);
expectCase(
  "wrong token",
  [join(fixtures, "wrong-token.json")],
  1,
  rejected(["wrong_asset_token"]),
);
expectCase(
  "unsafe allowance",
  [join(fixtures, "unsafe-allowance.json")],
  1,
  rejected(["allowance_spender_mismatch", "allowance_not_exact"]),
);
expectCase(
  "invalid values",
  [join(fixtures, "invalid-values.json")],
  1,
  rejected([
    "invalid_wallet",
    "invalid_target_contract",
    "invalid_amount",
    "allowance_spender_mismatch",
  ]),
);
expectCase(
  "invalid action",
  [join(fixtures, "invalid-action.json")],
  1,
  rejected(["invalid_action", "unexpected_event"]),
);
expectCase(
  "secret field",
  [join(fixtures, "secret-field.json")],
  1,
  rejected(["secret_field_forbidden"]),
);
expectCase("usage", [], 2, rejected(["usage"]));
expectCase("unreadable", [join(fixtures, "missing.json")], 2, rejected(["input_unreadable"]));
expectCase("malformed", [join(fixtures, "malformed.json")], 2, rejected(["invalid_json"]));
expectCase("non-object", [join(fixtures, "non-object.json")], 2, rejected(["root_not_object"]));

const repeatedClaim = expectCase(
  "deterministic repeat",
  [join(fixtures, "valid-claim.json")],
  0,
  validClaim,
);
if (claimOutput !== repeatedClaim) fail("repeated output is not byte-identical");

process.stdout.write("PASS\n");
