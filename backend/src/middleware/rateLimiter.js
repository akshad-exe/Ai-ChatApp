const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs: windowMs || 15 * 60 * 1000, // 15 minutes
    max: max || 100, // limit each IP to 100 requests per windowMs
    message: {
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
};

// Specific limiters for different routes
const authLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes for auth routes
const apiLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes for API routes

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter
}; 