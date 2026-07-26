const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify JWT token
const protect = async (req, res, next) => {
  // Early return if no Authorization header
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    // Get token from header
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    // Ensure JWT_SECRET is configured — never use a hardcoded fallback
    if (!process.env.JWT_SECRET) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('FATAL: JWT_SECRET environment variable is not set!');
      }
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token, exclude password
    req.user = await User.findById(decoded.id).select('+role');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    if (req.user.isBlocked) {
      return res.status(403).json({ message: 'User account is suspended' });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Admin middleware for role validation
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// Optional protect middleware - decode token if present, but do not block request if invalid/absent
const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('+role');
        if (user && !user.isBlocked) {
          req.user = user;
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Optional auth token verification failed:', error.message);
      }
    }
  }
  next();
};

module.exports = { protect, admin, optionalProtect };
