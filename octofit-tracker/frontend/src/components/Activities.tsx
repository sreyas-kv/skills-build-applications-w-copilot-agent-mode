import { useApiData } from '../api/useApiData.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

export default function Activities() {
  const { data, error, loading } = useApiData<{ activities: Activity[] }>('/api/activities');

  return (
    <section>
      <h2>Activities</h2>
      <p>Track student activity minutes and points.</p>
      {loading ? <p role="status">Loading activities...</p> : null}
      {!loading && error ? <p role="alert">Unable to load activities: {error}</p> : null}
      {!loading && !error && data?.activities.length === 0 ? <p>No activities yet.</p> : null}
      {!loading && !error && data && data.activities.length > 0 ? (
        <ul className="list-group">
          {data.activities.map((activity, index) => (
            <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
              {activity.type} - {activity.minutes} minutes, {activity.points} points
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
