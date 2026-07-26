const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [
        function () {
          return !this.googleId;
        },
        'Please add a password',
      ],
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    reputation: {
      type: Number,
      default: 1,
    },
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },
    phoneVerificationCode: {
      type: String,
    },
    phoneVerificationExpires: {
      type: Date,
    },
    refreshToken: {
      type: String,
      default: '',
    },
    lastForgotPasswordRequest: {
      type: Date,
    },
    language: {
      type: String,
      enum: ['en', 'es', 'hi', 'pt', 'zh', 'fr'],
      default: 'en',
    },
    tempLanguageSwapCode: {
      type: String,
    },
    tempLanguageSwapExpires: {
      type: Date,
    },
    tempLanguageSwapTarget: {
      type: String,
    },
    loginOtpCode: {
      type: String,
    },
    loginOtpExpires: {
      type: Date,
    },
    loginHistory: [
      {
        browser: { type: String },
        os: { type: String },
        device: { type: String },
        ipAddress: { type: String },
        loginTime: { type: Date, default: Date.now }
      }
    ],
    subscription: {
      plan: {
        type: String,
        enum: ['Free', 'Bronze', 'Silver', 'Gold'],
        default: 'Free'
      },
      expiresAt: {
        type: Date
      },
      paymentTime: {
        type: Date
      }
    }
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password to hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexes for performance optimization
UserSchema.index({ friends: 1 });
UserSchema.index({ lastForgotPasswordRequest: 1 });

module.exports = mongoose.model('User', UserSchema);
