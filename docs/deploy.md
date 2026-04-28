# Deploy

> **Doctrine.** The agent prepares and validates. CI deploys. See [`AGENTS.md` §0](../AGENTS.md). Never run `shopify hydrogen deploy` directly from your machine or from an agent session.

> **Note for the upstream starter.** This workflow is a template intended to run in **forked stores**. The upstream `commerce-atoms/hydrogen-storefront-starter` repository has no real Oxygen storefront, so the deploy job short-circuits via a repository guard (`if: github.repository != 'commerce-atoms/hydrogen-storefront-starter'`). Forks evaluate the guard to `false` and run the job normally — provided the secrets below are set. No edit needed in your fork.

## Pipeline

`.github/workflows/deploy.yml` triggers on:

- `push` to `main` — continuous deployment.
- `push` of a tag matching `v*` — explicit release.
- `workflow_dispatch` — manual rerun (no normal use case).

The pipeline runs:

1. Install (`npm ci`)
2. Codegen (`npm run codegen`)
3. TypeScript (`npm run typecheck`)
4. Lint (`npm run lint`)
5. Tests (`npm run test:smoke`)
6. **Architecture validation** (`npx @commerce-atoms/agents validate-architecture`) — fails the build on any boundary violation.
7. Build (`npm run build`)
8. Deploy to Oxygen (`shopify/hydrogen/actions/deploy@stable`).

Any failure halts the deploy. The build never reaches Oxygen if validation fails.

## Required secrets

Configure once via `/deploy-setup` (agents-side slash command) or by hand:

| Secret | Where to find it |
|---|---|
| `OXYGEN_DEPLOYMENT_TOKEN` | Shopify Admin → Hydrogen → Storefront → Settings → Deployment tokens. Required. |
| `SHOPIFY_STOREFRONT_ID` | Hydrogen storefront ID (URL slug in Shopify Admin). |
| `SHOPIFY_STOREFRONT_API_TOKEN` | Storefront API access token. |
| `PUBLIC_STOREFRONT_API_VERSION` | Pinned Storefront API version (e.g. `2026-04`). |
| `PUBLIC_STORE_DOMAIN` | Public-facing store domain. |
| `PUBLIC_CHECKOUT_DOMAIN` | Domain that hosts checkout. Often equal to `PUBLIC_STORE_DOMAIN`. |

`PUBLIC_*` values are baked into the build artefact. They are NOT secrets in the cryptographic sense, but they are configured the same way for parity with private values.

Set them with `gh`:

```bash
gh secret set OXYGEN_DEPLOYMENT_TOKEN     --body "<value>"
gh secret set SHOPIFY_STOREFRONT_ID       --body "<value>"
gh secret set SHOPIFY_STOREFRONT_API_TOKEN --body "<value>"
gh secret set PUBLIC_STOREFRONT_API_VERSION --body "<value>"
gh secret set PUBLIC_STORE_DOMAIN          --body "<value>"
gh secret set PUBLIC_CHECKOUT_DOMAIN       --body "<value>"
```

Mirror the same keys in `.env.example` so local development uses them too. `.env` is gitignored.

## Local pre-flight

Before pushing, reproduce the CI gates locally:

```bash
# slash command (preferred)
/deploy-check

# or by hand
npm run codegen
npm run typecheck
npm run lint
npm run test:smoke
npx @commerce-atoms/agents validate-architecture
npm run build
```

If anything fails locally, fix it locally — do not push and rely on CI to catch it.

## Releasing

```bash
# slash command (preferred)
/release minor

# or by hand
# (after /deploy-check has passed)
npm version minor
git push origin main --follow-tags
```

The tag triggers `deploy.yml` with `environment_branch=production`; pushes to `main` without a tag deploy as `main`.

## What the agent NEVER does

- Run `shopify hydrogen deploy`.
- Push directly to Oxygen.
- Bypass `validate-architecture`.
- Skip CI by force-pushing tags.

If any of these comes up in chat, the agent should refuse and surface this document.

## Failure modes

| Failure | Where | Remedy |
|---|---|---|
| `validate-architecture` fails | Step 6 | Resolve boundary violations per the cross-module reuse ladder (`AGENTS.md §4`). Push again. |
| `deploy.yml` doesn't trigger on tag | GitHub Actions tab | Verify the workflow is enabled (`gh workflow list`); rerun `/deploy-setup`. |
| Oxygen returns auth error | Deploy step | `OXYGEN_DEPLOYMENT_TOKEN` is rotated or wrong. Refetch from Shopify Admin and re-set. |
| Build env vars missing | Build step | One of the `PUBLIC_*` secrets is unset. Re-run `gh secret list` and fix. |
| Concurrent deploys | Multiple jobs queued | The `concurrency` block cancels in-progress runs on the same ref; expected behaviour. |

## See also

- [`AGENTS.md` §0](../AGENTS.md) — the doctrine.
- [`commands/deploy-setup.md`](https://github.com/commerce-atoms/agents/blob/main/commands/deploy-setup.md) (in `@commerce-atoms/agents`) — slash command that wires CI + secrets.
- [`commands/deploy-check.md`](https://github.com/commerce-atoms/agents/blob/main/commands/deploy-check.md) — slash command that runs the local pre-flight.
- [`commands/release.md`](https://github.com/commerce-atoms/agents/blob/main/commands/release.md) — slash command that tags + pushes.
