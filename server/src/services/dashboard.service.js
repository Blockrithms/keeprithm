const httpStatus = require('http-status');
const { Workspace, Channel, Message, Thread, User } = require('../models');
const ApiError = require('../utils/ApiError');
const userService = require('./user.service');
const workspaceService = require('./workspace.service');
const messageService = require('./message.service');
const channelService = require('./channel.service');
const { getOpsJob } = require('./opsJob');
const { rolesAllowed } = require('../config/roles');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const slackTsToIso = (ts) => {
  if (!ts) return null;
  const seconds = Number(ts);
  if (!Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
};

// On-disk bytes for the collection documents plus their indexes.
// Slack file blobs live in cloud storage and are not part of this number.
const onDiskBytes = async (model) => {
  try {
    const [row] = await model.aggregate([{ $collStats: { storageStats: {} } }]);
    const stats = row && row.storageStats ? row.storageStats : {};
    return (Number(stats.storageSize) || 0) + (Number(stats.totalIndexSize) || 0);
  } catch (error) {
    if (error && (error.code === 26 || error.codeName === 'NamespaceNotFound')) return 0;
    throw error;
  }
};

const getOverview = async () => {
  const [
    workspaces,
    channels,
    monitoredChannels,
    messages,
    threads,
    users,
    blockedUsers,
    roleCounts,
    messageBytes,
    threadBytes,
  ] = await Promise.all([
    Workspace.countDocuments(),
    Channel.countDocuments(),
    Channel.countDocuments({ isBotAdded: true }),
    Message.countDocuments(),
    Thread.countDocuments(),
    User.countDocuments(),
    User.countDocuments({ isBlocked: true }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    onDiskBytes(Message),
    onDiskBytes(Thread),
  ]);

  const byRole = Object.fromEntries(rolesAllowed.map((role) => [role, 0]));
  roleCounts.forEach((row) => {
    if (row._id && Object.prototype.hasOwnProperty.call(byRole, row._id)) {
      byRole[row._id] = row.count;
    }
  });

  return {
    workspaces,
    channels: { total: channels, monitored: monitoredChannels },
    messages,
    threads,
    storage: {
      messages: messageBytes,
      threads: threadBytes,
      total: messageBytes + threadBytes,
    },
    users: { total: users, blocked: blockedUsers, byRole },
    job: getOpsJob(),
  };
};

const getWorkspaces = async () => {
  const [workspaces, channelStats] = await Promise.all([
    Workspace.find().select('name slackId avatar owner plan').sort({ name: 1 }),
    Channel.aggregate([
      {
        $group: {
          _id: '$slackWorkspaceId',
          channelCount: { $sum: 1 },
          monitoredChannelCount: {
            $sum: { $cond: [{ $eq: ['$isBotAdded', true] }, 1, 0] },
          },
          lastBackupTs: { $max: '$lastBackupTs' },
        },
      },
    ]),
  ]);

  const statsByWorkspace = new Map(channelStats.map((row) => [row._id, row]));

  return workspaces.map((workspace) => {
    const stats = statsByWorkspace.get(workspace.slackId) || {
      channelCount: 0,
      monitoredChannelCount: 0,
      lastBackupTs: null,
    };

    return {
      id: workspace.id,
      name: workspace.name,
      slackId: workspace.slackId,
      avatar: workspace.avatar || null,
      owner: workspace.owner,
      plan: workspace.plan,
      channelCount: stats.channelCount,
      monitoredChannelCount: stats.monitoredChannelCount,
      lastBackupAt: slackTsToIso(stats.lastBackupTs),
    };
  });
};

const startBackup = async (workspaceSlackId) => {
  if (workspaceSlackId) {
    await workspaceService.getWorkspaceBySlackId(workspaceSlackId);
  }
  return messageService.beginBackup(workspaceSlackId || undefined);
};

const startSync = async (workspaceSlackId) => {
  const workspace = workspaceSlackId ? await workspaceService.getWorkspaceBySlackId(workspaceSlackId) : null;
  return channelService.beginSync(workspace);
};

const getUsers = async ({ search, role, page = 1, limit = 20 }) => {
  const filter = {};
  if (role) filter.role = role;

  const term = search ? escapeRegex(String(search).trim()) : '';
  if (term) {
    filter.$or = [{ name: { $regex: term, $options: 'i' } }, { email: { $regex: term, $options: 'i' } }];
  }

  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) > 0 ? Number(limit) : 20;

  const [totalResults, results] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
  ]);

  const slackIds = [...new Set(results.map((user) => user.workspace).filter(Boolean))];
  const linkedWorkspaces = await Workspace.find({ slackId: { $in: slackIds } }).select('name slackId');
  const workspaceNames = new Map(linkedWorkspaces.map((workspace) => [workspace.slackId, workspace.name]));

  return {
    results: results.map((user) => {
      const json = user.toJSON();
      return {
        ...json,
        workspaceName: json.workspace ? workspaceNames.get(json.workspace) || null : null,
      };
    }),
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(totalResults / safeLimit) || 0,
    totalResults,
  };
};

const setUserBlocked = async (userId, isBlocked, actorId) => {
  const user = await userService.getUserById(userId);

  if (isBlocked && String(user.id) === String(actorId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot block your own account');
  }

  user.isBlocked = isBlocked;
  await user.save();
  return user;
};

module.exports = {
  getOverview,
  getWorkspaces,
  startBackup,
  startSync,
  getUsers,
  setUserBlocked,
};
