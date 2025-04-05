const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { generateResetUrl } = require('../utils/email');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Register new user
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;
    console.log('Registration attempt for:', { username, email });
    console.log('Registration password:', password);

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered.' : 'Username already taken.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Registration - Password hashed successfully');
    console.log('Registration - Salt used:', salt);
    console.log('Registration - Generated hash:', hashedPassword);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();
    console.log('User registered successfully');

    // Generate JWT token
    const token = generateToken(user._id);

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data (excluding password)
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'An error occurred during registration.' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    console.log('Login - Received password:', password);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    console.log('Login - Found user with hash:', user.password);

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Login - Password match:', isMatch);
    console.log('Login - Attempting to compare password with hash');

    if (!isMatch) {
      console.log('Login - Invalid password');
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data (excluding password)
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Password reset request for:', email);

    const user = await User.findOne({ email });

    if (!user) {
      // Return the same message for both existing and non-existing emails
      // to prevent email enumeration
      return res.json({ 
        message: 'If an account exists, a password reset link will be generated.' 
      });
    }

    // Check if there's already a valid reset token
    if (user.resetPasswordToken && user.resetPasswordExpires > Date.now()) {
      return res.status(429).json({ 
        message: 'A reset link has already been generated. Please wait before requesting another.' 
      });
    }

    // Generate a cryptographically secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Hash the reset token before storing
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Update user with hashed token
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: hashedResetToken,
      resetPasswordExpires: resetTokenExpiry
    });

    // Get the reset URL
    const { resetUrl } = await generateResetUrl(email, resetToken);
    
    res.json({ 
      message: 'If an account exists, a reset link will be generated.',
      resetUrl
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
};

// Verify reset token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    // Hash the provided token to match stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    res.json({ message: 'Valid reset token.' });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ message: 'An error occurred while verifying the reset token.' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    console.log('Reset password attempt with token');
    console.log('New password to be set:', password);

    // Hash the provided token to match stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Invalid or expired reset token');
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('New password hashed successfully');
    console.log('Password hash:', hashedPassword);
    console.log('Salt used:', salt);

    // Update user password using findByIdAndUpdate to ensure atomic operation
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          password: hashedPassword,
          resetPasswordToken: undefined,
          resetPasswordExpires: undefined
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      console.log('Failed to update user password');
      return res.status(500).json({ message: 'Failed to update password.' });
    }

    console.log('Password reset successful for user:', updatedUser.email);
    console.log('Updated password hash:', updatedUser.password);
    
    // Verify the password was updated correctly
    const isMatch = await bcrypt.compare(password, updatedUser.password);
    console.log('Verification - Password matches new hash:', isMatch);

    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'An error occurred while resetting your password.' });
  }
};

// Verify token and get user profile
exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying token', error: error.message });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
      await user.save();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out', error: error.message });
  }
}; 