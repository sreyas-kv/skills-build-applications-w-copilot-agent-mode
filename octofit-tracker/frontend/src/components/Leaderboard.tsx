import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => {
        if (active) setEntries(data.leaderboard);
      })
      .catch(() => {
        if (active) setError('Unable to load leaderboard.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {error ? (
        <p role="alert">Unable to load leaderboard: API unavailable.</p>
      ) : entries === null ? (
        <p role="status">Loading leaderboard...</p>
      ) : entries.length === 0 ? (
        <p>No leaderboard rankings or scores yet.</p>
      ) : (
        <ol className="list-group list-group-numbered">
          {entries.map((entry) => (
            <li className="list-group-item" key={entry.teamName}>
              {entry.teamName} - {entry.totalPoints} points - rank {entry.rank}
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}
