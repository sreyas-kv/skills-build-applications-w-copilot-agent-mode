import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type HttpError = Error & { status: number };

function httpError(status: number, message: string): HttpError {
  return Object.assign(new Error(message), { status });
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw httpError(400, `${field} is required`);
  }
  return value.trim();
}

function activityFocus(type: string): string {
  const normalizedType = type.trim().toLowerCase();
  if (['run', 'cycle', 'walk'].includes(normalizedType)) return 'endurance';
  if (['strength', 'weights'].includes(normalizedType)) return 'strength';
  return normalizedType;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity details are required');

  const userId = requiredString(input.userId, 'userId');
  const teamId = requiredString(input.teamId, 'teamId');
  const type = requiredString(input.type, 'type');
  const minutes = input.minutes;
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(teamId)) {
    throw httpError(400, 'userId and teamId must be valid IDs');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw httpError(400, 'minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user) throw httpError(404, 'User not found');
  if (!team) throw httpError(404, 'Team not found');

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team details are required');

  const name = requiredString(input.name, 'name');
  const mascot = requiredString(input.mascot, 'mascot');
  const members = input.members ?? [];
  if (!Array.isArray(members)) throw httpError(400, 'members must be an array of user IDs');

  const memberIds = members.map((member) => requiredString(member, 'member ID'));
  if (memberIds.some((memberId) => !Types.ObjectId.isValid(memberId))) {
    throw httpError(400, 'members must contain valid user IDs');
  }
  const uniqueMemberIds = [...new Set(memberIds)];
  const existingMembers = await User.countDocuments({ _id: { $in: uniqueMemberIds } });
  if (existingMembers !== uniqueMemberIds.length) throw httpError(404, 'One or more team members were not found');

  const team = await Team.create({ name, mascot, members: uniqueMemberIds });
  return team.toObject();
}

export async function getLeaderboard() {
  const [teams, pointTotals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(pointTotals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totalsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints)
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail });
  if (!user) throw httpError(404, 'User not found');

  const [workouts, recentActivities] = await Promise.all([
    Workout.find().lean(),
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
  ]);
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  const matchingGoal = workouts.some((workout) => workout.focus.toLowerCase() === goalFocus);
  const recentFocus = recentActivities.length > 0 ? activityFocus(recentActivities[0].type) : undefined;
  const matchingActivity = recentFocus
    ? workouts.some((workout) => workout.focus.toLowerCase() === recentFocus)
    : false;
  const preferredFocus = matchingGoal ? goalFocus : matchingActivity ? recentFocus : undefined;
  const reason = matchingGoal
    ? `Recommended for your ${user.fitnessGoal} fitness goal.`
    : matchingActivity && recentActivities[0]
      ? `Recommended based on your recent ${recentActivities[0].type} activity.`
      : 'Suggested to support your fitness routine.';

  return workouts
    .map((workout) => ({ workout, matches: workout.focus.toLowerCase() === preferredFocus }))
    .sort((left, right) => Number(right.matches) - Number(left.matches))
    .map(({ workout, matches }) => ({
      ...workout,
      reason: matches ? reason : `A ${workout.focus} workout to add variety to your routine.`,
    }));
}

export { User };
