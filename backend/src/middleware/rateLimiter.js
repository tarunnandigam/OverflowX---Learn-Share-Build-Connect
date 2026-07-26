const rateLimit = require('express-rate-limit');

// General API rate limiter: max 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

// Authentication rate limiter: max 10 requests per 15 minutes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login or registration attempts. Please try again after 15 minutes'
  }
});

module.exports = { apiLimiter, authLimiter };
