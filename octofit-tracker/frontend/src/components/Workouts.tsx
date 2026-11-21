import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  reason: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => {
        if (active) setSuggestions(data.suggestions);
      })
      .catch(() => {
        if (active) setError('Unable to load workout suggestions.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {error ? (
        <p role="alert">Unable to load workout suggestions: API unavailable.</p>
      ) : suggestions === null ? (
        <p role="status">Loading workout suggestions...</p>
      ) : suggestions.length === 0 ? (
        <p>No workout suggestions yet.</p>
      ) : (
        <ul className="list-group">
          {suggestions.map((suggestion) => (
            <li className="list-group-item" key={suggestion.title}>
              <strong>{suggestion.title}</strong>: {suggestion.reason}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
