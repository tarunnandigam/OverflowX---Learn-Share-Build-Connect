const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  logout,
  refreshToken,
  getMe,
  verifyEmail,
  verifyPhone,
  resendEmailCode,
  resendPhoneCode,
  updateVerificationContacts,
  forgotPassword,
  updatePassword,
  requestLanguageChange,
  verifyLanguageChange,
  verifyLoginOtp,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/login/verify-otp', verifyLoginOtp);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Contact Submission] ${name} (${email}) - Subject: ${subject}\nMessage: ${message}`);
  }
  res.json({ message: 'Thank you! Your inquiry has been received. Our support team will get back to you shortly.' });
});

// Protected routes (requires valid access token)
router.get('/me', protect, getMe);
router.post('/verify-email', protect, verifyEmail);
router.post('/verify-phone', protect, verifyPhone);
router.post('/resend-email', protect, resendEmailCode);
router.post('/resend-phone', protect, resendPhoneCode);
router.post('/update-contacts', protect, updateVerificationContacts);
router.put('/update-password', protect, updatePassword);
router.post('/language/request', protect, requestLanguageChange);
router.post('/language/verify', protect, verifyLanguageChange);

module.exports = router;
