const Joi = require('joi');

const searchMessage = {
  query: Joi.object().keys({
    q: Joi.string().min(2).max(100).required(),
    channelId: Joi.string(),
  }),
};

const getMessage = {
  params: Joi.object().keys({
    messageId: Joi.string().required(),
  }),
};

const queryMessages = {
  query: {
    channelId: Joi.string().required(),
    cursor: Joi.string(),
    limit: Joi.string(),
    messageId: Joi.string(),
  },
};

const getThreadMessages = {
  params: Joi.object().keys({
    channelId: Joi.string().required(),
    threadTs: Joi.string().required(),
  }),
};

module.exports = {
  searchMessage,
  getMessage,
  queryMessages,
  getThreadMessages,
};
