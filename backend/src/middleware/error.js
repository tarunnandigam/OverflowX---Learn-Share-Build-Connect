const fs = require('fs');
const path = require('path');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack || err);
  }

  // Log to error.log file for inspection
  try {
    const logPath = path.join(__dirname, '../../error.log');
    const logMsg = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}\n${err.stack || err}\n\n`;
    fs.appendFileSync(logPath, logMsg);
  } catch (logErr) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to write to error.log', logErr);
    }
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({ message });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return res.status(400).json({ message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    return res.status(400).json({ message });
  }

  res.status(err.statusCode || 500).json({
    message: error.message || 'Server Error',
  });
};

module.exports = errorHandler;
