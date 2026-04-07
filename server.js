// 1. Load .env at the very top
import 'dotenv/config';
import aiCoachRoutes from './routes/aiCoachRoutes.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import planRoutes from './routes/planRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import dailyDataRoutes from './routes/dailyDataRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import './models/Exercise.js'; 

const {
  MONGO_URI,
  JWT_SECRET,
  ADMIN_EMAIL,
  NODE_ENV,
  ADMIN_INITIAL_PASSWORD,
  CREATE_DEFAULT_ADMIN
} = process.env;

if (!MONGO_URI) throw new Error('❌ MONGO_URI is not defined in environment');
if (!JWT_SECRET) throw new Error('❌ JWT_SECRET is not defined in environment variables');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS & JSON
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai-coach', aiCoachRoutes);
app.use('/api/daily-data', dailyDataRoutes);
app.use('/reports', express.static('backend/reports'));
app.use('/api/foods', foodRoutes);



// Create initial admin if needed
async function createInitialAdmin() {
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists && ADMIN_EMAIL && ADMIN_INITIAL_PASSWORD) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_INITIAL_PASSWORD, salt);

    const admin = new User({
      username: 'admin',
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Initial admin created:', ADMIN_EMAIL);
  }
}

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    if (CREATE_DEFAULT_ADMIN === 'true') await createInitialAdmin();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
  console.log(`📱 On your phone, use: http://YOUR_COMPUTER_IP:${PORT}`);
});
  })
  .catch(err => {
    console.error('❌ DB connect error:', err);
    process.exit(1);
  });