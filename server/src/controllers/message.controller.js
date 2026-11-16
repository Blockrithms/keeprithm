const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const messageService = require('../services/message.service');
const channelService = require('../services/channel.service');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

const fetchAndSaveMessages = catchAsync(async (req, res) => {
  const job = messageService.beginBackup();
  res.status(httpStatus.OK).send({ message: 'Messages backup started', job });
});

const searchMessage = catchAsync(async (req, res) => {
  const { slackId: slackUserId, workspace } = req.user;
  const { q: query, channelId } = req.query;

  const allowedChannelIds = await channelService.getUserAllowedChannelIds(workspace, slackUserId);

  if (channelId && !allowedChannelIds.includes(channelId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Channel not allowed');
  }

  if (!allowedChannelIds.length) {
    res.status(httpStatus.OK).send([]);
    return;
  }

  const channelScope = channelId || { $in: allowedChannelIds };
  const messages = await messageService.searchMessage({ query, channelScope });
  res.status(httpStatus.OK).send(messages);
});

const getMessages = catchAsync(async (req, res) => {
  const filters = pick(req.query, ['channelId', 'cursor', 'limit', 'messageId']);
  await channelService.isChannelMember(filters.channelId, req.user.slackId);
  const messages = await messageService.queryMessages(filters);

  res.status(httpStatus.OK).send(messages);
});

const getMessageById = catchAsync(async (req, res) => {
  const message = await messageService.getMessageById(req.params.messageId);
  res.status(httpStatus.OK).send(message);
});

const getThreadMessages = catchAsync(async (req, res) => {
  const { channelId, threadTs } = req.params;
  const messages = await messageService.getThreadMessages(channelId, threadTs);
  res.status(httpStatus.OK).send(messages);
});

module.exports = {
  getMessages,
  fetchAndSaveMessages,
  searchMessage,
  getMessageById,
  getThreadMessages,
};
