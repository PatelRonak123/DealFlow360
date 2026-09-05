# Contributing to DealFlow360

Welcome to the DealFlow360 engineering team! To maintain code quality, prevent regressions, and enable dozens of developers to work on independent domain modules in parallel, please follow these conventions.

---

## 1. Branch Naming Conventions

All branches must adhere to the following naming pattern:

```text
<type>/<module-name>[-<short-description>]
```

### Allowed Types
- `feature/` : New feature, endpoint, or UI component
- `fix/`     : Bug fix or hotfix
- `refactor/`: Code restructuring without functional changes
- `test/`    : Adding or updating test suites
- `docs/`    : Documentation updates
- `chore/`   : Dependency updates, CI/CD, or build changes

### Examples
```text
feature/quotations
feature/quotations-pdf-generator
feature/discount-governance-margin-rules
fix/inventory-reservation-race-condition
refactor/auth-session-handling
chore/upgrade-drizzle-orm
```

---

## 2. Commit Message Conventions

We use standard Conventional Commits:

```text
<type>(<scope>): <subject>
```

### Examples
- `feat(quotations): add quote line item discount validator`
- `fix(approvals): correct multi-tier escalation threshold`
- `refactor(billing): extract invoice calculation service`
- `test(inventory): add unit tests for stock reservation lock`
- `docs(api): update rate limiting documentation`
- `chore(deps): update vite to latest stable`

---

## 3. Module Ownership & Encapsulation Rules

Our architecture is split into 20 distinct domain modules:

```text
Developer Team A ──► Authentication / Users
Developer Team B ──► Products / Customers / Pricing
Developer Team C ──► Quotations / Discount Governance / Approvals
Developer Team D ──► Inventory / Warehouses / Fulfillment
Developer Team E ──► Subscriptions / Billing / Payments
Developer Team F ──► Customer Portal / Deal Health / Reports
```

### Key Principles
1. **Work within your assigned module**: Avoid modifying files in other modules unless coordinating an architectural change.
2. **Expose only public interfaces**: Modules interact through the module root `index.ts`. Do not import internal controllers or internal repositories from another module.
3. **Shared code belongs in `common/` or `components/common/`**: If functionality is needed across multiple modules, elevate it to common utilities or shared components through team consensus.

---

## 4. Pull Request & Review Workflow

1. **Create a feature branch** from `main` (or `develop`).
2. **Implement changes** cleanly within your module.
3. **Run local validation checks**:
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   npm run build
   ```
4. **Create a Pull Request** with a descriptive summary of changes, motivation, and verification steps.
5. **Code Review**: At least one peer review approval is required before merging.
6. **Continuous Integration**: Ensure all CI status checks (typecheck, lint, test) pass.
7. **Squash and Merge** into the base branch.
