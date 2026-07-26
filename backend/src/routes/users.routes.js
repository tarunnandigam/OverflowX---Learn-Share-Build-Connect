const express = require('express');
const router = express.Router();
const { 
  getUserProfile, 
  updateProfile, 
  getUsers, 
  toggleFriend, 
  transferPoints,
  getUserNotifications,
  markNotificationsAsRead,
  toggleNotificationRead
} = require('../controllers/user.controller');
const { protect, optionalProtect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { isCloudinaryConfigured, uploadToCloudinary } = require('../utils/cloudinary');

router.get('/', optionalProtect, getUsers);
router.put('/profile', protect, updateProfile);
router.post('/profile/avatar', protect, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  try {
    if (isCloudinaryConfigured) {
      const result = await uploadToCloudinary(req.file.path);
      res.json({ url: result.secure_url });
    } else {
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

// Notifications routes
router.get('/notifications', protect, getUserNotifications);
router.put('/notifications/read', protect, markNotificationsAsRead);
router.put('/notifications/:id/read', protect, toggleNotificationRead);

router.post('/:id/friend', protect, toggleFriend);
router.post('/:id/transfer-points', protect, transferPoints);
router.get('/:username', optionalProtect, getUserProfile);

module.exports = router;
