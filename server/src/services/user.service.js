const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a new user.
 * @param {Object} userBody - The user data to create.
 * @returns {Promise<User>} The created user.
 * @throws {ApiError} If the email is already taken in the same workspace.
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email, undefined, userBody.workspace)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return User.create(userBody);
};

/**
 * Upsert a user (create or update).
 * @param {Object} where - Filter identifying the user (e.g. { slackId, workspace }).
 * @param {Object} payload - Fields to set on insert/update.
 * @returns {Promise<User>} The upserted user.
 */
const upsertUser = async (where, payload) => {
  const user = await User.findOneAndUpdate(
    where,
    { $set: payload },
    {
      runValidators: true,
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return user;
};

/**
 * Query users with filtering and pagination options.
 * @param {Object} filter - The filter criteria for querying users.
 * @param {Object} options - The pagination options.
 * @returns {Promise<Array<User>>} A paginated list of users.
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get a user by their ID.
 * @param {string} id - The ID of the user to retrieve.
 * @returns {Promise<User>} The user object.
 * @throws {ApiError} If the user is not found.
 */
const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return user;
};

/**
 * Get a user by their email address (optionally scoped to a workspace).
 * @param {string} email - The email of the user to retrieve.
 * @param {string} [workspace] - Optional Slack workspace ID.
 * @returns {Promise<User|null>} The user object or null if not found.
 */
const getUserByEmail = async (email, workspace) => {
  const normalized = email?.toLowerCase().trim();
  if (!normalized) return null;
  if (workspace) {
    return User.findOne({ email: normalized, workspace });
  }
  return User.findOne({ email: normalized });
};

/**
 * Resolve a password-authenticated user (typically the seeded platform admin)
 * even if the same email also exists as a Slack OAuth member in one or more
 * workspaces without a password.
 */
const getUserByEmailWithPassword = async (email) => {
  const normalized = email?.toLowerCase().trim();
  if (!normalized) return null;
  const withPassword = await User.findOne({
    email: normalized,
    password: { $exists: true, $ne: null },
  });
  return withPassword || User.findOne({ email: normalized });
};

/**
 * Update a user's details by their ID.
 * @param {string} userId - The ID of the user to update.
 * @param {Object} updateBody - The updated user data.
 * @returns {Promise<User>} The updated user object.
 * @throws {ApiError} If the email is already taken in the same workspace.
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  const targetWorkspace = updateBody.workspace !== undefined ? updateBody.workspace : user.workspace;
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId, targetWorkspace))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Change a user's password.
 * @param {string} userId - The ID of the user.
 * @param {Object} requestBody - The request body containing old and new passwords.
 * @returns {Promise<User>} The updated user object.
 * @throws {ApiError} If the old password is incorrect.
 */
const changePassword = async (userId, requestBody) => {
  const { oldPassword, newPassword } = requestBody;
  const user = await getUserById(userId);
  if (!(await user.isPasswordMatch(oldPassword))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect password');
  }
  const updatedUser = await updateUserById(userId, { password: newPassword });
  return updatedUser;
};

/**
 * Delete a user by their ID.
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<User>} The deleted user object.
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  await user.deleteOne({ _id: userId });
  return user;
};

/**
 * Get user by Slack user ID (scoped to a workspace when provided).
 * @param {string} slackId
 * @param {string} [workspace]
 * @returns {Promise<User>} The user object.
 * @throws {ApiError} If user not found.
 */
const getUserBySlackId = async (slackId, workspace) => {
  const query = workspace ? { slackId, workspace } : { slackId };
  const user = await User.findOne(query);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

module.exports = {
  createUser,
  upsertUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  getUserByEmailWithPassword,
  updateUserById,
  changePassword,
  deleteUserById,
  getUserBySlackId,
};
