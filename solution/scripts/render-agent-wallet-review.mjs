#!/usr/bin/env node

/**
 * Dependency-free, read-only CLI for reviewing Base agent-wallet transactions.
 * Usage: node solution/scripts/render-agent-wallet-review.mjs <plan.json>
 */

const fs = require('fs');

const BASE_CHAIN_ID = 8453;
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const CLAIM_EVENT = 'BountyClaimed';
const FUND_EVENT = 'BountyFunded';

const EXIT_CODES = {
  MISSING_FILE: 1,
  INVALID_JSON: 2,
  WRONG_NETWORK: 3,
  WRONG_TOKEN: 4,
  INVALID_ADDRESS: 5,
  INVALID_AMOUNT: 6,
  INVALID_ALLOWANCE: 7,
  UNEXPECTED_EVENT: 8,
  SECRET_FIELD: 9,
  INVALID_ACTION: 10
};

const SECRET_PATTERNS = [
  'key', 'secret', 'password', 'seed', 'mnemonic', 'private',
  'recovery', 'signature', 'auth', 'token', 'credential'
];

function exit(code, message) {
  console.error(message);
  process.exit(code);
}

function isValidAddress(addr) {
  if (typeof addr !== 'string') return false;
  if (!addr.startsWith('0x')) return false;
  if (addr.length !== 42) return false;
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

function normalizeAddress(addr) {
  return addr.toLowerCase();
}

function hasSecretFields(obj, path = '') {
  if (obj === null || obj === undefined) return null;
  
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      for (const pattern of SECRET_PATTERNS) {
        if (lowerKey.includes(pattern)) {
          return path ? `${path}.${key}` : key;
        }
      }
      const result = hasSecretFields(obj[key], path ? `${path}.${key}` : key);
      if (result) return result;
    }
  }
  
  return null;
}

function validateAndRenderPlan(plan) {
  // Check for secret fields recursively
  const secretField = hasSecretFields(plan);
  if (secretField) {
    exit(EXIT_CODES.SECRET_FIELD, `Error: Secret field detected: ${secretField}`);
  }

  // Validate required fields
  if (!plan.chainId || !plan.token || !plan.to || !plan.amount || !plan.allowance || !plan.action || !plan.expectedEvent) {
    exit(EXIT_CODES.INVALID_JSON, 'Error: Missing required fields');
  }

  // Validate chain ID
  if (plan.chainId !== BASE_CHAIN_ID) {
    exit(EXIT_CODES.WRONG_NETWORK, `Error: Wrong network. Expected chainId ${BASE_CHAIN_ID}, got ${plan.chainId}`);
  }

  // Validate token address
  const normalizedToken = normalizeAddress(plan.token);
  const normalizedBaseUsdc = normalizeAddress(BASE_USDC_ADDRESS);
  if (normalizedToken !== normalizedBaseUsdc) {
    exit(EXIT_CODES.WRONG_TOKEN, `Error: Wrong token. Expected ${BASE_USDC_ADDRESS}, got ${plan.token}`);
  }

  // Validate recipient address
  if (!isValidAddress(plan.to)) {
    exit(EXIT_CODES.INVALID_ADDRESS, `Error: Invalid recipient address: ${plan.to}`);
  }

  // Validate amount
  if (typeof plan.amount !== 'string' || !/^\d+$/.test(plan.amount)) {
    exit(EXIT_CODES.INVALID_AMOUNT, `Error: Invalid amount format: ${plan.amount}`);
  }
  const amount = BigInt(plan.amount);
  if (amount <= 0n) {
    exit(EXIT_CODES.INVALID_AMOUNT, `Error: Amount must be positive: ${plan.amount}`);
  }

  // Validate allowance matches amount exactly
  if (typeof plan.allowance !== 'string' || !/^\d+$/.test(plan.allowance)) {
    exit(EXIT_CODES.INVALID_ALLOWANCE, `Error: Invalid allowance format: ${plan.allowance}`);
  }
  const allowance = BigInt(plan.allowance);
  if (allowance !== amount) {
    exit(EXIT_CODES.INVALID_ALLOWANCE, `Error: Allowance must exactly match amount. Expected ${plan.amount}, got ${plan.allowance}`);
  }

  // Validate action
  if (plan.action !== 'claim' && plan.action !== 'fund') {
    exit(EXIT_CODES.INVALID_ACTION, `Error: Invalid action. Expected 'claim' or 'fund', got '${plan.action}'`);
  }

  // Validate expected event
  const expectedEvent = plan.action === 'claim' ? CLAIM_EVENT : FUND_EVENT;
  if (plan.expectedEvent !== expectedEvent) {
    exit(EXIT_CODES.UNEXPECTED_EVENT, `Error: Unexpected event for ${plan.action}. Expected ${expectedEvent}, got ${plan.expectedEvent}`);
  }

  // Convert amount to human-readable USDC (6 decimals)
  const amountNum = Number(amount) / 1_000_000;
  const humanAmount = amountNum.toFixed(2);

  // Render deterministic confirmation card
  const normalizedTo = normalizeAddress(plan.to);
  const card = [
    `Action: ${plan.action}`,
    `To: ${normalizedTo}`,
    `Amount: ${humanAmount} USDC`,
    `Allowance: ${plan.allowance}`,
    `Gas: ETH`,
    `Event: ${plan.expectedEvent}`
  ].join(' | ');

  console.log(card);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    exit(EXIT_CODES.MISSING_FILE, 'Usage: node render-agent-wallet-review.mjs <plan.json>');
  }

  const filePath = args[0];
  
  let fileContent;
  try {
    fileContent = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    exit(EXIT_CODES.MISSING_FILE, `Error: Cannot read file: ${filePath}`);
  }

  let plan;
  try {
    plan = JSON.parse(fileContent);
  } catch (err) {
    exit(EXIT_CODES.INVALID_JSON, `Error: Invalid JSON in ${filePath}`);
  }

  validateAndRenderPlan(plan);
}

main();
