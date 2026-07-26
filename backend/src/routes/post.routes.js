const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getPost,
  likePost,
  votePost,
  voteComment,
  acceptAnswer,
  toggleBookmark,
  addComment,
  deleteComment,
  deletePost,
  searchPosts,
  getTags,
  sharePost,
  getPopularQuestions,
  getGlobalStats
} = require('../controllers/post.controller');
const { protect, optionalProtect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { isCloudinaryConfigured, uploadToCloudinary } = require('../utils/cloudinary');

// Search (must be before /:id to avoid conflicts)
router.get('/search', optionalProtect, searchPosts);

// Tags aggregation
router.get('/tags', optionalProtect, getTags);

// Popular/trending questions for sidebar
router.get('/popular', optionalProtect, getPopularQuestions);

// Global stats (Public, no protect middleware)
router.get('/global-stats', getGlobalStats);

// Main CRUD
router.route('/')
  .post(protect, createPost)
  .get(optionalProtect, getPosts);

router.route('/:id')
  .get(optionalProtect, getPost)
  .delete(protect, deletePost);

// Voting & interactions
router.post('/upload', protect, upload.single('media'), async (req, res) => {
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
    res.status(500).json({ message: 'Failed to upload media' });
  }
});

router.post('/:id/like', protect, likePost);
router.post('/:id/vote', protect, votePost);
router.post('/:id/share', protect, sharePost);
router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/comment', protect, addComment);
router.post('/:id/comment/:commentId/vote', protect, voteComment);
router.post('/:id/accept/:commentId', protect, acceptAnswer);
router.delete('/:id/comment/:comment_id', protect, deleteComment);

module.exports = router;
