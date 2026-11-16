const axios = require('axios');
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const workspaceService = require('../services/workspace.service');
const tokenService = require('../services/token.service');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

const registerWorkspace = catchAsync(async (req, res) => {
  const { code, redirectUri } = req.body;
  const { clientId, clientSecret, oauth, allowedTeamIds } = config.slack;

  const resolvedRedirectUri = redirectUri || `${config.frontend.url}/api/slack/callback`;

  const formData = new URLSearchParams();
  formData.append('client_id', clientId);
  formData.append('client_secret', clientSecret);
  formData.append('code', code);
  if (resolvedRedirectUri) {
    formData.append('redirect_uri', resolvedRedirectUri);
  }

  let data;
  try {
    const response = await axios.post(oauth.exchangeTokenUrl, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    data = response.data;
  } catch (error) {
    logger.error('Error calling Slack oauth.v2.access: %o', error.response ? error.response.data : error.message);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Slack OAuth request failed: ${error.response?.data?.error || error.message}`
    );
  }

  if (!data || !data.ok) {
    logger.error('Slack OAuth token exchange failed: %o', data);
    throw new ApiError(httpStatus.BAD_REQUEST, `Slack workspace authorization failed: ${data?.error || 'Invalid code'}`);
  }

  const teamId = data.team?.id;
  if (!teamId || !data.authed_user?.id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incomplete workspace authorization payload from Slack');
  }

  if (allowedTeamIds.length > 0 && !allowedTeamIds.includes(teamId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'WORKSPACE_NOT_ALLOWED');
  }

  const ownerUser = await workspaceService.isWorkspacePrimaryOwner(
    data.authed_user.id,
    teamId,
    data.access_token,
    data.authed_user.access_token
  );
  const workspace = await workspaceService.saveWorkspaceAndChannels(data);
  const tokens = await tokenService.generateAuthTokens(ownerUser);

  res.status(httpStatus.OK).send({ workspace, user: ownerUser, tokens });
});

const getUserWorkspace = catchAsync(async (req, res) => {
  const { slackId, workspace } = req.user;
  const userWorkspace = await workspaceService.getUserWorkspace(workspace, slackId);
  res.status(httpStatus.OK).send(userWorkspace);
});

module.exports = {
  registerWorkspace,
  getUserWorkspace,
};
