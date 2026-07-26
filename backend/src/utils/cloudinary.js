const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn('Cloudinary environment variables are missing. File uploads will default to local storage.');
}

/**
 * Uploads a local file to Cloudinary and deletes the local temporary file.
 * 
 * @param {string} filePath - Path to the local file to upload
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<object>} Cloudinary upload response object
 */
const uploadToCloudinary = async (filePath, folder = 'overflowx') => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto' // Supports images, videos, etc.
    });

    // Remove local temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  } catch (error) {
    // Make sure we delete local file even on upload failure to avoid disk bloat
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

module.exports = {
  isCloudinaryConfigured,
  uploadToCloudinary
};
