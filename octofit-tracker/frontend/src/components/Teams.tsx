import { useApiData } from '../api/useApiData.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };

export default function Teams() {
  const { data, error, loading } = useApiData<{ teams: Team[] }>('/api/teams');

  return (
    <section>
      <h2>Teams</h2>
      <p>Manage teams and members.</p>
      {loading ? <p role="status">Loading teams...</p> : null}
      {!loading && error ? <p role="alert">Unable to load teams: {error}</p> : null}
      {!loading && !error && data?.teams.length === 0 ? <p>No teams yet.</p> : null}
      {!loading && !error && data && data.teams.length > 0 ? (
        <ul className="list-group">
          {data.teams.map((team, index) => (
            <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
              <strong>{team.name}</strong> - {team.mascot}; members: {team.members.map(String).join(', ') || 'None'}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
