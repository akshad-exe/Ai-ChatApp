const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { 
  registerValidator, 
  loginValidator, 
  forgotPasswordValidator,
  resetPasswordValidator 
} = require('../middleware/validators/authValidators');

// Public routes
router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);

// Password reset routes
router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);
router.get('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);

// Protected routes
router.get('/verify-token', auth, authController.verifyToken);
router.post('/logout', auth, authController.logout);

// Test protected route
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router; 