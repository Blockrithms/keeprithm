const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { rolesAllowed } = require('../config/roles');

const startJob = {
  body: Joi.object().keys({
    workspaceSlackId: Joi.string().trim().max(32),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    search: Joi.string().allow('').max(100),
    role: Joi.string().valid(...rolesAllowed),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }),
};

const setUserBlocked = {
  params: Joi.object().keys({
    userId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    isBlocked: Joi.boolean().required(),
  }),
};

module.exports = {
  startJob,
  getUsers,
  setUserBlocked,
};
