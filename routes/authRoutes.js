import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

// Google OAuth callback
router.post('/google', async (req, res) => {
  try {
    const { email, name, googleId } = req.body;
    
    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user with Google data
      user = new User({
        username: name || email.split('@')[0],
        email,
        password: Math.random().toString(36), // Random password
        isEmailVerified: true, // Auto-verified with Google
        googleId,
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      SECRET_KEY,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apple OAuth callback
router.post('/apple', async (req, res) => {
  try {
    const { email, name, appleId } = req.body;
    
    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        username: name || email.split('@')[0],
        email,
        password: Math.random().toString(36),
        isEmailVerified: true,
        appleId,
      });
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      SECRET_KEY,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
      },
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;