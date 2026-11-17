import { useApiData } from '../api/useApiData.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const { data, error, loading } = useApiData<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');

  return (
    <section>
      <h2>Leaderboard</h2>
      <p>Compare team point totals.</p>
      {loading ? <p role="status">Loading leaderboard...</p> : null}
      {!loading && error ? <p role="alert">Unable to load leaderboard: {error}</p> : null}
      {!loading && !error && data?.leaderboard.length === 0 ? <p>No leaderboard scores yet.</p> : null}
      {!loading && !error && data && data.leaderboard.length > 0 ? (
        <ol className="list-group list-group-numbered">
          {data.leaderboard.map((entry) => (
            <li className="list-group-item" key={entry.teamName}>
              {entry.teamName}: {entry.totalPoints} points (rank {entry.rank})
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
