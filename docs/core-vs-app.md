# Core vs. app — what stays in sync, what's yours

> The starter is the canonical fork point for new stores. Per [ADR 003](https://github.com/commerce-atoms/agents/blob/main/docs/decisions/) of `@commerce-atoms/agents` and `rules/stores.md`, the starter is divided into a synced **core** (modify upstream, never in your fork) and a per-store **app** (modify freely).

## The split

| Layer | Path | Sync behaviour |
|---|---|---|
| **Core** | `app/platform/*`, `app/routes.ts`, `tsconfig.json`, `eslint.config.js`, `package.json` engines, the `*.route.tsx` / `*.view.tsx` contract, the `.cursor/rules/*.mdc` overlays, `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` | Synced from upstream. **Modify upstream**, never in the fork. |
| **App** | `app/modules/*` body, `app/styles/*`, `app/assets/*`, `app/config/*`, `app/components/*` (consumer-extended), this `docs/` folder | Per-store. Modify freely in the fork. |

## Why split?

- **Core is invariant.** Architecture rules, route mechanics, platform integration, the `*.route.tsx` / `*.view.tsx` contract — these must not drift between stores, otherwise the AI-consistency promise breaks.
- **App is variant.** Branding, business modules, store-specific extensions, fork-only experiments — these are why the fork exists at all.

## How a fork stays in sync

1. **Pin the agents version** in `agents.config.json`:

   ```json
   {"agentsVersion": "0.1.0", "audience": "store-fork"}
   ```

2. **Sync core artefacts** any time you bump the pin:

   ```bash
   npm i -D @commerce-atoms/agents@<new-version>
   npx @commerce-atoms/agents sync
   ```

   This updates `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, and `.cursor/rules/*.mdc` — the documents AI tools read.

3. **Pull starter core** by rebasing or by cherry-picking specific files. A future smoke test will compare hashes of core files in your fork against the version pinned by `agents.config.json` and fail CI on divergence.

## Marker convention

Core files MAY carry a top-comment marker:

```ts
// SYNCED FROM @commerce-atoms/hydrogen-storefront-starter — modify upstream
```

Today the marker is documentation only. Once the hash-based smoke test ships, the marker becomes load-bearing; until then it serves as a cue to humans (and future AI runs) about which files belong to core.

## What if I need to modify a core file?

Three options, in order of preference:

1. **Push the change upstream.** Open a PR against `commerce-atoms/hydrogen-storefront-starter`. Once it merges and the next agents version pins, your fork inherits it via sync.

2. **Stage it in the fork temporarily.** If you cannot wait for upstream, modify the core file in your fork. Add a fork-only ADR under `docs/decisions/fork-001-…md` capturing the rationale, expected upstream PR, and removal trigger.

3. **Move the concern out of core.** Sometimes "I need to modify a core file" is a sign that the concern belongs in app, not core. Review the layered list above before doubling down on (2).

## See also

- [`AGENTS.md`](../AGENTS.md) §3 — non-negotiable architecture.
- [`rules/stores.md`](https://github.com/commerce-atoms/agents/blob/main/rules/stores.md) in `@commerce-atoms/agents` — the canonical source for these rules.
- `docs/deploy.md` — sibling document for the deploy contract (lands in PR S2).
