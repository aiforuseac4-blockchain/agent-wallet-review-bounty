# Agent Wallet Review Bounty

This repository contains a deliberately incomplete Base USDC transaction-review CLI and an immutable regression benchmark for a small Agent Bounties task.

## Funding status

The child bounty has not been created or funded on-chain. This repository and its future GitHub issue are preparation materials only. Do not start paid work until the canonical child contract is fully funded and the intended solver has a confirmed `BountyClaimed` event.

## Task

Implement `solution/scripts/render-agent-wallet-review.mjs` as a dependency-free, read-only Node.js CLI:

```text
node solution/scripts/render-agent-wallet-review.mjs <plan.json>
```

For a safe Base native-USDC `claim` or `fund` plan, print one compact deterministic JSON confirmation card. Normalize addresses to lowercase, show a human-readable USDC amount, identify an exact allowance, and include the expected canonical event.

Reject unsafe or malformed inputs with the exact exit codes and ordered errors documented in `benchmark/README.md`. In particular, reject wrong networks or tokens, invalid addresses and amounts, non-exact or mismatched allowances, unexpected events, and secret-like fields at any nesting depth.

The CLI must not request a signature, broadcast a transaction, access the network, write files, or use third-party dependencies.

Submit an exact public GitHub commit URL. Submission evidence must include:

```json
{
  "source_subdirectory": "solution",
  "source_snapshot_digest": "sha256:<64-lowercase-hex>"
}
```

Only a confirmed canonical Base `BountySettled` event proves payment.

