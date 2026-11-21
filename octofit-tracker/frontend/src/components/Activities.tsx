import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => {
        if (active) setActivities(data.activities);
      })
      .catch(() => {
        if (active) setError('Unable to load activities.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {error ? (
        <p role="alert">Unable to load activities: API unavailable.</p>
      ) : activities === null ? (
        <p role="status">Loading activities...</p>
      ) : activities.length === 0 ? (
        <p>No activities yet.</p>
      ) : (
        <ul className="list-group">
          {activities.map((activity, index) => (
            <li className="list-group-item" key={`${activity.type}-${index}`}>
              {activity.type} - {activity.minutes} minutes - {activity.points} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
