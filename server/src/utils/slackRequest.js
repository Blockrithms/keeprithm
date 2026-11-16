const { default: axios } = require('axios');
const logger = require('../config/logger');

const slackRequest = async (url, token) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

module.exports = slackRequest;
