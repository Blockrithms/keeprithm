const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user.model');
const { tokenTypes } = require('../config/tokens');

/**
 * Middleware to authenticate a JWT token and attach the user to the request object.
 */
const authenticateToken = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new Error('No token provided');
    }

    const payload = jwt.verify(token, config.jwt.secret);

    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type');
    }

    req.user = await User.findById(payload.sub);
    if (!req.user || req.user.isBlocked) {
      throw new Error('Please authenticate');
    }
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, error.message);
  }
};

/**
 * Authorization middleware that checks if the authenticated user has the required role.
 */
const auth = (requiredRole) =>
  catchAsync(async (req, res, next) => {
    await authenticateToken(req, res);
    const { role } = req.user;
    if (requiredRole && role !== requiredRole) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Access denied, Role not allowed');
    }
    next();
  });

module.exports = auth;
