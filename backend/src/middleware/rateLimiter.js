const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Auth routes rate limiter (login, register)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset attempts per hour
  message: 'Too many password reset attempts, please try again later.'
});

// Chat routes rate limiter
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 chat requests per minute
  message: 'Too many chat requests, please try again later.'
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  chatLimiter
}; 