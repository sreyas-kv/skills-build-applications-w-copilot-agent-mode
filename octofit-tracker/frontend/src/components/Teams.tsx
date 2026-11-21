import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name: string;
  members: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => {
        if (active) setTeams(data.teams);
      })
      .catch(() => {
        if (active) setError('Unable to load teams.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {error ? (
        <p role="alert">Unable to load teams: API unavailable.</p>
      ) : teams === null ? (
        <p role="status">Loading teams...</p>
      ) : teams.length === 0 ? (
        <p>No teams yet.</p>
      ) : (
        <ul className="list-group">
          {teams.map((team) => (
            <li className="list-group-item" key={team.name}>
              {team.name} - {team.members.length} members
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
