import { Activity, Team, User, Workout } from '../models/index.js';
import { isValidObjectId } from 'mongoose';

function clientError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw clientError('Activity data is required');
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (typeof userId !== 'string' || !isValidObjectId(userId)) {
    throw clientError('A valid userId is required');
  }
  if (typeof teamId !== 'string' || !isValidObjectId(teamId)) {
    throw clientError('A valid teamId is required');
  }
  if (typeof type !== 'string' || type.trim().length === 0) {
    throw clientError('A type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw clientError('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);
  if (!user) {
    throw clientError('User not found', 404);
  }
  if (!team) {
    throw clientError('Team not found', 404);
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  if (!_input || typeof _input !== 'object') {
    throw clientError('Team data is required');
  }

  const { name, mascot, members = [] } = _input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw clientError('A team name is required');
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw clientError('A team mascot is required');
  }
  if (!Array.isArray(members)) {
    throw clientError('Members must be an array');
  }

  const memberIds: string[] = [];
  for (const memberId of members) {
    if (typeof memberId !== 'string' || !isValidObjectId(memberId)) {
      throw clientError('A valid member ID is required');
    }
    memberIds.push(memberId);
  }
  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingMembers.length !== memberIds.length) {
    throw clientError('One or more team members were not found', 404);
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });
}

export async function getLeaderboard() {
  const teams = await Team.find().lean();
  const totals = await Activity.aggregate<{ _id: unknown; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const pointsByTeam = new Map(
    totals.map((entry) => [String(entry._id), entry.totalPoints]),
  );

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(_userEmail: string) {
  const userEmail = _userEmail.trim().toLowerCase();
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw clientError('User not found', 404);
  }

  let workout = await Workout.findOne({ focus: user.fitnessGoal }).lean();
  let reason = `Matches your fitness goal: ${user.fitnessGoal}.`;

  if (!workout) {
    const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
    if (recentActivity) {
      workout = await Workout.findOne({ focus: recentActivity.type }).lean();
      reason = `Based on your recent ${recentActivity.type} activity.`;
    }
  }

  if (!workout) {
    workout = await Workout.findOne().lean();
    reason = 'General workout suggestion for your current program.';
  }
  if (!workout) {
    return [];
  }

  return [{ ...workout, reason }];
}

export { User };
