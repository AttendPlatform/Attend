# Attend Engineering Contribution Guide

Welcome to the Attend engineering team. This guide outlines our development workflow, daily cadence, branch management strategy, and pull request standards. 

All development follows the accelerated roadmap specified in [docs/v1_implementation_plan.md](docs/v1_implementation_plan.md).

---

## 1. Engineering Ownership & Operating Cadence

### Ownership
- **Solo Full-Stack Engineering**:
  - Owns architectural design, Supabase database schemas, SQL RPCs, and RLS security policies.
  - Implements backend domain services, UI/UX components, and automated verification test suites (`scripts/smart-notifications/week*/verify-sn-*.ts`).
  - Runs build, typecheck, and milestone regression checks before merging weekly parent branches into `main`.

### The 4-Hour Daily Workflow
Engineering operates on a focused cadence of **4 hours per day, 4 days per week** (16 hours per week).

Each day represents a complete, self-contained unit of work:
1. Work on the active weekly parent branch cut from `main`.
2. Implement the day's 4-hour deliverables from [docs/smart_notification_implementation_plan.md](docs/smart_notification_implementation_plan.md).
3. Test locally (`npm test`, `npx tsc --noEmit`, `npm run build`), create atomic commits, and push to the weekly parent branch.
4. At the end of the week, open a Pull Request from the weekly parent branch targeting `main` using the project PR template and merge once all checks pass.

---

## 2. Branching Strategy & Git Protocol

```
main (Production Ready)
  ▲
  │ (Weekly Milestone PR)
  │
feat/w1-smart-notifications-foundation (Week 1 Parent Branch)
feat/w2-promotions-banners-admin       (Week 2 Parent Branch)
feat/w3-social-discovery-release       (Week 3 Parent Branch)
```

### Branch Hierarchy

1. **Production Branch (`main`)**:
   - Always deployable. Protected against direct commits.
   - Completed weekly parent branches are merged into `main` at the end of each milestone via PR.

2. **Weekly Parent Branches**:
   - Cut from `main` at the start of each week:
     - Smart Notifications Week 1: `feat/w1-smart-notifications-foundation`
     - Smart Notifications Week 2: `feat/w2-promotions-banners-admin`
     - Smart Notifications Week 3: `feat/w3-social-discovery-release`

3. **Optional Daily Feature Branches**:
   - If splitting a day's work into a separate branch, cut from the active weekly parent branch using:
     `feat/w<week>-d<day>-<short-description>`
     - `feat/uzair-w5-d10-people-tab`
     - `feat/hardik-w5-d10-lifecycle-notifications`

---

## 3. Daily Step-by-Step Execution Guide

### Step 1: Start the Day & Sync
At the start of your 4-hour session, sync your local environment with the latest changes in the weekly parent branch:

```bash
git checkout feat/w5-phase4-organizer-saved-launch
git pull origin feat/w5-phase4-organizer-saved-launch
```

### Step 2: Create Your Daily Branch
Create your feature branch directly from the updated weekly branch:

```bash
git checkout -b feat/uzair-w5-d9-organizer-shell
```

### Step 3: Review Specifications & Shared Types
Before writing code, check your daily objectives in [docs/v1_implementation_plan.md](docs/v1_implementation_plan.md) and review shared data contracts in `src/types/` (such as `src/types/campaigns.ts` and `src/types/discover.ts`).

### Step 4: Implement with Atomic Commits
Break your work into multiple logical, atomic commits as you progress. Follow the Conventional Commits format:
- `feat(scope): concise description` for new features
- `fix(scope): concise description` for bug fixes
- `refactor(scope): concise description` for structural refactoring
- `test(scope): concise description` for test additions

Example commits:
```bash
git commit -m "feat(ui): build AvatarStack component with privacy masking"
git commit -m "feat(ui): add SaveButton optimistic bookmark toggle"
git commit -m "test(ui): add visual test coverage for social proof stack"
```

### Step 5: Run Mandatory Verification Checks
Before opening a PR, you must verify that your code builds cleanly and introduces zero regressions:

```bash
# 1. Run automated test suites
npm test

# 2. Check for TypeScript compilation errors
npx tsc --noEmit

# 3. Verify production Next.js build
npm run build
```

#### Code Style Constraint
- **Zero em dashes (Unicode U+2014)**: Do not use the em dash character anywhere in code, JSX, comments, or documentation. Use standard hyphens (`-`), colons (`:`), or dots (`·`).

### Step 6: Push & Open a Pull Request
Push your daily branch to GitHub:

```bash
git push -u origin feat/uzair-w5-d9-organizer-shell
```

Open a Pull Request on GitHub:
- **Base branch**: The active weekly branch set up in advance by Sanaullah (e.g. `feat/w5-phase4-organizer-saved-launch`). Do NOT target `main` directly.
- **Compare branch**: The active weekly parent branch (e.g. `feat/w2-promotions-banners-admin`).
- **Title format**: `feat(w2): featured events, promotional banners & admin console`
- **Description**: Fill out the Pull Request template completely ([.github/pull_request_template.md](.github/pull_request_template.md)).

### Step 7: Review, Merge & Milestone Conclusion
- Verify all checks pass (`npm test`, `npx tsc --noEmit`, `npm run build`, and `verify:sn-*`).
- Merge the weekly parent branch into `main` and clean up stale branches.

---

## 4. Codebase Architecture & Standards

### Directory Boundaries
- `src/components/ui/`: Generic reusable UI primitives (buttons, avatars, dialogs, badges).
- `src/components/<domain>/`: Domain-specific components (`events/`, `campaigns/`, `location/`, `notifications/`).
- `src/services/`: Server Actions and Supabase domain services (`events.service.ts`, `attendance.service.ts`).
- `src/stores/`: Client-side Zustand state stores (`useAuthStore.ts`, `useNotificationsStore.ts`).
- `src/types/`: Centralized TypeScript interfaces and type definitions.
- `src/lib/`: Low-level utilities, location providers, and Supabase client factories.

### Barrel Export Convention
When adding new components, hooks, types, or services, always re-export them from their directory's `index.ts` file so other files can import them cleanly:

```typescript
// Good:
import { AvatarStack, SaveButton } from "@/components/ui";
import { EventRow, ParticipationModel } from "@/types";

// Avoid deep imports:
import { AvatarStack } from "@/components/ui/AvatarStack";
```

### V1 Architectural Guardrails
Remember the constraints defined in Section 36 of the Development Brief:
- No complex recommendation engines (use deterministic location and date ranking).
- No PostGIS spatial queries (use simple bounding box and city presets).
- No direct credit card processing gateways (use external ticket links or ticket tier displays for V1).
- No full social network graphs (use `AvatarStack` social proof only).
- Keep single start and end dates (no recurring event series engine in V1).

---

## 5. Reference Specifications

When clarifying API contracts or database schemas during a 4-hour session:
1. Refer to [docs/smart_notification_implementation_plan.md](docs/smart_notification_implementation_plan.md) for the active smart notification roadmap.
2. Refer to [docs/v1_implementation_plan.md](docs/v1_implementation_plan.md) for the V1 architectural baseline.
3. Check the relevant migration in `supabase/migrations/` for database schema details.
