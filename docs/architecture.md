# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: keep React pages and components responsible for interaction and rendering; route relative `/api` reads and writes through the shared client and Vite proxy, adding a JSON POST helper for creates. Show accessible loading, success, empty, and error states. The frontend does not access MongoDB directly.
- Logic tier decision: keep Express route handlers thin and delegate validation and business behavior to TypeScript services. Validate request fields and object IDs, verify referenced records before writes, and return deliberate 4xx responses rather than exposing cast or validation failures as 500s.
- Data tier decision: keep persistence in Mongoose schemas and models. Require the fields in the API contract, model user/team relationships with ObjectId references, default team members to an empty array, and preserve the seed script's stable, non-destructive upserts and membership reconciliation.
- Activity tracking approach: accept `userId`, `teamId`, `type`, and positive `minutes`; validate both IDs and confirm the user and team exist. Award one point per minute, consistent with the seeded examples, and set `occurredAt` when the service creates the activity.
- Team management approach: require a non-empty `name` and `mascot`, validate member IDs against existing users, and persist the submitted values and member references. A team without a name returns `400`.
- Leaderboard approach: sum stored activity points for each team, include teams with no activity at zero points, sort totals descending, and assign sequential 1-based ranks.
- Workout suggestions approach: find the user by email, prefer a workout matching their fitness goal, and use recent activity focus when no goal-matched workout is available. Include a reason with each suggestion and return a deliberate 4xx for an unknown email.

## Test plan

The starter's contract tests are intentionally red until the learner implements the capabilities. Run them as implementation progresses; do not change protected tests, grader contracts, or package scripts to make them pass.

- `npm run test:data --prefix octofit-tracker/backend` — checks required model fields, references, defaults, and repeatable non-destructive seeding. Failures point to incomplete schema validation or seed behavior.
- `npm run test:api --prefix octofit-tracker/backend` — checks activity and team validation/persistence, computed activity fields, leaderboard aggregation/ranks, and user-specific suggestions. Failures point to an API contract or service-layer behavior gap; malformed or missing references must produce a deliberate 4xx, not a cast-error 500.
- `npm test --prefix octofit-tracker/frontend` — checks API-backed rendering, workout suggestion requests, and accessible loading, empty, and error states. Failures point to an API integration, display, or accessibility gap.
- `npm run build --prefix octofit-tracker/backend` — checks backend TypeScript; failures indicate compile or type errors.
- `npm run build --prefix octofit-tracker/frontend` — checks frontend TypeScript and the Vite production bundle; failures indicate compile, type, or bundling errors.
- `node .github/scripts/grade-step.mjs step1-architecture` — verifies this document has all seven completed decisions and the required test commands.
- `node .github/scripts/validate-exercise.mjs` — maintainer check for the exercise scaffold, workflow/configuration rules, protected contracts, private port setup, and documentation placeholders.
- `node --test tests/exercise-validation.test.mjs` — verifies the maintainer validator's own checks. Run these maintainer checks when changing exercise content or preparing publication, as described in `docs/exercise-validation.md`.
