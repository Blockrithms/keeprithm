const Joi = require('joi');

const registerWorkspace = {
  body: Joi.object().keys({
    code: Joi.string().required(),
    redirectUri: Joi.string().optional(),
  }),
};

module.exports = {
  registerWorkspace,
};
