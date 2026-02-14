import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js'; // adjust path if needed

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log('ℹ️ Admin already exists');
      return;
    }

    const newAdmin = new User({
      username: 'adminuser',
      email,
      password: process.env.ADMIN_INITIAL_PASSWORD || 'TempPass123!',
      role: 'admin'
    });

    await newAdmin.save();
    console.log('✅ Admin created with ID:', newAdmin._id);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
