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

- Presentation tier: `App.tsx` provides React Router navigation. Capability pages use the shared API client through `useApiData` and render fetched data with accessible loading, empty, and error states. The workout page requests suggestions for the seeded Mona account.
- Logic tier: the Express API router delegates to `octofitService`; route handlers pass service errors to the app-level JSON error middleware. Validation and capability behavior remain in the service layer, with deliberate 4xx responses for invalid inputs and missing records.
- Data tier: Mongoose schemas require user identity/goals, team name/mascot, activity references/details/points/time, and workout details. Team members default to an empty array. The seed script uses stable upserts and retains unrelated records.
- Activity tracking: creation validates ObjectId syntax and referenced user/team existence, requires a non-empty type and positive minutes, awards one point per minute, and records the creation time.
- Team management: creation requires a name and mascot, validates member IDs and existence, and stores the member references. Listing returns teams with their member IDs.
- Leaderboard: aggregate stored activity points by team, include teams with no activity at zero points, sort totals descending, and assign sequential 1-based ranks.
- Workout suggestions: find the user by email; prefer a workout matching their fitness goal, or otherwise one matching their most recent activity focus. Return a reason for each suggestion and `404` for an unknown user.

## Test plan

- `npm run test:data --prefix octofit-tracker/backend` — **passed: 5 tests**. Covers required model fields, team member defaults/references, and repeatable non-destructive seeding.
- `npm run test:api --prefix octofit-tracker/backend` — **passed: 4 tests**. Covers activity validation/creation/listing, team creation/listing, leaderboard totals/ranks, and user-specific workout suggestions including unknown users.
- `npm test --prefix octofit-tracker/frontend` — **passed: 15 tests**. Covers API-backed rendering, the workout suggestion request, and accessible loading, empty, and error states for all capability pages.
- `npm run build --prefix octofit-tracker/backend` — **passed**; TypeScript compilation succeeds.
- `npm run build --prefix octofit-tracker/frontend` — **passed**; TypeScript compilation and the Vite production build succeed.
