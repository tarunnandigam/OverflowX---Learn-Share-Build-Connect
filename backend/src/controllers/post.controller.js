const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { type, mediaUrl, caption, description, tags, isSocial } = req.body;

    const isSocialPost = isSocial === true || isSocial === 'true';

    if (isSocialPost) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const friendCount = user.friends ? user.friends.length : 0;

      // Calculate start of today in local/server time
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Count social posts created by this user today
      const postsToday = await Post.countDocuments({
        user: req.user.id,
        isSocial: true,
        createdAt: { $gte: startOfToday }
      });

      if (friendCount === 0) {
        return res.status(403).json({
          message: 'You have no friends. Users with no friends are not allowed to post on the public social page. Add friends to start posting!'
        });
      } else if (friendCount === 1) {
        if (postsToday >= 1) {
          return res.status(403).json({
            message: 'You have only 1 friend and have reached your posting limit of 1 post per day. Add more friends to post more!'
          });
        }
      } else if (friendCount >= 2 && friendCount <= 10) {
        if (postsToday >= 2) {
          return res.status(403).json({
            message: 'You have between 2 and 10 friends and have reached your posting limit of 2 posts per day. Add more than 10 friends for unlimited posting!'
          });
        }
      }
    } else {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Calculate start of today in IST
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      const parts = formatter.formatToParts(now);
      const year = parseInt(parts.find(p => p.type === 'year').value, 10);
      const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
      const day = parseInt(parts.find(p => p.type === 'day').value, 10);
      
      const startOfTodayIST = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const startOfToday = new Date(startOfTodayIST.getTime() - (5.5 * 60 * 60 * 1000));

      const questionsToday = await Post.countDocuments({
        user: req.user.id,
        isSocial: { $ne: true },
        createdAt: { $gte: startOfToday }
      });

      let plan = user.subscription?.plan || 'Free';
      if (user.subscription?.expiresAt && user.subscription.expiresAt < new Date()) {
        plan = 'Free';
      }

      let limit = 1;
      if (plan === 'Bronze') limit = 5;
      else if (plan === 'Silver') limit = 10;
      else if (plan === 'Gold') limit = Infinity;

      if (questionsToday >= limit) {
        return res.status(403).json({
          message: `You have reached your daily question limit of ${limit} post(s) for the ${plan} Plan. Upgrade your subscription plan in Settings to post more questions!`
        });
      }
    }

    if (!caption || !caption.trim()) {
      return res.status(400).json({ message: isSocialPost ? 'Caption is required' : 'Question title (caption) is required' });
    }

    let tagsArray = [];
    if (tags) {
      if (Array.isArray(tags)) {
        tagsArray = tags.map(t => t.trim()).filter(Boolean);
      } else if (typeof tags === 'string') {
        tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    const post = await Post.create({
      user: req.user.id,
      type: type || 'text',
      mediaUrl: mediaUrl || '',
      caption: caption.trim(),
      description: description || '',
      tags: tagsArray,
      isSocial: isSocialPost,
      upvotes: [],
      downvotes: [],
      likes: []
    });

    // Give +5 reputation for asking a question/posting
    await User.findByIdAndUpdate(req.user.id, { $inc: { reputation: 5 } });

    const populatedPost = await Post.findById(post._id).populate(
      'user',
      'username avatar reputation'
    );

    res.status(201).json(populatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts (social feed) with pagination & sorting
// @route   GET /api/posts?page=1&limit=15&sort=newest|active|votes&tag=javascript
// @access  Private
exports.getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const sort = req.query.sort || 'newest';
    const tag = req.query.tag;

    let query = {};
    if (tag) {
      query.tags = { $regex: new RegExp(`^${tag}$`, 'i') };
    }

    // Filter by social space posts
    if (req.query.isSocial !== undefined) {
      query.isSocial = req.query.isSocial === 'true';
    } else {
      query.isSocial = { $ne: true };
    }

    let sortObj = {};
    switch (sort) {
      case 'active':
        sortObj = { updatedAt: -1 };
        break;
      case 'votes':
        // Sort by number of upvotes descending (we'll use a simple sort for now)
        sortObj = { createdAt: -1 };
        break;
      case 'unanswered':
        query['comments'] = { $size: 0 };
        sortObj = { createdAt: -1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'username avatar reputation')
      .populate('comments.user', 'username avatar reputation');

    res.json({
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like or Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user.id);

    if (likeIndex > -1) {
      // Already liked, so unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like post
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json({ likes: post.likes });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to a post
// @route   POST /api/posts/:id/comment
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!req.body.text || !req.body.text.trim()) {
      return res.status(400).json({ message: 'Answer text is required' });
    }

    const newComment = {
      user: req.user.id,
      text: req.body.text.trim(),
      upvotes: [],
      downvotes: [],
    };

    post.comments.push(newComment);
    await post.save();

    // Give +5 reputation for answering
    await User.findByIdAndUpdate(req.user.id, { $inc: { reputation: 5 } });

    // Create notification for post owner
    if (post.user.toString() !== req.user.id) {
      await Notification.create({
        recipient: post.user,
        sender: req.user.id,
        type: 'comment',
        reason: `${req.user.username} answered your question "${post.caption}"`,
        isAchievement: false
      });
    }

    const updatedPost = await Post.findById(post._id)
      .populate('user', 'username avatar reputation')
      .populate('comments.user', 'username avatar reputation');

    res.json(updatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the post owner OR is an admin
    const isOwner = post.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID (increments view count)
// @route   GET /api/posts/:id
// @access  Private
exports.getPost = async (req, res, next) => {
  try {
    // Increment view count
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('user', 'username avatar reputation')
      .populate('comments.user', 'username avatar reputation');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Vote a post (upvote / downvote) with reputation tracking
// @route   POST /api/posts/:id/vote
// @access  Private
exports.votePost = async (req, res, next) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const userId = req.user.id;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Prevent self-voting
    if (post.user.toString() === userId) {
      return res.status(400).json({ message: 'You cannot vote on your own question' });
    }

    // Initialize arrays if they don't exist
    if (!post.upvotes) post.upvotes = [];
    if (!post.downvotes) post.downvotes = [];

    const upIndex = post.upvotes.indexOf(userId);
    const downIndex = post.downvotes.indexOf(userId);
    const postOwnerId = post.user.toString();

    if (voteType === 'upvote') {
      if (downIndex > -1) {
        post.downvotes.splice(downIndex, 1);
        // Restore rep lost from downvote
        await User.findByIdAndUpdate(postOwnerId, { $inc: { reputation: 2 } });
        // Clean up downvote notification
        await Notification.deleteOne({ recipient: postOwnerId, sender: userId, type: 'reputation', change: '-2' });
      }
      if (upIndex > -1) {
        // Toggle off upvote
        post.upvotes.splice(upIndex, 1);
        await User.findByIdAndUpdate(postOwnerId, { $inc: { reputation: -10 } });
        // Clean up upvote notification
        await Notification.deleteOne({ recipient: postOwnerId, sender: userId, type: 'reputation', change: '+10' });
      } else {
        // Toggle on upvote: +10 rep to post owner
        post.upvotes.push(userId);
        await User.findByIdAndUpdate(postOwnerId, { $inc: { reputation: 10 } });
        // Create upvote notification
        await Notification.create({
          recipient: postOwnerId,
          sender: userId,
          type: 'reputation',
          change: '+10',
          reason: `Upvote on your question "${post.caption}"`,
          isAchievement: true
        });
      }
    } else if (voteType === 'downvote') {
      if (upIndex > -1) {
        post.upvotes.splice(upIndex, 1);
        // Remove rep gained from upvote
        await User.findByIdAndUpdate(postOwnerId, { $inc: { reputation: -10 } });
        // Clean up upvote notification
        await Notification.deleteOne({ recipient: postOwnerId, sender: userId, type: 'reputation', change: '+10' });
      }
      if (downIndex > -1) {
        // Toggle off downvote
        post.downvotes.splice(downIndex, 1);
        await User.findByIdAndUpdate(postOwnerId, { $inc: { reputation: 2 } });
        // Clean up downvote notification
        await Notification.deleteOne({ recipient: postOwnerId, sender: userId, type: 'reputation', change: '-2' });
      } else {
        // Toggle on downvote: -2 rep to post owner
        post.downvotes.push(userId);
        await User.findByIdAndUpdate(postOwnerId, { $inc: { reputation: -2 } });
        // Create downvote notification
        await Notification.create({
          recipient: postOwnerId,
          sender: userId,
          type: 'reputation',
          change: '-2',
          reason: 'Your question received a downvote',
          isAchievement: true
        });
      }
    }

    // Synchronize likes array with upvotes for compatibility
    post.likes = post.upvotes;

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('user', 'username avatar reputation')
      .populate('comments.user', 'username avatar reputation');

    res.json(updatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Vote on an answer (comment) upvote/downvote
// @route   POST /api/posts/:id/comment/:commentId/vote
// @access  Private
exports.voteComment = async (req, res, next) => {
  try {
    const { voteType } = req.body;
    const userId = req.user.id;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Prevent self-voting
    if (comment.user.toString() === userId) {
      return res.status(400).json({ message: 'You cannot vote on your own answer' });
    }

    if (!comment.upvotes) comment.upvotes = [];
    if (!comment.downvotes) comment.downvotes = [];

    const upIdx = comment.upvotes.indexOf(userId);
    const downIdx = comment.downvotes.indexOf(userId);
    const answerOwnerId = comment.user.toString();

    if (voteType === 'upvote') {
      if (downIdx > -1) {
        comment.downvotes.splice(downIdx, 1);
        await User.findByIdAndUpdate(answerOwnerId, { $inc: { reputation: 2 } });
        // Clean up downvote notification
        await Notification.deleteOne({ recipient: answerOwnerId, sender: userId, type: 'reputation', change: '-2' });
      }
      if (upIdx > -1) {
        comment.upvotes.splice(upIdx, 1);
        await User.findByIdAndUpdate(answerOwnerId, { $inc: { reputation: -10 } });
        // Clean up upvote notification
        await Notification.deleteOne({ recipient: answerOwnerId, sender: userId, type: 'reputation', change: '+10' });
      } else {
        comment.upvotes.push(userId);
        await User.findByIdAndUpdate(answerOwnerId, { $inc: { reputation: 10 } });
        // Create upvote notification
        await Notification.create({
          recipient: answerOwnerId,
          sender: userId,
          type: 'reputation',
          change: '+10',
          reason: `Your answer on "${post.caption}" was upvoted`,
          isAchievement: true
        });
      }
    } else if (voteType === 'downvote') {
      if (upIdx > -1) {
        comment.upvotes.splice(upIdx, 1);
        await User.findByIdAndUpdate(answerOwnerId, { $inc: { reputation: -10 } });
        // Clean up upvote notification
        await Notification.deleteOne({ recipient: answerOwnerId, sender: userId, type: 'reputation', change: '+10' });
      }
      if (downIdx > -1) {
        comment.downvotes.splice(downIdx, 1);
        await User.findByIdAndUpdate(answerOwnerId, { $inc: { reputation: 2 } });
        // Clean up downvote notification
        await Notification.deleteOne({ recipient: answerOwnerId, sender: userId, type: 'reputation', change: '-2' });
      } else {
        comment.downvotes.push(userId);
        await User.findByIdAndUpdate(answerOwnerId, { $inc: { reputation: -2 } });
        // Create downvote notification
        await Notification.create({
          recipient: answerOwnerId,
          sender: userId,
          type: 'reputation',
          change: '-2',
          reason: `Your answer on "${post.caption}" received a downvote`,
          isAchievement: true
        });
      }
    }

    // Check for 5-upvote bonus dynamically
    const upvotesCount = comment.upvotes ? comment.upvotes.length : 0;
    if (upvotesCount >= 5 && !comment.bonusAwarded) {
      comment.bonusAwarded = true;
      await User.findByIdAndUpdate(answerOwnerId, { $inc: { reputation: 5 } });
      // Create bonus notification
      await Notification.create({
        recipient: answerOwnerId,
        type: 'reputation',
        change: '+5',
        reason: `Reputation bonus: Your answer on "${post.caption}" reached 5 upvotes!`,
        isAchievement: true
      });
    } else if (upvotesCount < 5 && comment.bonusAwarded) {
      comment.bonusAwarded = false;
      await User.findByIdAndUpdate(answerOwnerId, { $inc: { reputation: -5 } });
      // Remove bonus notification
      await Notification.deleteOne({ recipient: answerOwnerId, type: 'reputation', change: '+5', reason: new RegExp(post.caption, 'i') });
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('user', 'username avatar reputation')
      .populate('comments.user', 'username avatar reputation');

    res.json(updatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Accept an answer
// @route   POST /api/posts/:id/accept/:commentId
// @access  Private (only question owner)
exports.acceptAnswer = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only the question owner can accept an answer
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the question owner can accept an answer' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const answerOwnerId = comment.user.toString();

    // Toggle: if same answer is already accepted, unaccept it
    if (post.acceptedAnswer && post.acceptedAnswer.toString() === req.params.commentId) {
      post.acceptedAnswer = null;
      // Remove reputation bonus
      await User.findByIdAndUpdate(answerOwnerId, { $inc: { reputation: -15 } });
      // Remove +2 to question asker
      await User.findByIdAndUpdate(req.user.id, { $inc: { reputation: -2 } });

      // Clean up notifications
      await Notification.deleteOne({ recipient: answerOwnerId, type: 'reputation', change: '+15', reason: new RegExp(post.caption, 'i') });
      await Notification.deleteOne({ recipient: req.user.id, type: 'reputation', change: '+2', reason: new RegExp(post.caption, 'i') });
    } else {
      // If another answer was previously accepted, remove its reputation & notification
      if (post.acceptedAnswer) {
        const prevAccepted = post.comments.id(post.acceptedAnswer);
        if (prevAccepted) {
          await User.findByIdAndUpdate(prevAccepted.user.toString(), { $inc: { reputation: -15 } });
          await Notification.deleteOne({ recipient: prevAccepted.user.toString(), type: 'reputation', change: '+15', reason: new RegExp(post.caption, 'i') });
        }
      }

      post.acceptedAnswer = comment._id;
      // +15 rep to answer owner
      await User.findByIdAndUpdate(answerOwnerId, { $inc: { reputation: 15 } });
      // +2 rep to question asker for accepting
      await User.findByIdAndUpdate(req.user.id, { $inc: { reputation: 2 } });

      // Create notifications
      await Notification.create({
        recipient: answerOwnerId,
        type: 'reputation',
        change: '+15',
        reason: `Your answer on "${post.caption}" was accepted`,
        isAchievement: true
      });

      await Notification.create({
        recipient: req.user.id,
        type: 'reputation',
        change: '+2',
        reason: `You accepted an answer on your question "${post.caption}"`,
        isAchievement: true
      });

      // Award Scholar Badge if this is their first time accepting an answer
      const acceptedCount = await Post.countDocuments({ user: req.user.id, acceptedAnswer: { $ne: null } });
      if (acceptedCount === 0) {
        await Notification.create({
          recipient: req.user.id,
          type: 'badge',
          badgeClass: 'bronze',
          badgeName: 'Scholar',
          reason: 'Earned Scholar badge: Asked a question and accepted an answer',
          isAchievement: true
        });
      }
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('user', 'username avatar reputation')
      .populate('comments.user', 'username avatar reputation');

    res.json(updatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle bookmark/save a post
// @route   POST /api/posts/:id/bookmark
// @access  Private
exports.toggleBookmark = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(userId);
    const savedIndex = user.savedPosts.indexOf(postId);

    if (savedIndex > -1) {
      user.savedPosts.splice(savedIndex, 1);
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();
    res.json({ savedPosts: user.savedPosts, isBookmarked: savedIndex === -1 });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment from a post
// @route   DELETE /api/posts/:id/comment/:comment_id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Find comment
    const comment = post.comments.id(req.params.comment_id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check owner
    const isCommentOwner = comment.user.toString() === req.user.id;
    const isPostOwner = post.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCommentOwner && !isPostOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // If this was the accepted answer, clear it and deduct points
    const commentOwnerId = comment.user.toString();
    let repToDeduct = 5; // Base points for answering

    if (comment.upvotes) {
      repToDeduct += comment.upvotes.length * 10;
    }
    if (comment.downvotes) {
      repToDeduct -= comment.downvotes.length * 2;
    }
    if (comment.bonusAwarded) {
      repToDeduct += 5;
    }

    if (post.acceptedAnswer && post.acceptedAnswer.toString() === req.params.comment_id) {
      post.acceptedAnswer = null;
      repToDeduct += 15; // Deduct accepted answer points from answer owner
      // Deduct +2 from question owner (post owner) for accepting
      await User.findByIdAndUpdate(post.user.toString(), { $inc: { reputation: -2 } });
    }

    // Deduct total reputation from answer owner
    await User.findByIdAndUpdate(commentOwnerId, { $inc: { reputation: -repToDeduct } });

    comment.deleteOne();
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('user', 'username avatar reputation')
      .populate('comments.user', 'username avatar reputation');

    res.json(updatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Search posts
// @route   GET /api/posts/search?q=...&tags=...
// @access  Private
exports.searchPosts = async (req, res, next) => {
  try {
    const { q, tags } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;

    let query = {};

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      query.$or = [
        { caption: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagArray.length > 0) {
        query.tags = { $in: tagArray.map(t => new RegExp(`^${t}$`, 'i')) };
      }
    }

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'username avatar reputation')
      .populate('comments.user', 'username avatar reputation');

    res.json({
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregated tags with counts
// @route   GET /api/tags
// @access  Private
exports.getTags = async (req, res, next) => {
  try {
    const tags = await Post.aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: { $toLower: '$tags' },
          name: { $first: '$tags' },
          count: { $sum: 1 },
          latestPost: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(tags);
  } catch (error) {
    next(error);
  }
};

// @desc    Increment shares count
// @route   POST /api/posts/:id/share
// @access  Private
exports.sharePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { sharesCount: 1 } },
      { new: true }
    );
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({ sharesCount: post.sharesCount || 0 });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular/trending questions for sidebar
// @route   GET /api/posts/popular
// @access  Private
exports.getPopularQuestions = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // Use aggregation to rank by engagement score
    const popular = await Post.aggregate([
      { $match: { isSocial: { $ne: true } } },
      {
        $addFields: {
          score: {
            $add: [
              { $size: { $ifNull: ['$upvotes', []] } },
              { $multiply: [{ $size: { $ifNull: ['$comments', []] } }, 2] },
              { $ifNull: ['$views', 0] },
              { $multiply: [{ $size: { $ifNull: ['$likes', []] } }, 1.5] }
            ]
          }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          caption: 1,
          tags: 1,
          score: 1,
          upvotes: { $size: { $ifNull: ['$upvotes', []] } },
          comments: { $size: { $ifNull: ['$comments', []] } },
          views: 1,
          createdAt: 1,
          'user.username': 1,
          'user.avatar': 1
        }
      }
    ]);

    res.json(popular);
  } catch (error) {
    next(error);
  }
};

// @desc    Get global stats for verified users, questions, and tags
// @route   GET /api/posts/global-stats
// @access  Private
exports.getGlobalStats = async (req, res, next) => {
  try {
    const verifiedUsersCount = await User.countDocuments({ isBlocked: { $ne: true } });
    const questionsCount = await Post.countDocuments({ isSocial: { $ne: true } });
    const uniqueTags = await Post.distinct('tags', { isSocial: { $ne: true } });
    const tagsCount = uniqueTags.length;

    res.json({
      verifiedUsers: verifiedUsersCount,
      questionsPosted: questionsCount,
      tagCollectives: tagsCount
    });
  } catch (error) {
    next(error);
  }
};

