const axios = require('axios');
const httpStatus = require('http-status');
const config = require('../config/config');
const Workspace = require('../models/workspace.model');
const Channel = require('../models/channel.model');
const ApiError = require('../utils/ApiError');
const slackRequest = require('../utils/slackRequest');
const logger = require('../config/logger');
const { User } = require('../models');
const { startOpsJob, finishOpsJob } = require('./opsJob');

const saveChannels = async (channels) => {
  if (!channels.length) return;

  const bulkOps = channels.map((channel) => ({
    updateOne: {
      filter: { slackId: channel.slackId },
      update: { $set: channel },
      upsert: true,
    },
  }));

  await Channel.bulkWrite(bulkOps);
};

const updateChannel = async (channelId, updateBody) => {
  const channel = await Channel.findOneAndUpdate({ slackId: channelId }, updateBody, { new: true });
  return channel;
};

const getChannelsWithBot = async () => {
  const workspaces = await Workspace.find();
  const workspaceIds = workspaces.map((workspace) => workspace.slackId);

  const channels = await Channel.find({
    slackWorkspaceId: { $in: workspaceIds },
    isBotAdded: true,
  });

  const result = workspaces.map((workspace) => {
    const workspaceChannels = channels.filter((channel) => channel.slackWorkspaceId === workspace.slackId);

    return {
      workspace,
      channels: workspaceChannels,
    };
  });

  return result;
};

const getWorkspaceChannels = async (slackWorkspaceId, slackUserId) => {
  return Channel.find({
    slackWorkspaceId,
    isBotAdded: true,
    members: { $in: [slackUserId] },
  });
};

const getChannelById = async (channelId) => {
  const channel = await Channel.findOne({ slackId: channelId }).lean();

  if (!channel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Channel not found');
  }

  const members = await User.find({
    workspace: channel.slackWorkspaceId,
    slackId: { $in: channel.members },
    isBot: { $ne: true },
  })
    .select('slackId name avatar')
    .lean();

  channel.members = members;

  return channel;
};

const isChannelMember = async (channelId, userId) => {
  const channel = await Channel.findOne({ slackId: channelId, members: userId });

  if (!channel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Channel not found or user is not a member');
  }

  return true;
};

const getUserAllowedChannelIds = async (slackWorkspaceId, slackUserId) => {
  const channels = await getWorkspaceChannels(slackWorkspaceId, slackUserId);
  return channels?.map((c) => c.slackId) || [];
};

const fetchChannelsWithMembers = async (workspaceId, token) => {
  const { channelListUrl, channelMembersUrl } = config.slack.api;

  const channelsList = await slackRequest(channelListUrl, token);
  if (!channelsList || !Array.isArray(channelsList.channels)) {
    return [];
  }

  const formattedChannels = await Promise.all(
    channelsList.channels.map(async (channel) => {
      const memberResponse = await slackRequest(`${channelMembersUrl}?channel=${channel.id}`, token);
      return {
        slackId: channel.id,
        name: channel.name,
        slackWorkspaceId: workspaceId,
        isPrivate: channel.is_private || false,
        isBotAdded: channel.is_member || false,
        members: memberResponse?.members || [],
      };
    })
  );

  return formattedChannels;
};

const syncWorkspaceChannels = async (workspace) => {
  const { botToken, slackId: workspaceId } = workspace;

  try {
    logger.info(`Syncing channels for workspace: ${workspaceId}`);

    const updatedChannels = await fetchChannelsWithMembers(workspaceId, botToken);
    await saveChannels(updatedChannels);

    const slackChannelIds = updatedChannels.map((c) => c.slackId);
    await Channel.deleteMany({
      slackWorkspaceId: workspaceId,
      slackId: { $nin: slackChannelIds },
    });

    logger.info(`Synced ${updatedChannels.length} channels for workspace: ${workspaceId}`);
    return updatedChannels;
  } catch (error) {
    logger.error(error);
    return [];
  }
};

const syncAllWorkspacesChannels = async () => {
  try {
    logger.info('Starting to sync channels');

    const workspaces = await Workspace.find({});
    logger.info(`Found ${workspaces.length} workspaces`);

    await Promise.all(
      workspaces.map(async (workspace) => {
        await syncWorkspaceChannels(workspace);
      })
    );

    logger.info('Successfully synced all workspaces channels');
  } catch (error) {
    logger.error(error);
  }
};

const beginSync = (workspace) => {
  const scope = workspace ? `sync:${workspace.slackId}` : 'sync:all';
  const started = startOpsJob(scope);

  setImmediate(async () => {
    try {
      if (workspace) {
        await syncWorkspaceChannels(workspace);
      } else {
        await syncAllWorkspacesChannels();
      }
    } catch (error) {
      logger.error(error);
    } finally {
      finishOpsJob();
    }
  });

  return started;
};

const sendBackupAcknowledgment = async (channelId, botToken, summaryMessage) => {
  try {
    const response = await axios.post(
      config.slack.api.chatPostMessageUrl,
      {
        channel: channelId,
        text: summaryMessage || 'Backup completed successfully. Your data is safe!',
        mrkdwn: true,
      },
      {
        headers: {
          Authorization: `Bearer ${botToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.ok) {
      logger.error('Failed to send message:', response.data.error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error sending Slack message:', error.message);
    return false;
  }
};

module.exports = {
  saveChannels,
  updateChannel,
  isChannelMember,
  getChannelsWithBot,
  getWorkspaceChannels,
  getChannelById,
  getUserAllowedChannelIds,
  fetchChannelsWithMembers,
  syncWorkspaceChannels,
  syncAllWorkspacesChannels,
  beginSync,
  sendBackupAcknowledgment,
};
