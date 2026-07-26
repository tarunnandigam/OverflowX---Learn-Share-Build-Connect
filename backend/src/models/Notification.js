const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['reputation', 'badge', 'system', 'comment'],
      required: true,
    },
    change: {
      type: String,
      default: '',
    },
    badgeClass: {
      type: String,
      enum: ['gold', 'silver', 'bronze', ''],
      default: '',
    },
    badgeName: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    isAchievement: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
NotificationSchema.index({ recipient: 1, isAchievement: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
