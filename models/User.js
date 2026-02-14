import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // ===== EXISTING FIELDS =====
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  phone: String,
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true, // Always store emails in lowercase
    trim: true      // Remove whitespace
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  password: { 
    type: String, 
    required: true,
    select: false 
  },

  // ===== PROFILE FIELDS =====
  fullName: { 
    type: String, 
    default: '' 
  },
  bio: { 
    type: String, 
    default: '' 
  },
  location: { 
    type: String, 
    default: '' 
  },
  birthDate: { 
    type: Date 
  },
  height: { 
    type: Number        // in cm
  },
  weight: { 
    type: Number        // in kg
  },
  fitnessLevel: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'], 
    default: 'beginner' 
  },
  plan: {
    type: String,
    enum: ['free', 'monthly', 'yearly', 'lifetime'],
    default: 'free'
  },
  premiumSince: Date,
  stripeCustomerId: String,
  goals: [{ 
    type: String 
  }],
  preferences: {
    notifications: { 
      type: Boolean, 
      default: true 
    },
    privacy: { 
      type: String, 
      enum: ['public', 'private'], 
      default: 'public' 
    },
  },
   googleId: {
    type: String,
    select: false
  },
  appleId: {
    type: String,
    select: false
  },
  // ===== EMAIL VERIFICATION FIELDS =====
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  
  // ===== PASSWORD RESET FIELDS =====
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },

}, { timestamps: true });

// Email validation - custom validator
userSchema.path('email').validate(function(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}, 'Please enter a valid email address');

userSchema.pre('save', async function(next) {
  // ✅ Skip if password isn't modified OR if we set the skip flag
  if (!this.isModified('password') || this.skipPasswordHashing) {
    return next();
  }
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

// ===== PASSWORD COMPARISON =====
userSchema.methods.comparePassword = async function(candidatePassword) {
  const user = await this.model('User').findById(this._id).select('+password');
  return bcrypt.compare(candidatePassword, user.password);
};

export default mongoose.model('User', userSchema);