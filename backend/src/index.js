const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Connect to Database
connectDB();

const app = express();

// Trust proxy settings for Render / reverse proxies (express-rate-limit requirement)
app.set('trust proxy', 1);

// Standard Middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://overflowx-community-learning-frontend.onrender.com',
  'https://overflowx.anshuman892494.online',
  'https://www.overflowx.anshuman892494.online'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    const url = origin.toLowerCase();
    const isAllowed = allowedOrigins.includes(origin) ||
                      url.endsWith('.onrender.com') ||
                      url.endsWith('.vercel.app') ||
                      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) ||
                      (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL));

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Log requests
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${req.method} ${req.originalUrl}`);
  }
  next();
});

// Import rate limiters
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');
const usersRoutes = require('./routes/users.routes');
const subscriptionRoutes = require('./routes/subscription.routes');

// Use rate limiters & routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/posts', apiLimiter, postRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/subscriptions', apiLimiter, subscriptionRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'OverflowX API Server is running successfully!' });
});

// Ping endpoint for keep-alive monitoring
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is Active' });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  }
});

// Self-ping service to prevent Render free-tier instance sleeping (pings every 10 mins)
const SELF_PING_INTERVAL = 10 * 60 * 1000;
setInterval(async () => {
  try {
    const targetUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    await fetch(`${targetUrl}/ping`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Keep-Alive] Self-pinged ${targetUrl}/ping successfully.`);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Keep-Alive] Self-ping failed:', err.message);
    }
  }
}, SELF_PING_INTERVAL);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
});
