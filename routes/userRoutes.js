import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
const router = express.Router();
const SECRET_KEY = 'your_secret_key'; // store in env file in real apps
// GET /api/users - returns all users (without passwords)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'username email phone');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/signup
router.post('/signup', async (req, res) => {
  console.log('Received signup data:', req.body);

  try {
    const { username, phone, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      phone,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: 'User created!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '2h' });

    res.json({
      message: 'Login successful',
      token, // ✅ Token returned correctly
      userId: user._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
