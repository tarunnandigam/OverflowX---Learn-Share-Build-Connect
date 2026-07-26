const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @desc    Get user profile by username
// @route   GET /api/users/:username
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -emailVerificationCode -phoneVerificationCode -refreshToken')
      .populate('friends', 'username avatar bio');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isOwnProfile = req.user && user._id.toString() === req.user.id.toString();
    const userObj = user.toObject();

    // Attach public lastSeenTime (the time of the most recent login)
    if (user.loginHistory && user.loginHistory.length > 0) {
      userObj.lastSeenTime = user.loginHistory[user.loginHistory.length - 1].loginTime;
    } else {
      userObj.lastSeenTime = user.updatedAt; // fallback
    }

    // Calculate total unique days visited from loginHistory
    let visitedDaysCount = 1;
    if (user.loginHistory && user.loginHistory.length > 0) {
      const uniqueDays = new Set(
        user.loginHistory.map(log => new Date(log.loginTime).toDateString())
      );
      visitedDaysCount = uniqueDays.size;
    }
    userObj.visitedDaysCount = visitedDaysCount;

    if (!isOwnProfile) {
      delete userObj.loginHistory;
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar reputation')
      .populate('comments.user', 'username avatar reputation');

    // Dynamic stats calculations
    const questionsCount = await Post.countDocuments({
      user: user._id,
      isSocial: { $ne: true }
    });

    const allPostsWithUserComments = await Post.find({ 'comments.user': user._id });
    let answersCount = 0;
    allPostsWithUserComments.forEach(p => {
      p.comments.forEach(c => {
        if (c.user && c.user.toString() === user._id.toString()) {
          answersCount++;
        }
      });
    });

    const ownQuestions = await Post.find({ user: user._id, isSocial: { $ne: true } });
    const ownQuestionsViews = ownQuestions.reduce((acc, p) => acc + (p.views || 0), 0);
    const answeredQuestionsViews = allPostsWithUserComments
      .filter(p => p.user.toString() !== user._id.toString())
      .reduce((acc, p) => acc + (p.views || 0), 0);

    const reachedCount = ownQuestionsViews + answeredQuestionsViews;

    userObj.questionsCount = questionsCount;
    userObj.answersCount = answersCount;
    userObj.reachedCount = reachedCount;

    res.json({ user: userObj, posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { avatar, coverImage, bio } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (avatar !== undefined) user.avatar = avatar;
    if (coverImage !== undefined) user.coverImage = coverImage;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      reputation: user.reputation,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      language: user.language,
      avatar: user.avatar,
      coverImage: user.coverImage,
      bio: user.bio
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select('-password -emailVerificationCode -phoneVerificationCode -refreshToken')
      .populate('friends', 'username avatar bio')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle friend status (add/remove)
// @route   POST /api/users/:id/friend
// @access  Private
exports.toggleFriend = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'You cannot friend yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize friends array if they don't exist
    if (!currentUser.friends) currentUser.friends = [];
    if (!targetUser.friends) targetUser.friends = [];

    const isAlreadyFriend = currentUser.friends.includes(targetUserId);

    if (isAlreadyFriend) {
      // Remove connection (mutual)
      currentUser.friends = currentUser.friends.filter(id => id.toString() !== targetUserId);
      targetUser.friends = targetUser.friends.filter(id => id.toString() !== currentUserId);
    } else {
      // Add connection (mutual)
      currentUser.friends.push(targetUserId);
      targetUser.friends.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      message: isAlreadyFriend ? 'Friend removed successfully' : 'Friend added successfully',
      isFriend: !isAlreadyFriend,
      friendsCount: currentUser.friends.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Transfer points to another user
// @route   POST /api/users/:id/transfer-points
// @access  Private
exports.transferPoints = async (req, res, next) => {
  try {
    const { points } = req.body;
    const senderId = req.user.id;
    const receiverId = req.params.id;

    // Validate points
    const transferAmount = parseInt(points, 10);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid positive number of points to transfer' });
    }

    // Cannot transfer to yourself
    if (senderId === receiverId) {
      return res.status(400).json({ message: 'You cannot transfer points to yourself' });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check: sender must have MORE than 10 points
    if (sender.reputation <= 10) {
      return res.status(403).json({
        message: 'You need more than 10 points to transfer. Your current points: ' + sender.reputation
      });
    }

    // Cannot transfer more than sender has
    if (transferAmount > sender.reputation) {
      return res.status(400).json({
        message: 'Insufficient points. Your current balance: ' + sender.reputation
      });
    }

    // Perform transfer
    sender.reputation -= transferAmount;
    receiver.reputation += transferAmount;

    await sender.save();
    await receiver.save();

    res.json({
      message: `Successfully transferred ${transferAmount} points to ${receiver.username}`,
      senderReputation: sender.reputation,
      receiverReputation: receiver.reputation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user notifications and achievements
// @route   GET /api/users/notifications
// @access  Private
exports.getUserNotifications = async (req, res, next) => {
  try {
    let notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 });

    // Seed mock/historical data if there are no notifications for this user yet
    if (notifications.length === 0) {
      const user = await User.findById(req.user.id);
      if (user) {
        const seededList = [];
        const now = Date.now();

        // 1. Check if user is eligible for Gold/Silver/Bronze badges based on their rep
        const rep = user.reputation || 1;
        if (rep >= 500) {
          seededList.push({
            recipient: user._id,
            type: 'badge',
            badgeClass: 'gold',
            badgeName: 'Gold Badge Holder',
            reason: 'Earned Gold Badge for reaching 500+ reputation points!',
            isAchievement: true,
            read: true,
            createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000)
          });
        }
        if (rep >= 100) {
          seededList.push({
            recipient: user._id,
            type: 'badge',
            badgeClass: 'silver',
            badgeName: 'Silver Badge Holder',
            reason: 'Earned Silver Badge for reaching 100+ reputation points!',
            isAchievement: true,
            read: true,
            createdAt: new Date(now - 15 * 24 * 60 * 60 * 1000)
          });
        }
        if (rep >= 25) {
          seededList.push({
            recipient: user._id,
            type: 'badge',
            badgeClass: 'bronze',
            badgeName: 'Bronze Badge Holder',
            reason: 'Earned Bronze Badge for reaching 25+ reputation points!',
            isAchievement: true,
            read: true,
            createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000)
          });
        }

        // 2. Check if they have accepted any answers. If so, seed the Scholar badge
        const hasAccepted = await Post.findOne({ user: user._id, acceptedAnswer: { $ne: null } });
        if (hasAccepted) {
          seededList.push({
            recipient: user._id,
            type: 'badge',
            badgeClass: 'bronze',
            badgeName: 'Scholar',
            reason: 'Earned Scholar badge: Asked a question and accepted an answer',
            isAchievement: true,
            read: true,
            createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000)
          });
        }

        // 3. Add default mock achievements (matching user screenshot)
        seededList.push(
          {
            recipient: user._id,
            type: 'reputation',
            change: '+10',
            reason: 'Upvote on your question "How to perfectly align a div using Tailwind CSS?"',
            isAchievement: true,
            read: false,
            createdAt: new Date(now - 3 * 60 * 60 * 1000) // 3 hours ago
          },
          {
            recipient: user._id,
            type: 'reputation',
            change: '+15',
            reason: 'Your answer on "Best practices for React directory structure in 2026" was accepted',
            isAchievement: true,
            read: true,
            createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000) // 4 days ago
          },
          {
            recipient: user._id,
            type: 'reputation',
            change: '-2',
            reason: 'Your question received a downvote',
            isAchievement: true,
            read: true,
            createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000) // 1 week ago
          }
        );

        // Save seeded notifications to database
        notifications = await Notification.insertMany(seededList);
        // Sort after inserting
        notifications.sort((a, b) => b.createdAt - a.createdAt);
      }
    }

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/users/notifications/read
// @access  Private
exports.markNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle notification read status
// @route   PUT /api/users/notifications/:id/read
// @access  Private
exports.toggleNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = !notification.read;
    await notification.save();

    res.json(notification);
  } catch (error) {
    next(error);
  }
};

