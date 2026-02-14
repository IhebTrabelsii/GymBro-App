import express from 'express';
import User from '../models/User.js';
import Plan from '../models/Plan.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import requireAdmin from '../middleware/requireAdmin.js';
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, role: 'admin' }).select('+password');
    
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { userId: admin._id, role: 'admin' },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        lastLogin: admin.lastLogin,
      }
    });
  } catch (err) {
    console.error('💥 Login error:', err);
    return res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

// Dashboard stats - REAL DATA from database
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    // Get real counts from your database
    const users = await User.countDocuments({ role: 'user' }); // Count only regular users, not admins
    const workouts = await Plan.countDocuments(); // Count total workout plans
    const news = 0; // You'll need to create a News model first, or set to 0 for now

    console.log('📊 Dashboard stats fetched:', { users, workouts, news });

    res.json({ 
      users, 
      workouts, 
      news 
    });
  } catch (err) {
    console.error('💥 Dashboard error:', err);
    res.status(500).json({ success: false, error: 'Failed to load dashboard stats' });
  }
});

// Get all users (for user management page)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json({ success: true, users });
  } catch (err) {
    console.error('💥 Error fetching users:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// UPDATE user (admin only)
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { username, email } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('💥 Error updating user:', err);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('💥 Error deleting user:', err);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

export default router;