# Immutable Agent Wallet Review Contract

The candidate entrypoint is:

```text
<workspace>/scripts/render-agent-wallet-review.mjs
```

It accepts exactly one JSON file path and may use only Node.js built-ins. It must not access the network, sign, broadcast, or write files.

## Valid output

Exit `0`, write nothing to stderr, and print exactly one compact JSON line with this key order:

```json
{"ready":true,"network":"Base (8453)","wallet":"0x...","action":"claim","target_contract":"0x...","asset":{"symbol":"USDC","token":"0x...","amount":"0.01 USDC","amount_base_units":"10000"},"allowance":{"spender":"0x...","amount_base_units":"10000","scope":"exact"},"gas_asset":"ETH","expected_event":"BountyClaimed","warnings":[]}
```

Trim trailing fractional zeroes when formatting six-decimal USDC, while preserving the exact base-unit string separately.

## Semantic rejection

Exit `1`, write nothing to stderr, and print `{"ready":false,"errors":[...]}` with applicable errors in this fixed order:

1. `secret_field_forbidden`
2. `wrong_network`
3. `wrong_chain_id`
4. `invalid_wallet`
5. `invalid_action`
6. `invalid_target_contract`
7. `wrong_asset_symbol`
8. `wrong_asset_token`
9. `wrong_asset_decimals`
10. `invalid_amount`
11. `allowance_spender_mismatch`
12. `allowance_not_exact`
13. `wrong_gas_asset`
14. `unexpected_event`

Valid actions are `claim` → `BountyClaimed` and `fund` → `FundingAdded`. The only token is Base native USDC `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`. All wallet, target, and spender values must be non-zero 20-byte addresses. Amounts must be positive base-10 integer strings. Allowance spender must equal the target and allowance amount must equal the action amount exactly.

Secret-like object keys are matched recursively after lowercasing and removing punctuation. The forbidden names are `privatekey`, `seedphrase`, `mnemonic`, `walletpassword`, and `recoverycode`.

## Input rejection

Exit `2`, write nothing to stderr, and print exactly one error:

- wrong argument count: `usage`
- unreadable input: `input_unreadable`
- malformed JSON: `invalid_json`
- array, null, or primitive root: `root_not_object`

