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

- Presentation tier: `App.tsx` provides React Router navigation, but the capability components currently render generic cards. Use the existing shared API client for relative `/api` requests; keep capability UI in its page components and provide accessible loading, empty, and error states.
- Logic tier: the Express API router delegates to `octofitService`, and the app-level error middleware returns JSON errors with their status codes. Keep route handlers thin and put validation and capability behavior in the service layer. Activity/team creation, leaderboard calculation, and user-specific suggestions are currently incomplete service stubs.
- Data tier: Mongoose models represent users, teams, activities, and workouts, including ObjectId references, but their fields currently lack the required validators. Add schema validation while preserving the seed script's stable upserts and its behavior of retaining unrelated data.
- Activity tracking: implement creation in the service layer. Validate the submitted user/team IDs and referenced records before writing; persist the references, activity type, minutes, computed points, and occurrence time. The current service returns `501` without creating a record.
- Team management: retain member references and the submitted team name and mascot, and reject a missing name with `400`. Team listing is implemented; team creation currently returns `501`.
- Leaderboard: aggregate stored activity points by team, sort totals descending, and return a 1-based rank for each result. The current service returns an empty list.
- Workout suggestions: look up the requested user by email and use their goal and recent activity to select a matching workout with an explanatory reason; return a 4xx for an unknown user. The current service instead returns the first workout without matching a user or adding a reason.

## Test plan

- `npm run test:data --prefix octofit-tracker/backend` — **failed: 4 failed, 1 passed**. The user, team, activity, and workout schemas do not yet enforce the required fields; the idempotent, non-destructive seed test passed.
- `npm run test:api --prefix octofit-tracker/backend` — **failed: 4 failed**. Activity and team creation return `501`, the leaderboard is empty, and workout suggestions do not match the requested user or include the expected reason.
- `npm test --prefix octofit-tracker/frontend` — **failed: 15 failed**. Capability pages do not yet fetch and render API data or implement the tested loading, empty, and accessible error states.
- `npm run build --prefix octofit-tracker/backend` — **passed**; TypeScript compilation succeeds.
- `npm run build --prefix octofit-tracker/frontend` — **passed**; TypeScript compilation and the Vite production build succeed.
