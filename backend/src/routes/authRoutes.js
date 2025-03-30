const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerValidator, loginValidator } = require('../middleware/validators/authValidators');

// Public routes
router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);

// Protected routes
router.get('/verify-token', auth, authController.verifyToken);
router.post('/logout', auth, authController.logout);

// Test protected route
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router; 