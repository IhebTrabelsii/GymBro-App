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
  dailyCheckIns: {
    type: [Date],
    default: []
  },
  
  // Current streak (consecutive days)
  currentStreak: {
    type: Number,
    default: 0
  },
  
  // Longest streak ever achieved
  longestStreak: {
    type: Number,
    default: 0
  },
  
  // Last check-in date (to calculate streaks)
  lastCheckIn: {
    type: Date,
    default: null
  },
  
  // Weekly goals tracking
  weeklyProgress: {
    weekStart: { type: Date, default: () => new Date() },
    completedWorkouts: { type: Number, default: 0 },
    weeklyGoal: { type: Number, default: 4 },  // Default goal per body type
    rewardClaimed: { type: Boolean, default: false }
  },
  
  // Body type (for personalized missions)
  bodyType: {
    type: String,
    enum: ['Ectomorph', 'Mesomorph', 'Endomorph', null],
    default: null
  },
  
  // Active missions based on body type
  missions: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['daily', 'weekly', 'streak', 'workout'], default: 'weekly' },
    target: { type: Number, required: true },      // e.g., 4 workouts per week
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    reward: { type: Number, default: 20 },         // AI questions reward
    completedAt: Date
  }],
  
  // Earned achievements (permanent)
  achievements: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String },  // emoji or icon name
    earnedAt: { type: Date, default: Date.now }
  }],
  
  // AI Coach messages remaining (for rewards)
  aiMessagesRemaining: {
    type: Number,
    default: 10  // Free tier gets 10 messages
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