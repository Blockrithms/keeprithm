const httpStatus = require('http-status');
const Workspace = require('../models/workspace.model');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const slackRequest = require('../utils/slackRequest');
const channelService = require('./channel.service');
const config = require('../config/config');
const userService = require('./user.service');
const { WORKSPACE_OWNER } = require('../config/roles');

const getWorkspaceBySlackId = async (slackId, shouldThrow = true) => {
  const workspace = await Workspace.findOne({ slackId });

  if (!workspace && shouldThrow) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Workspace does not exist');
  }

  return workspace;
};

const saveWorkspaceAndChannels = async (workspaceData) => {
  // eslint-disable-next-line camelcase
  const { authed_user, access_token, bot_user_id, team } = workspaceData;
  const { workspaceInfoUrl } = config.slack.api;

  const channels = await channelService.fetchChannelsWithMembers(team.id, access_token);
  await channelService.saveChannels(channels);

  const additionalDetails = await slackRequest(workspaceInfoUrl, access_token);
  const avatar = additionalDetails?.team?.icon?.image_132;

  // Upsert by slackId so reinstalling a workspace rotates its encrypted botToken
  // and refreshes metadata cleanly without duplicate-key errors.
  const workspace = await Workspace.findOneAndUpdate(
    { slackId: team.id },
    {
      $set: {
        slackId: team.id,
        name: team.name,
        owner: authed_user.id,
        botToken: access_token,
        slackBotId: bot_user_id,
        ...(avatar ? { avatar } : {}),
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  return workspace;
};

const getUserWorkspace = async (workspaceId, slackUserId) => {
  const workspace = await getWorkspaceBySlackId(workspaceId);

  const { name, slackId, avatar, plan } = workspace;
  const members = await User.find({ workspace: workspaceId, isBot: false, isDeleted: false });
  const channelsData = await channelService.getWorkspaceChannels(workspaceId, slackUserId);
  const channels = channelsData.map((ch) => ({ id: ch._id, name: ch.name, slackId: ch.slackId, isPrivate: ch.isPrivate }));

  return {
    name,
    slackId,
    avatar,
    plan,
    members,
    channels,
  };
};

const isWorkspacePrimaryOwner = async (slackId, workspaceId, token, userAccessToken) => {
  const response = await slackRequest(`${config.slack.api.userInfoUrl}?user=${slackId}`, token);
  if (!response || !response.ok || !response.user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to verify Slack workspace owner');
  }

  if (!response.user.is_primary_owner) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'NOT_PRIMARY_OWNER');
  }

  const { user: slackUser } = response;
  const profile = slackUser.profile || {};
  const email = profile.email ? profile.email.toLowerCase().trim() : undefined;

  const ownerPayload = {
    slackId,
    workspace: workspaceId,
    name: profile.real_name || slackUser.real_name || slackUser.name || slackId,
    role: WORKSPACE_OWNER,
    avatar: profile.image_192 || profile.image_72 || null,
    isBot: Boolean(slackUser.is_bot),
    isDeleted: Boolean(slackUser.deleted),
    isEmailVerified: Boolean(slackUser.is_email_confirmed),
    ...(email ? { email } : {}),
    ...(userAccessToken ? { slackAccessToken: userAccessToken } : {}),
  };

  const ownerUser = await userService.upsertUser({ slackId, workspace: workspaceId }, ownerPayload);
  return ownerUser;
};

module.exports = {
  getWorkspaceBySlackId,
  saveWorkspaceAndChannels,
  getUserWorkspace,
  isWorkspacePrimaryOwner,
};
