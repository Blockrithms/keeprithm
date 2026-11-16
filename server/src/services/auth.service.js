const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const Token = require('../models/token.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const logger = require('../config/logger');

const REFRESH_ROTATION_GRACE_MS = 30 * 1000;

/**
 * Login a user with their email and password.
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {Promise<User>} The authenticated user object.
 * @throws {ApiError} If the email or password is incorrect.
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmailWithPassword(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  if (user.isBlocked) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account has been restricted!');
  }
  return user;
};

/**
 * Logout (idempotent — already-expired/rotated tokens succeed quietly).
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
const logout = async (refreshToken) => {
  if (!refreshToken) return;
  await Token.deleteMany({ token: refreshToken, type: tokenTypes.REFRESH });
};

/**
 * Refresh auth tokens with rotation + a short overlap grace window so
 * concurrent requests carrying the pre-rotation refresh cookie never kill
 * the newly minted session.
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user || user.isBlocked) {
      throw new Error('User not found, with refresh token!');
    }

    const graceExpiry = new Date(Date.now() + REFRESH_ROTATION_GRACE_MS);
    if (refreshTokenDoc.expires > graceExpiry) {
      await Token.updateOne({ _id: refreshTokenDoc._id }, { $set: { expires: graceExpiry } });
    }

    // Opportunistically clean up already-expired tokens for this user.
    await Token.deleteMany({ user: refreshTokenDoc.user, expires: { $lte: new Date() } });

    return tokenService.generateAuthTokens(user);
  } catch (error) {
    logger.error(error);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * @param {string} resetPasswordToken - The reset password token.
 * @param {string} newPassword - The new password to be set.
 * @returns {Promise<User>} The updated user object with the new password.
 * @throws {ApiError} If the password reset token is invalid or expired.
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const user = await userService.getUserById(resetPasswordTokenDoc.user);
    await userService.updateUserById(user.id, { password: newPassword });
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
    return user;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify a user's email using a valid email verification token.
 * @param {string} verifyEmailToken - The email verification token.
 * @returns {Promise<void>} Resolves when the email is successfully verified.
 * @throws {ApiError} If the email verification token is invalid or expired.
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
};
