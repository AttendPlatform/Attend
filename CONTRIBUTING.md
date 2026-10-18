# Attend Engineering Contribution Guide

Welcome to the Attend engineering team. This guide outlines our development workflow, daily cadence, branch management strategy, and pull request standards. 

All development follows the accelerated roadmap specified in [docs/v1_implementation_plan.md](docs/v1_implementation_plan.md).

---

## 1. Team Roles & Operating Cadence

### Team Structure
- **Sanaullah**: Tech Lead & Project Supervisor
  - Owns architectural design, Supabase database schemas, and RLS security policies.
  - Reviews and merges all daily pull requests from engineering.
  - Runs automated verification test suites and coordinates production releases.
- **Uzair**: Software Engineer
  - Specializes in UI primitives, public event destination layouts, connected campaigns, and organizer dashboards.
- **Hardik**: Software Engineer
  - Specializes in attendance domain services, state machines, dynamic CTAs, discover query engines, and lifecycle notification triggers.

### The 4-Hour Daily Workflow
Engineering operates on a focused cadence of **4 hours per day, 4 days per week** (16 hours per week per contributor). 

Each day represents a complete, self-contained unit of work:
1. Every engineer branches off from the active weekly parent branch created by Sanaullah.
2. The engineer implements the day's assigned deliverables from [docs/v1_implementation_plan.md](docs/v1_implementation_plan.md).
3. The engineer tests locally, creates atomic commits, and submits a Pull Request using the project template.
4. The engineer assigns **Sanaullah** as the required reviewer.
5. **Once Sanaullah has reviewed, approved, and merged the PR into the weekly branch, the day is officially concluded.**

---

## 2. Branching Strategy & Git Protocol

```
main (Production Ready)
  ▲
  │ (Weekly Milestone PR merged by Sanaullah)
  │
feat/w3-phase2-public-event-attendance (Weekly Parent Branch set up by Sanaullah)
  ├── feat/uzair-w3-d1-avatar-stack (Daily feature branch by Uzair)
  └── feat/hardik-w3-d1-attendance-service (Daily feature branch by Hardik)
```

### Branch Hierarchy

1. **Production Branch (`main`)**:
   - Always deployable. Protected against direct commits.
   - Sanaullah merges the completed weekly parent branch into `main` at the end of each milestone.

2. **Weekly Parent Branches (Set up by Sanaullah)**:
   - Created at the start of each phase:
     - Week 1: `feat/v1-phase0-schema` [Completed]
     - Week 2: `feat/v1-phase1-location-event-creation` [Completed]
     - Week 3: `feat/w3-phase2-public-event-attendance` [Active]
     - Week 4: `feat/w4-phase3-campaigns-discover` [Scheduled]
     - Week 5: `feat/w5-phase4-organizer-saved-launch` [Scheduled]

3. **Daily Engineer Branches (Created by Uzair & Hardik)**:
   - Always cut from the current active weekly parent branch.
   - Naming convention:
     `feat/<engineer>-w<week>-d<day>-<short-description>`
   - Examples:
     - `feat/uzair-w3-d1-avatar-stack`
     - `feat/hardik-w3-d1-attendance-service`
     - `feat/uzair-w3-d2-event-card`
     - `feat/hardik-w3-d2-primary-action`

---

## 3. Daily Step-by-Step Execution Guide

### Step 1: Start the Day & Sync
At the start of your 4-hour session, sync your local environment with the latest changes in the weekly parent branch:

```bash
git checkout feat/w3-phase2-public-event-attendance
git pull origin feat/w3-phase2-public-event-attendance
```

### Step 2: Create Your Daily Branch
Create your feature branch directly from the updated weekly branch:

```bash
git checkout -b feat/uzair-w3-d1-avatar-stack
```

### Step 3: Review Specifications & Shared Types
Before writing code, check your daily objectives in [docs/v1_implementation_plan.md](docs/v1_implementation_plan.md) and review shared data contracts in `src/types/` (such as `src/types/events.ts` and `src/types/attendance.ts`).

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
git push -u origin feat/uzair-w3-d1-avatar-stack
```

Open a Pull Request on GitHub:
- **Base branch**: The active weekly branch (e.g. `feat/w3-phase2-public-event-attendance`).
- **Compare branch**: Your daily branch (e.g. `feat/uzair-w3-d1-avatar-stack`).
- **Title format**: `feat(w3-d1): implement AvatarStack and action primitives`
- **Description**: Fill out the Pull Request template completely ([.github/pull_request_template.md](.github/pull_request_template.md)).
- **Reviewer**: Assign **Sanaullah** as the required reviewer.

### Step 7: Review, Merge & Day Conclusion
- Sanaullah will review your code, verify the build, run milestone test suites, and leave feedback or merge your branch into the weekly parent branch.
- **Once Sanaullah merges your PR, your day is officially concluded.**
- Delete your local and remote feature branch after the merge to keep the repository clean.

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

## 5. Getting Help & Contact

If you encounter blockers or need clarification on API contracts during your 4-hour session:
1. Message in the team channel or sync with Sanaullah.
2. Refer to the reference specification in [docs/v1_implementation_plan.md](docs/v1_implementation_plan.md).
3. Check the relevant migration in `supabase/migrations/` for database schema details.
