import { useApiData } from '../api/useApiData.js';

type WorkoutSuggestion = { _id?: string; title: string; focus: string; minutes: number; difficulty: string; reason?: string };

export default function Workouts() {
  const userEmail = 'mona@example.com';
  const { data, error, loading } = useApiData<{ suggestions: WorkoutSuggestion[] }>(
    `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`,
  );

  return (
    <section>
      <h2>Workout suggestions</h2>
      <p>Recommendations for {userEmail}, based on fitness goals and recent activity.</p>
      {loading ? <p role="status">Loading workout suggestions...</p> : null}
      {!loading && error ? <p role="alert">Unable to load workout suggestions: {error}</p> : null}
      {!loading && !error && data?.suggestions.length === 0 ? <p>No workout suggestions yet.</p> : null}
      {!loading && !error && data && data.suggestions.length > 0 ? (
        <ul className="list-group">
          {data.suggestions.map((suggestion, index) => (
            <li className="list-group-item" key={suggestion._id ?? `${suggestion.title}-${index}`}>
              <strong>{suggestion.title}</strong> - {suggestion.focus}, {suggestion.minutes} minutes, {suggestion.difficulty}
              {suggestion.reason ? <p className="mb-0">{suggestion.reason}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
