const express = require('express');
const router = express.Router();
const User = require('../models/User');       // single User model for both users and admins
const Plan = require('../models/Plan');       // import Plan model
const bcrypt = require('bcryptjs');

// Admin signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Check if user/admin with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new User({ 
      email, 
      username,          // optional, if you want username
      password: hashedPassword, 
      role: 'admin'      // set role to admin here
    });
    await newAdmin.save();

    res.status(201).json({ message: 'Admin created!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, role: 'admin' }); // find admin by role

    if (!admin) return res.status(400).json({ error: 'Admin not found' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    res.json({ message: 'Admin login successful', adminId: admin._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin stats
router.get('/stats', async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    const userCount = await User.countDocuments({ role: { $ne: 'admin' } });
    const planCount = await Plan.countDocuments();

    res.json({ admins: adminCount, users: userCount, plans: planCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
