const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendOTPEmail, sendPasswordResetEmail, sendLoginOTPEmail } = require('../utils/sendEmail');
const { sendSMS } = require('../utils/sendSMS');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'overflowx_jwt_secret_token_key_12345';

// Helper: Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper: Generate Access Token (short-lived)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '15m' });
};

// Helper: Generate Refresh Token (long-lived)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// Helper: Detect browser, OS, device and IP address from request headers
const detectEnvironment = (req) => {
  const ua = req.headers['user-agent'] || '';
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  if (ip === '::1') {
    ip = '127.0.0.1';
  }

  let browser = 'Other Browser';
  if (/edg(e)?|msie|trident/i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/i.test(ua)) {
    browser = 'Safari';
  }

  let os = 'Other OS';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';

  let device = 'desktop';
  if (/mobi|tablet|ipad|iphone|android/i.test(ua)) {
    device = 'mobile';
  } else {
    if (req.body.deviceType === 'laptop') {
      device = 'laptop';
    } else if (req.body.deviceType === 'desktop') {
      device = 'desktop';
    } else {
      device = 'laptop'; // Heuristic fallback for non-mobile OS
    }
  }

  return { browser, os, device, ipAddress: ip };
};

// Helper: Check if login from a mobile device is within 10:00 AM - 1:00 PM IST
const isMobileLoginAllowed = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);
  const currentMinutes = (hour * 60) + minute;

  const start = 10 * 60; // 10:00 AM
  const end = 13 * 60;   // 1:00 PM
  return currentMinutes >= start && currentMinutes <= end;
};

