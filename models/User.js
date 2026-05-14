import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },

    phone: String,

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    fullName: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    birthDate: {
      type: Date,
    },

    height: {
      type: Number,
    },

    weight: {
      type: Number,
    },

    fitnessLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    plan: {
      type: String,
      enum: ["free", "monthly", "yearly", "lifetime"],
      default: "free",
    },

    premiumSince: Date,

    stripeCustomerId: String,

    goals: [
      {
        type: String,
      },
    ],

    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },

      privacy: {
        type: String,
        enum: ["public", "private"],
        default: "public",
      },
    },

    googleId: {
      type: String,
      select: false,
    },

    appleId: {
      type: String,
      select: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    dailyCheckIns: {
      type: [Date],
      default: [],
    },

    currentStreak: {
      type: Number,
      default: 0,
    },

    longestStreak: {
      type: Number,
      default: 0,
    },

    lastCheckIn: {
      type: Date,
      default: null,
    },

    weeklyProgress: {
      weekStart: { type: Date, default: () => new Date() },
      completedWorkouts: { type: Number, default: 0 },
      weeklyGoal: { type: Number, default: 4 }, // Default goal per body type
      rewardClaimed: { type: Boolean, default: false },
    },

    bodyType: {
      type: String,
      enum: ["Ectomorph", "Mesomorph", "Endomorph", null],
      default: null,
    },

    weeklyCupsCompleted: {
      type: Number,
      default: 0,
    },
    monthlyRewardClaimed: {
      type: Boolean,
      default: false,
    },

    dailyMessagesUsed: {
      type: Number,
      default: 0,
    },

    dailyMessagesDate: {
      type: String, // Store date as string like "2024-01-15"
      default: () => new Date().toISOString().split("T")[0],
    },
    
    bonusMessages: {
      type: Number,
      default: 0, // Messages earned from missions (resets daily)
    },

    missions: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        category: {
          type: String,
          enum: ["daily", "weekly", "streak", "workout"],
          default: "weekly",
        },
        target: { type: Number, required: true }, // e.g., 4 workouts per week
        progress: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        reward: { type: Number, default: 20 }, // AI questions reward
        completedAt: Date,
      },
    ],

    achievements: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        icon: { type: String }, // emoji or icon name
        earnedAt: { type: Date, default: Date.now },
      },
    ],

    aiMessagesRemaining: {
      type: Number,
      default: 10, 
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  

  { timestamps: true },
);

userSchema.path("email").validate(function (email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}, "Please enter a valid email address");

userSchema.pre("save", async function (next) {

  if (!this.isModified("password") || this.skipPasswordHashing) {
    return next();
  }

  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  const user = await this.model("User").findById(this._id).select("+password");
  return bcrypt.compare(candidatePassword, user.password);
};

export default mongoose.model("User", userSchema);
