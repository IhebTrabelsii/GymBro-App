import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  phone: String,
  email: String,
  password: String,
}, { timestamps: true });

export default mongoose.model('User', userSchema);
