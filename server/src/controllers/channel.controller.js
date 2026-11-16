const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const channelService = require('../services/channel.service');
const workspaceService = require('../services/workspace.service');

const refreshChannels = catchAsync(async (req, res) => {
  const { workspace: workspaceId } = req.user;
  const workspace = await workspaceService.getWorkspaceBySlackId(workspaceId);
  const result = await channelService.syncWorkspaceChannels(workspace);

  res.status(httpStatus.CREATED).send(result);
});

const getChannel = catchAsync(async (req, res) => {
  const channel = await channelService.getChannelById(req.params.channelId);
  res.status(httpStatus.OK).send(channel);
});

module.exports = {
  refreshChannels,
  getChannel,
};
