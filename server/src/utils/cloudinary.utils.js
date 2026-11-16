const cloudinary = require('../config/cloudinary');

const uploadFile = async (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        ...options,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(new Error('Error uploading file to Cloudinary'));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(fileBuffer);
  });
};

const deleteFile = async (publicIds) => {
  const promises = publicIds.map((id) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(id, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  });

  await Promise.all(promises);
};

module.exports = {
  uploadFile,
  deleteFile,
};
