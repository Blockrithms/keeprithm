const cloudinary = require('cloudinary').v2;
const config = require('./config');

const { cloudName, apiKey, apiSecret } = config.cloudinary;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

module.exports = cloudinary;
