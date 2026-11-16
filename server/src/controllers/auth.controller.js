const axios = require('axios');
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const { authService, tokenService, emailService, otpService, userService } = require('../services');

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.OK).send({ success: true, message: 'User Logout Successfully!' });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const resetPassword = catchAsync(async (req, res) => {
  const updatedUser = await authService.resetPassword(req.query.token, req.body.password);
  await emailService.sendPasswordRestSuccessEmail(updatedUser.email);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const otp = await otpService.generateAndSaveOtp(req.user.id);
  await emailService.sendVerificationEmail(req.user.email, otp);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await otpService.verifyOtp(req.user.id, req.body.otp);
  res.status(httpStatus.NO_CONTENT).send();
});

const slackAuth = catchAsync(async (req, res) => {
  const { code, redirectUri } = req.body;
  const { clientId, clientSecret, openid } = config.slack;

  const resolvedRedirectUri = redirectUri || `${config.frontend.url}/api/slack/callback`;

  const formData = new URLSearchParams();
  formData.append('grant_type', 'authorization_code');
  formData.append('client_id', clientId);
  formData.append('client_secret', clientSecret);
  formData.append('code', code);
  if (resolvedRedirectUri) {
    formData.append('redirect_uri', resolvedRedirectUri);
  }

  let data;
  try {
    const response = await axios.post(openid.exchangeTokenUrl, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    data = response.data;
  } catch (error) {
    logger.error('Error calling Slack openid token exchange: %o', error.response ? error.response.data : error.message);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Slack token exchange request failed: ${error.response?.data?.error || error.message}`
    );
  }

  if (!data || !data.ok) {
    logger.error('Slack openid token exchange failed: %o', data);
    throw new ApiError(httpStatus.BAD_REQUEST, `Slack authentication failed: ${data?.error || 'Invalid code'}`);
  }

  // eslint-disable-next-line camelcase
  const { name, email, picture, sub, email_verified, ...rest } = jwt.decode(data.id_token);
  const workspaceId = rest['https://slack.com/team_id'];

  if (!sub || !workspaceId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Slack identity token missing user or workspace ID');
  }

  const userPayload = {
    name: name || email || sub,
    ...(email ? { email } : {}),
    slackId: sub,
    avatar: picture,
    workspace: workspaceId,
    isEmailVerified: Boolean(email_verified),
    slackAccessToken: data.access_token,
  };

  // Scope user identity by (slackId, workspace) so the same person / owner email
  // can belong to multiple Slack workspaces without colliding.
  const user = await userService.upsertUser({ slackId: sub, workspace: workspaceId }, userPayload);

  if (user.isBlocked) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account has been restricted!');
  }

  const tokens = await tokenService.generateAuthTokens(user);

  res.status(httpStatus.OK).send({ user, tokens });
});

module.exports = {
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  slackAuth,
};
