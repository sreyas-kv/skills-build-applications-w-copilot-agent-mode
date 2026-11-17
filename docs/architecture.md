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

- Presentation tier: keep React pages and components focused on rendering and interaction. Route API requests through the shared client using relative `/api` paths, and expose loading, empty, and error states accessibly.
- Logic tier: keep request validation and capability behavior in the Express API. Validate request data and identifiers before database operations, return deliberate 4xx responses for invalid or missing resources, and avoid leaking Mongoose errors as 500 responses.
- Data tier: keep persistence in Mongoose models and seed logic. Model required fields and relationships explicitly, and keep seeding repeatable so it can safely initialize representative data for all four capabilities.
- Activity tracking: accept `userId`, `teamId`, `type`, and `minutes`; validate both IDs and confirm the referenced records exist; then persist the user/team references, submitted activity details, computed points, and occurrence time.
- Team management: persist the submitted name and mascot with the member references. Reject a missing name with `400`, and return created/listed teams without dropping the submitted fields.
- Leaderboard: calculate each team's total from its activities' stored points, sort highest total first, and assign sequential 1-based ranks.
- Workout suggestions: find the user by email and use their goal and recent activity to choose relevant suggestions with an explanatory reason. Return a deliberate 4xx when no user matches; do not hardcode a response for a particular email.

## Test plan

- `npm run test:data --prefix octofit-tracker/backend` — checks model validation, relationships, and repeatable seeding. Last run: **failed, 4 of 5 tests**; required-field validation was missing for users, teams, activities, and workouts. The seed test passed.
- `npm run test:api --prefix octofit-tracker/backend` — checks API behavior against the contracts. Last run: **failed, 4 of 4 tests**; invalid activity/team input returned `501` instead of `400`, the leaderboard returned no entries, and a workout suggestion lacked its expected reason.
- `npm test --prefix octofit-tracker/frontend` — checks rendered API data, user-specific suggestion requests, and accessible loading/empty/error states. Last run: **failed, 15 of 15 tests** across those behaviors.
- `npm run build --prefix octofit-tracker/backend` — checks backend TypeScript compilation. Last run: **passed**.
- `npm run build --prefix octofit-tracker/frontend` — checks frontend TypeScript compilation and the Vite production build. Last run: **passed**.