// Helper: Extract refresh token from cookies
const getRefreshToken = (req) => {
  if (req.cookies && req.cookies.refreshToken) {
    return req.cookies.refreshToken;
  }
  if (req.headers.cookie) {
    const rawCookies = req.headers.cookie.split('; ');
    for (const c of rawCookies) {
      const [name, val] = c.split('=');
      if (name === 'refreshToken') return val;
    }
  }
  return null;
};

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    let { username, email, phone, password } = req.body;
    if (username) username = username.trim();
    if (email) email = email.trim().toLowerCase();
    if (phone) {
      phone = phone.trim().replace(/\s+/g, '');
      if (!phone.startsWith('+')) {
        if (phone.length === 10) {
          phone = '+91' + phone;
        } else if (phone.startsWith('91') && phone.length === 12) {
          phone = '+' + phone;
        }
      }
    }

    // Check if username, email, or phone already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Display name is already registered. Please choose another display name or log in.' });
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number is already registered. Please log in.' });
      }
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email address is already registered. Please log in.' });
    }

    // Generate simple 6-digit OTPs
    const emailOtp = generateOTP();
    const phoneOtp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Determine role (first user is admin, else user)
    const isFirstUser = (await User.countDocuments({})) === 0;
    const role = isFirstUser ? 'admin' : 'user';

    // Create User
    const user = await User.create({
      username,
      email,
      phone: phone || undefined,
      password,
      role,
      emailVerificationCode: emailOtp,
      emailVerificationExpires: otpExpiry,
      phoneVerificationCode: phoneOtp,
      phoneVerificationExpires: otpExpiry,
      isEmailVerified: false,
      isPhoneVerified: false,
    });

    // Send email verification OTP in the background to avoid blocking
    sendOTPEmail(email, emailOtp, username)
      .catch(err => process.env.NODE_ENV !== 'production' && console.error('[Resend Error] Registration email failed:', err));

    // Send SMS verification OTP if phone is provided in the background
    if (phone) {
      sendSMS(phone, `Your OverflowX phone verification code is: ${phoneOtp}`)
        .catch(err => process.env.NODE_ENV !== 'production' && console.error('[Twilio Error] Registration SMS failed:', err));
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Detect environment and track initial login history
    const env = detectEnvironment(req);
    user.loginHistory.push({
      browser: env.browser,
      os: env.os,
      device: env.device,
      ipAddress: env.ipAddress,
      loginTime: new Date()
    });

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    const responseData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      reputation: user.reputation || 1,
      savedPosts: user.savedPosts || [],
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      language: user.language,
      avatar: user.avatar || '',
      token: accessToken,
    };

    res.status(201).json(responseData);

    res.status(201).json(responseData);
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    let { email, password, rememberMe } = req.body;
    if (email) email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'This account has been suspended' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Detect environment
    const env = detectEnvironment(req);

    // Mobile check
    if (env.device === 'mobile') {
      if (!isMobileLoginAllowed()) {
        return res.status(403).json({
          message: 'Access restricted. Mobile logins are only allowed between 10:00 AM and 1:00 PM IST.'
        });
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Track login history
    user.loginHistory.push({
      browser: env.browser,
      os: env.os,
      device: env.device,
      ipAddress: env.ipAddress,
      loginTime: new Date()
    });

    if (user.loginHistory.length > 50) {
      user.loginHistory.shift();
    }

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookie expiry
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days vs 1 day

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      reputation: user.reputation || 1,
      savedPosts: user.savedPosts || [],
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      language: user.language,
      avatar: user.avatar || '',
      token: accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const token = getRefreshToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: 'Token is invalid or revoked' });
    }

    // Generate new pair
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      token: newAccessToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        language: user.language,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const token = getRefreshToken(req);
    if (token) {
      const user = await User.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = '';
        await user.save();
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Email OTP
// @route   POST /api/auth/verify-email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    if (!user.emailVerificationCode || user.emailVerificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        language: user.language,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Phone OTP
// @route   POST /api/auth/verify-phone
exports.verifyPhone = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({ message: 'Phone number is already verified' });
    }

    if (!user.phoneVerificationCode || user.phoneVerificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.phoneVerificationExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    user.isPhoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save();

    res.json({
      message: 'Phone number verified successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        language: user.language,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend Email OTP
// @route   POST /api/auth/resend-email
exports.resendEmailCode = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const code = generateOTP();
    user.emailVerificationCode = code;
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Send email verification OTP in the background
    sendOTPEmail(user.email, code, user.username)
      .catch(err => process.env.NODE_ENV !== 'production' && console.error('[Resend Error] Resend verification email failed:', err));

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV ONLY] Resent Email OTP: ${code}`);
    }

    const responseData = {
      message: 'Verification code sent to your email',
    };
    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

// @desc    Resend Phone OTP
// @route   POST /api/auth/resend-phone
exports.resendPhoneCode = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const code = generateOTP();
    user.phoneVerificationCode = code;
    user.phoneVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    if (user.phone) {
      sendSMS(user.phone, `Your OverflowX phone verification code is: ${code}`)
        .catch(err => process.env.NODE_ENV !== 'production' && console.error('[Twilio Error] Resend SMS failed:', err));
    }

    const responseData = {
      message: 'Verification code sent via SMS',
    };
    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

// @desc    Update Contact Details
// @route   POST /api/auth/update-contacts
exports.updateVerificationContacts = async (req, res, next) => {
  try {
    let { email, phone } = req.body;
    if (email) email = email.trim().toLowerCase();
    if (phone) {
      phone = phone.trim().replace(/\s+/g, '');
      if (!phone.startsWith('+')) {
        if (phone.length === 10) {
          phone = '+91' + phone;
        } else if (phone.startsWith('91') && phone.length === 12) {
          phone = '+' + phone;
        }
      }
    }
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if new details belong to someone else
    const filter = [];
    if (email && email !== user.email) filter.push({ email });
    if (phone && phone !== user.phone) filter.push({ phone });

    if (filter.length > 0) {
      const exists = await User.findOne({ $or: filter, _id: { $ne: user._id } });
      if (exists) {
        return res.status(400).json({ message: 'Email or phone number already in use' });
      }
    }

    const pendingOtp = {};
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    let emailChanged = false;

    if (email && (email !== user.email || !user.isEmailVerified)) {
      user.email = email;
      user.isEmailVerified = false;
      user.emailVerificationCode = generateOTP();
      user.emailVerificationExpires = expiry;
      pendingOtp.emailOtp = user.emailVerificationCode;
      emailChanged = true;
    }

    if (phone && (phone !== user.phone || !user.isPhoneVerified)) {
      user.phone = phone;
      user.isPhoneVerified = false;
      user.phoneVerificationCode = generateOTP();
      user.phoneVerificationExpires = expiry;
      pendingOtp.phoneOtp = user.phoneVerificationCode;
    }

    await user.save();

    // Send email verification OTP if updated in the background
    if (emailChanged) {
      sendOTPEmail(user.email, user.emailVerificationCode, user.username)
        .catch(err => process.env.NODE_ENV !== 'production' && console.error('[Resend Error] Update verification email failed:', err));
    }

    // Send SMS verification OTP if phone was updated in the background
    if (pendingOtp.phoneOtp && user.phone) {
      sendSMS(user.phone, `Your OverflowX phone verification code is: ${pendingOtp.phoneOtp}`)
        .catch(err => process.env.NODE_ENV !== 'production' && console.error('[Twilio Error] Update SMS failed:', err));
    }

    const responseData = {
      message: 'Contact details updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        language: user.language,
      }
    };

    res.json(responseData);

    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      'username email phone role isEmailVerified isPhoneVerified avatar bio language reputation savedPosts createdAt'
    );
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password - Reset password with email/phone
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    let { emailOrPhone } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({ message: 'Please provide registered email address or phone number' });
    }

    emailOrPhone = emailOrPhone.trim();
    if (emailOrPhone.includes('@')) {
      emailOrPhone = emailOrPhone.toLowerCase();
    } else {
      emailOrPhone = emailOrPhone.replace(/\s+/g, '');
      if (!emailOrPhone.startsWith('+')) {
        if (emailOrPhone.length === 10) {
          emailOrPhone = '+91' + emailOrPhone;
        } else if (emailOrPhone.startsWith('91') && emailOrPhone.length === 12) {
          emailOrPhone = '+' + emailOrPhone;
        }
      }
    }

    // Search for user by email or phone
    const user = await User.findOne({
      $or: [
        { email: emailOrPhone },
        { phone: emailOrPhone }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'No user found with this email or phone number' });
    }

    // Rate Limit Check: once per day (24 hours check)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (user.lastForgotPasswordRequest && user.lastForgotPasswordRequest > oneDayAgo) {
      return res.status(400).json({ message: 'You can use this option only one time per day.' });
    }

    // Generate random password: uppercase and lowercase letters only
    const generateLettersOnlyPassword = (length = 10) => {
      const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      return result;
    };

    const tempPassword = generateLettersOnlyPassword(10);

    // Save user password (which will be automatically hashed by pre-save hook)
    user.password = tempPassword;
    user.lastForgotPasswordRequest = new Date();
    await user.save();

    // Trigger email send in the background if user has email
    if (user.email) {
      sendPasswordResetEmail(user.email, tempPassword, user.username)
        .catch(err => process.env.NODE_ENV !== 'production' && console.error('[Resend Error] Password reset email failed:', err));
    }

    // Log the generated password to server console for testing/verification
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n=========================================');
      console.log(`[PASSWORD RESET] For user: ${user.username}`);
      console.log(`New generated password: ${tempPassword}`);
      console.log('=========================================\n');
    }

    const responseData = {
      message: 'Your password has been successfully reset. The new password has been sent to your registered email/phone number.',
    };
    if (process.env.NODE_ENV !== 'production') {
      responseData.tempPassword = tempPassword;
    }
    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

// @desc    Update Password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new passwords' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password does not match' });
    }

    // Set new password (will be hashed automatically by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Request Language Change OTP
// @route   POST /api/auth/language/request
// @access  Private
exports.requestLanguageChange = async (req, res, next) => {
  try {
    const { language } = req.body;
    const supportedLanguages = ['en', 'es', 'hi', 'pt', 'zh', 'fr'];

    if (!language || !supportedLanguages.includes(language)) {
      return res.status(400).json({ message: 'Please provide a valid supported language' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate code
    const otpCode = generateOTP();
    user.tempLanguageSwapCode = otpCode;
    user.tempLanguageSwapExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    user.tempLanguageSwapTarget = language;
    await user.save();

    if (language === 'fr' || !user.phone) {
      // Send OTP to email in the background
      sendOTPEmail(user.email, otpCode, user.username)
        .catch(err => console.error('[Resend Error] Language change email failed:', err));
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n[EMAIL GATEWAY] Sent Language Swap OTP to ${user.email} for switching to ${language}: ${otpCode}\n`);
      }
    } else {
      // Authenticate via mobile number (send OTP to registered mobile number)
      sendSMS(user.phone, `Your OverflowX verification code for switching language to ${language.toUpperCase()} is: ${otpCode}`)
        .catch(err => console.error('[Twilio Error] Language change SMS failed:', err));
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n[SMS GATEWAY] Sent Language Swap OTP to ${user.phone} for switching to ${language}: ${otpCode}\n`);
      }
    }

    res.json({
      message: `Verification code sent. Code expires in 15 minutes.`,
      _devOtp: otpCode, // Include for dev-testing convenience
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Language Change OTP and apply
// @route   POST /api/auth/language/verify
// @access  Private
exports.verifyLanguageChange = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.tempLanguageSwapCode || user.tempLanguageSwapCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.tempLanguageSwapExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Apply language update
    user.language = user.tempLanguageSwapTarget;
    user.tempLanguageSwapCode = undefined;
    user.tempLanguageSwapExpires = undefined;
    user.tempLanguageSwapTarget = undefined;
    await user.save();

    res.json({
      message: 'Language updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        language: user.language,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Google token is missing' });
    }

    // Fetch user info from Google using the access token
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!googleResponse.ok) {
      return res.status(401).json({ message: 'Invalid Google access token' });
    }

    const payload = await googleResponse.json();
    const { email, name, picture, sub: googleId, email_verified } = payload;

    if (!email_verified) {
      return res.status(403).json({ message: 'Google email is not verified.' });
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : '';

    // Check if user exists by email or googleId
    let user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { googleId }
      ]
    });

    let isExistingAccount = false;

    if (user) {
      isExistingAccount = true;
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        updated = true;
      }
      if (picture && (!user.avatar || user.avatar === '')) {
        user.avatar = picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }

      if (user.isBlocked) {
        return res.status(403).json({ message: 'This account has been suspended' });
      }
    } else {
      // Determine role (first user is admin, else user)
      const isFirstUser = (await User.countDocuments({})) === 0;
      const role = isFirstUser ? 'admin' : 'user';

      // Ensure unique username
      let baseUsername = (name || 'user').replace(/\s+/g, '').toLowerCase();
      if (!baseUsername) baseUsername = 'user';
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }

      // Create new user without password
      user = await User.create({
        username: uniqueUsername,
        email: normalizedEmail,
        googleId,
        avatar: picture || '',
        role,
        isEmailVerified: true,
      });
    }

    // Detect environment
    const env = detectEnvironment(req);

    // Mobile check
    if (env.device === 'mobile') {
      if (!isMobileLoginAllowed()) {
        return res.status(403).json({
          message: 'Access restricted. Mobile logins are only allowed between 10:00 AM and 1:00 PM IST.'
        });
      }
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Track login history
    user.loginHistory.push({
      browser: env.browser,
      os: env.os,
      device: env.device,
      ipAddress: env.ipAddress,
      loginTime: new Date()
    });

    if (user.loginHistory.length > 50) {
      user.loginHistory.shift();
    }

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      reputation: user.reputation || 1,
      savedPosts: user.savedPosts || [],
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      language: user.language,
      avatar: user.avatar || '',
      token: accessToken,
      isExistingAccount,
      message: isExistingAccount
        ? `Account already exists for ${user.email}. Logged in successfully!`
        : `Welcome to OverflowX, ${user.username}!`
    });
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ message: error.message || 'Google Login failed due to server error' });
  }
};

// @desc    Verify OTP for Google Chrome Login
// @route   POST /api/auth/login/verify-otp
// @access  Public
exports.verifyLoginOtp = async (req, res, next) => {
  try {
    const { email, rememberMe } = req.body;
    const otpCode = req.body.otpCode || req.body.otp;

    if (!email || !otpCode) {
      return res.status(400).json({ message: 'Please provide email and OTP code' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'This account has been suspended' });
    }

    // Verify OTP
    if (!user.loginOtpCode || user.loginOtpCode !== otpCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (new Date() > user.loginOtpExpires) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Detect environment
    const env = detectEnvironment(req);

    // Re-verify mobile login restrictions
    if (env.device === 'mobile') {
      if (!isMobileLoginAllowed()) {
        return res.status(403).json({
          message: 'Access restricted. Mobile logins are only allowed between 10:00 AM and 1:00 PM IST.'
        });
      }
    }

    // Clear OTP fields
    user.loginOtpCode = undefined;
    user.loginOtpExpires = undefined;

    // Track login history
    user.loginHistory.push({
      browser: env.browser,
      os: env.os,
      device: env.device,
      ipAddress: env.ipAddress,
      loginTime: new Date()
    });

    if (user.loginHistory.length > 50) {
      user.loginHistory.shift();
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      language: user.language,
      avatar: user.avatar || '',
      token: accessToken,
    });
  } catch (error) {
    next(error);
  }
};
