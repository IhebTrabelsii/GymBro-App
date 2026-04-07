import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

async function testDb() {
  try {
    console.log('Connecting to:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testDb();