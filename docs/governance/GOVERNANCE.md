# Governance

This document defines **process rules** for maintaining architectural consistency.

**Single Responsibility**: Change management, review process, and exception handling.

**See Also:**

- [../reference/MODULES.md](../reference/MODULES.md) - Module structure and import rules
- [../reference/TEST_SELECTORS.md](../reference/TEST_SELECTORS.md) - Testing selector convention
- [ENFORCEMENT.md](ENFORCEMENT.md) - Tooling and automation
- [DECISIONS.md](DECISIONS.md) - Architectural decision records

---

## Purpose

Governance exists to:

- Prevent structural drift
- Keep the boilerplate reusable
- Make changes deliberate and reviewable

These rules apply to the boilerplate and projects cloned from it (unless explicitly overridden).

---

## Non-Negotiable Constraints

Violating these changes the architecture and must be treated as a conscious decision.

**For detailed technical rules, see [../reference/MODULES.md](../reference/MODULES.md#module-import-rules)**

### Summary

1. **Routing** - Single explicit route manifest (`app/routes.ts`)
2. **Module Isolation** - Zero cross-module imports
3. **Shared Code** - Justified and domain-agnostic only
4. **Platform Separation** - Infrastructure only, no business logic

---

## Review Checklist

Apply during code review for any structural change.

### Routing

- [ ] Route added to single route manifest (`app/routes.ts`)
- [ ] Route mapped explicitly to a module file
- [ ] Layout nesting is intentional and correct
- [ ] No filesystem-based route discovery introduced

### Modules

- [ ] Feature logic lives inside appropriate module
- [ ] Module ownership is clear
- [ ] **No cross-module imports** (check imports carefully)
- [ ] Module can be deleted without widespread breakage

### Shared Code

- [ ] Component is domain-agnostic OR used in layout globally
- [ ] Component doesn't belong in a specific module
- [ ] No Storefront API calls or business logic
- [ ] Used in 2+ modules OR layout (justify promotion)

### Platform

- [ ] Code is infrastructure only (Request/Response/session/i18n)
- [ ] No feature-specific data shaping
- [ ] No imports from `app/modules/*`

### Structure

- [ ] New folders introduced only to reduce friction
- [ ] No premature organization (start flat)
- [ ] No dumping ground folders created (`app/lib`, `app/common`, etc.)
- [ ] CSS colocated with components (no `styles/` subfolders)

### Code Quality

- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Smoke tests pass (`npm run test:smoke`)
- [ ] All CI checks green (`npm run ci`)

### Testing

- [ ] Interactive elements have `data-testid` attributes
- [ ] Test selectors follow naming convention (kebab-case, domain-prefixed)
- [ ] No class-based or text-based selectors in tests
- [ ] See [../reference/TEST_SELECTORS.md](../reference/TEST_SELECTORS.md) for details

---

## Boilerplate vs Project-Specific Changes

Not all changes belong in the boilerplate.

### ✅ Appropriate for Boilerplate

- Structural improvements benefiting most projects
- Clear simplifications or removals
- Better defaults for routing or layout
- Documentation clarifications

### ❌ Keep in Downstream Projects

- Brand-specific UI decisions
- Project-specific routes or features
- One-off integrations
- Experimental patterns not yet validated

**When in doubt:** Keep the change in your project clone, not the boilerplate.

---

## Decision Records (ADR)

Architectural decisions that change constraints should be recorded.

### When to Create ADR

- Changing routing strategy
- Introducing new global folder
- Relaxing module boundary rules
- Adding new category of shared code

### ADR Format

Each ADR documents:

- **Context** - Why this decision is needed
- **Decision** - What was decided
- **Consequences** - Impact and trade-offs

**Location:** Recorded in [DECISIONS.md](DECISIONS.md)

**Immutability:** ADRs are immutable once accepted. New decisions supersede old ones.

---

## Handling Exceptions

Exceptions are allowed but must be **explicit and rare**.

### Exception Guidelines

- **Document the reason** - Why is this exception necessary?
- **Keep it local** - Don't repeat across modules
- **Track with TODO** - Link to issue/ticket
- **Plan removal** - Exceptions should be temporary

### Example

```typescript
// eslint-disable-next-line no-restricted-imports
// TODO: Remove once ProductCard is promoted to shared components
// Tracked in: https://github.com/org/repo/issues/123
import {ProductCard} from '@modules/products/components/ProductCard';
```

### When Exceptions Become Common

If an exception is repeated 2+ times:

- The rule should be revisited
- The code should be refactored
- A new shared abstraction may be needed

**Don't accumulate exceptions** - they indicate architectural drift.

---

## Architecture Evolution

This architecture is expected to evolve.

### Evolution Principles

- **Reduce complexity**, don't increase it
- **New abstractions must earn their place**
- **Structure remains explainable** to new contributors
- **Changes are incremental and reversible**

### Major Structural Changes

Before making major changes:

1. Document the rationale (ADR)
2. Review with team
3. Implement incrementally
4. Ensure reversibility
5. Update documentation

---

## Summary

**Governance maintains consistency as the codebase grows.**

**Key artifacts:**

- This file - Process and review rules
- [MODULES.md](../reference/MODULES.md) - Module structure and import rules
- [ENFORCEMENT.md](ENFORCEMENT.md) - Automation and tooling
- [DECISIONS.md](DECISIONS.md) - Architectural decisions

**The goal:** Clarity, ownership, and long-term maintainability - not control.
