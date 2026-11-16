const httpStatus = require('http-status');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');

const slackSigningSecret = config.slack.signingSecret;

const verifySlackSignature = (req, res, next) => {
  const slackSignature = req.headers['x-slack-signature'];
  const slackTimestamp = req.headers['x-slack-request-timestamp'];

  if (!slackSignature || !slackTimestamp) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Missing Slack signature headers');
  }

  const time = Math.floor(Date.now() / 1000);
  if (Math.abs(time - slackTimestamp) > 60 * 5) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Slack request timestamp too old');
  }

  const rawBody = JSON.stringify(req.body);
  const sigBaseString = `v0:${slackTimestamp}:${rawBody}`;
  const hmac = crypto.createHmac('sha256', slackSigningSecret);
  hmac.update(sigBaseString);
  const mySignature = `v0=${hmac.digest('hex')}`;

  const isValid = crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(slackSignature));

  if (!isValid) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid Slack signature');
  }

  next();
};

module.exports = verifySlackSignature;
