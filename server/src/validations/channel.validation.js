const Joi = require('joi');

const getChannel = {
  params: Joi.object().keys({
    channelId: Joi.string().required(),
  }),
};

module.exports = {
  getChannel,
};
