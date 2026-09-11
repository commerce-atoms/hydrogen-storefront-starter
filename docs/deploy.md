# Deploy

> **Doctrine.** The agent prepares and validates. CI deploys. See [`AGENTS.md` §0](./AGENTS.md). Never run `shopify hydrogen deploy` directly from your machine or from an agent session.

The starter does **not** ship a deploy workflow. When a Hydrogen storefront is linked to the repo in Shopify Admin, Shopify's GitHub App auto-provisions `.github/workflows/oxygen-deployment-<storefrontId>.yml` and sets a rotation-safe `OXYGEN_DEPLOYMENT_TOKEN_<storefrontId>` secret. This Shopify-provisioned workflow is the authoritative deployer.

Previously the starter shipped its own `deploy.yml`. Deleted in [agents 0.3.4](https://github.com/commerce-atoms/agents/blob/main/CHANGELOG.md#034--2026-09-11) because it duplicated Shopify's workflow on every `push:main` (two deploys, race, wasted CI).

## Pipeline

Two workflows split the responsibility:

### `.github/workflows/ci.yml`. Validation gate

Runs on every PR + `push:main`. Blocks merge via branch protection. The pipeline is:

1. Install (`npm ci`)
2. Lint (`npm run lint`)
3. Codegen (`npm run codegen`)
4. Type check (`npm run typecheck`)
5. Tests (`npm run test:smoke`)
6. **Architecture validation** (`npx --yes @commerce-atoms/agents validate-architecture`). Fails the build on any boundary violation.

### `.github/workflows/oxygen-deployment-<storefrontId>.yml`. Deployer

Shopify-provisioned; the starter does not maintain it. Trigger: `on: [push]` (any branch).

- Push to `main` → deploys to **production**.
- Push to any other branch → deploys to a **preview URL** at `{hash}.myshopify.dev`.

Steps: `npm ci` → `npx shopify hydrogen deploy`. No pre-deploy validation of its own. The safety net is `ci.yml` + branch protection on `main`.

## Setup

Run `/deploy-setup` (or follow [`commands/deploy-setup.md`](https://github.com/commerce-atoms/agents/blob/main/kit/commands/deploy-setup.md) manually). The flow is:

1. Create (or link) a Hydrogen storefront in Shopify Admin → **Hydrogen**.
2. Shopify opens a PR titled `Set up Oxygen deployment workflow file`. Review + merge.
3. `OXYGEN_DEPLOYMENT_TOKEN_<storefrontId>` is set automatically as a repository secret.
4. Push runtime env to Oxygen: `npx shopify hydrogen env push --env production`.
5. Verify branch protection on `main` requires `ci`:

   ```bash
   gh api "repos/:owner/:repo/branches/main/protection" --jq '.required_status_checks.contexts'
   ```

## Runtime env

Runtime env for the Hydrogen worker (`PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_ID`, storefront tokens, `SESSION_SECRET`, etc.) is injected by **Oxygen at request time**, not baked into the build. Manage it in Shopify Admin → **Hydrogen** → **Storefront** → **Environments and variables**, or push it from a local `.env` file:

```bash
# One-off: mirror local .env to Oxygen production env
npx shopify hydrogen env push --env production
```

`.env` is gitignored; `.env.example` documents every key. Do **not** put runtime env in GitHub Actions secrets. Shopify's deploy step doesn't rebuild with them.

## Secrets

The Oxygen deployer needs exactly one GitHub Actions secret:

| Secret | Auto-set by | Purpose |
|---|---|---|
| `OXYGEN_DEPLOYMENT_TOKEN_<storefrontId>` | Shopify's auto-PR | Authenticates the `shopify hydrogen deploy` step |

No `SHOPIFY_STOREFRONT_API_TOKEN`, no `PUBLIC_*` env vars in secrets. Those live in Oxygen storefront settings.

## Local pre-flight

Before pushing, reproduce the CI validation gates locally:

```bash
# slash command (preferred)
/deploy-check

# or by hand
npm run codegen
npm run typecheck
npm run lint
npm run test:smoke
npx --yes @commerce-atoms/agents validate-architecture
npm run build
```

If anything fails locally, fix it locally. Do not push and rely on CI to catch it.

## Releasing

```bash
# slash command (preferred)
/release minor

# or by hand
# (after /deploy-check has passed)
npm version minor
git push origin main --follow-tags
```

The tag triggers a `push` event on the Shopify-provisioned workflow, which deploys to production. Non-tag pushes to `main` also deploy to production.

## What the agent NEVER does

- Run `shopify hydrogen deploy`.
- Hand-author or replace the Shopify auto-provisioned workflow.
- Push directly to Oxygen.
- Bypass `validate-architecture`.
- Skip CI by force-pushing tags.

If any of these comes up in chat, the agent should refuse and surface this document.

## Failure modes

| Failure | Where | Remedy |
|---|---|---|
| `validate-architecture` fails | `ci.yml` | Resolve boundary violations per the cross-module reuse ladder (`AGENTS.md §4`). Push again. |
| Two deploys per push | Both workflows | Legacy `deploy.yml` still present alongside Shopify's workflow. Delete `deploy.yml` (agents 0.3.4+ removed it from the starter). |
| Auto-provisioned workflow missing | Shopify Admin | Hydrogen storefront not linked to the repo. Link it in Shopify Admin. The auto-PR arrives shortly after. |
| Oxygen returns auth error | Deploy step | `OXYGEN_DEPLOYMENT_TOKEN_<storefrontId>` was rotated. Re-generate in Shopify Admin and update the repository secret. |
| Runtime env missing at runtime | Any route | Env not pushed to Oxygen. Set via Shopify Admin or `shopify hydrogen env push`. |
| Preview URL doesn't render | Deploy step | Per-branch env not configured. Set preview env vars in Shopify Admin, or accept the production env for previews. |

## See also

- [`AGENTS.md` §0](./AGENTS.md). The doctrine.
- [`commands/deploy-setup.md`](https://github.com/commerce-atoms/agents/blob/main/kit/commands/deploy-setup.md) (`@commerce-atoms/agents`). The slash command.
- [`commands/deploy-check.md`](https://github.com/commerce-atoms/agents/blob/main/kit/commands/deploy-check.md). Local pre-flight.
- [`commands/release.md`](https://github.com/commerce-atoms/agents/blob/main/kit/commands/release.md). Tag + push.
- [Shopify. Continuous deployment with Hydrogen and Oxygen](https://shopify.dev/docs/custom-storefronts/hydrogen/deployments).
