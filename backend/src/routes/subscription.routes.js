const express = require('express');
const router = express.Router();
const { createCheckoutSession, verifySubscription, getSubscriptionUsage } = require('../controllers/subscription.controller');
const { protect } = require('../middleware/auth');

router.post('/checkout', protect, createCheckoutSession);
router.post('/verify', protect, verifySubscription);
router.get('/usage', protect, getSubscriptionUsage);

module.exports = router;
