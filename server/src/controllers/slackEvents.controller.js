const catchAsync = require('../utils/catchAsync');
const messageService = require('../services/message.service');

const handleSlackEevents = catchAsync(async (req, res) => {
  const { type, challenge, event } = req.body;

  if (type === 'url_verification') {
    return res.json({ challenge });
  }

  if (type === 'event_callback' && event?.subtype === 'message_changed') {
    const { channel, message } = event;

    const previousMessage = await messageService.getWorkspaceMessage({
      slackWorkspaceId: message.team,
      slackChannelId: channel,
      ts: message.ts,
    });

    if (previousMessage) {
      const { _id, sender } = previousMessage;
      await messageService.updateEditedMessage(_id, message, channel, message.team, sender);
    }
  }

  return res.json({ status: 'ok' });
});

module.exports = {
  handleSlackEevents,
};
