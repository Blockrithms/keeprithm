const axios = require('axios');
const { uploadFile } = require('./cloudinary.utils');
const logger = require('../config/logger');

async function downloadAndSaveFile(fileUrl, token, options = {}) {
  try {
    const { data } = await axios.get(fileUrl, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
    });

    const file = await uploadFile(data, options);
    return file;
  } catch (error) {
    logger.error(error);
    return null;
  }
}

module.exports = downloadAndSaveFile;
