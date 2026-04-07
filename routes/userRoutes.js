import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import authenticateToken from "../middleware/auth.js";
import { sendVerificationEmail } from "../utils/emailService.js"; // 👈 ADD THIS
import { sendPasswordResetEmail } from "../utils/emailService.js";

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) throw new Error("🚨 Missing JWT_SECRET env variable.");

// Email validation function
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Password validation function
const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters",
    };
  }
  return { isValid: true, message: "" };
};

// ===== PUBLIC ROUTES =====
router.get("/", async (_req, res) => {
  try {
    const users = await User.find({}, "username email phone");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ===== SIGNUP WITH EMAIL VERIFICATION =====
router.post("/signup", async (req, res) => {
  try {
    const { username, phone, email, password, role } = req.body;

    // Validate email format
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid email address",
      });
    }

    // Validate password strength
    const { isValid: isPasswordValid, message: passwordMessage } =
      validatePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: passwordMessage,
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    const finalRole = role === "admin" ? "admin" : "user";

    const newUser = new User({
      username,
      phone,
      email,
      password,
      role: finalRole,
    });

    await newUser.save();

    // ===== NEW: Generate verification token =====
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await User.findByIdAndUpdate(newUser._id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Send verification email
    await sendVerificationEmail(email, username, verificationToken);

    res.status(201).json({
      success: true,
      message: "User created! Please check your email to verify your account.",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (err) {
    // Handle duplicate key error (email or username)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `${field} already exists`,
      });
    }
    console.error("Signup error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== EMAIL VERIFICATION ENDPOINT =====
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification token",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ===== RESEND VERIFICATION EMAIL =====
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: "Email already verified",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(email, user.username, verificationToken);

    res.json({
      success: true,
      message: "Verification email resent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ===== LOGIN =====
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Email and password required" });
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      error: "Please enter a valid email address",
    });
  }

  try {
    const user = await User.findOne({ email }).select("+password +role");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }

    // ===== NEW: Check if email is verified =====
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: "Please verify your email before logging in",
        needsVerification: true,
        email: user.email,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, SECRET_KEY, {
      expiresIn: user.role === "admin" ? "8h" : "2h",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        plan: user.plan || "free",
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res
      .status(500)
      .json({ success: false, error: "Server error during login" });
  }
});

// ===== PROTECTED ROUTES =====
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/plan", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "plan premiumSince isEmailVerified",
    );
    res.json({
      success: true,
      plan: user.plan || "free",
      premiumSince: user.premiumSince,
      isEmailVerified: user.isEmailVerified,
    });
  } catch (error) {
    console.error("Plan fetch error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/upgrade", authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!["monthly", "yearly", "lifetime"].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        plan: plan,
        premiumSince: new Date(),
      },
      { new: true },
    ).select("plan premiumSince");

    res.json({
      success: true,
      message: `Upgraded to ${plan} plan`,
      user,
    });
  } catch (error) {
    console.error("Upgrade error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const stats = {
      totalWorkouts: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalPRs: 0,
      totalMinutes: 0,
      achievements: 0,
    };
    res.json({ stats });
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const updates = {};

    if (req.body.fullName !== undefined) updates.fullName = req.body.fullName;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.location !== undefined) updates.location = req.body.location;
    if (req.body.birthDate !== undefined)
      updates.birthDate = req.body.birthDate;
    if (req.body.height !== undefined) updates.height = req.body.height;
    if (req.body.weight !== undefined) updates.weight = req.body.weight;
    if (req.body.fitnessLevel !== undefined)
      updates.fitnessLevel = req.body.fitnessLevel;
    if (req.body.goals !== undefined) updates.goals = req.body.goals;
    if (req.body.notifications !== undefined)
      updates["preferences.notifications"] = req.body.notifications;
    if (req.body.privacy !== undefined)
      updates["preferences.privacy"] = req.body.privacy;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.skipPasswordHashing = true;
    await user.save();

    console.log(`✅ Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("❌ Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
});

// Forgot password - request reset link
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Always return success even if user doesn't exist (security)
    if (!user) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving to database
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save to user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    // Add this right before await sendPasswordResetEmail(...)
    console.log("🔍 SMTP_USER exists:", !!process.env.SMTP_USER);
    console.log("🔍 SMTP_PASS exists:", !!process.env.SMTP_PASS);
    // Send email with the UNHASHED token (user will click with this)
    await sendPasswordResetEmail(email, user.username, resetToken);

    res.json({
      success: true,
      message: "Reset link sent successfully",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});


// Reset password - verify token and update password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    // Hash the token from URL to compare with stored hash
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // The pre('save') middleware will hash the password automatically
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});
// ===== ACTIVITY & ACHIEVEMENTS ROUTES =====

// ✅ DAILY CHECK-IN
router.post("/checkin", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if already checked in today
    const alreadyCheckedIn = user.dailyCheckIns.some(date => {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate.getTime() === today.getTime();
    });

    if (alreadyCheckedIn) {
      return res.status(400).json({ 
        success: false, 
        error: "Already checked in today!" 
      });
    }
    // Add today's check-in
    user.dailyCheckIns.push(today);
    
    // Update streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const checkedInYesterday = user.dailyCheckIns.some(date => {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate.getTime() === yesterday.getTime();
    });

    if (checkedInYesterday) {
      user.currentStreak += 1;
    } else {
      user.currentStreak = 1;
    }
    
    // Update longest streak
    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak;
    }
    
    user.lastCheckIn = today;
    await user.save();

    // Check for streak achievements
    const streakAchievements = [
      { days: 7, name: "Week Warrior", description: "7 day streak!", icon: "🔥" },
      { days: 30, name: "Monthly Master", description: "30 day streak!", icon: "👑" },
      { days: 100, name: "Century Club", description: "100 day streak!", icon: "💎" }
    ];
    
    let newAchievements = [];
    for (const ach of streakAchievements) {
      if (user.currentStreak === ach.days) {
        const alreadyHas = user.achievements.some(a => a.name === ach.name);
        if (!alreadyHas) {
          newAchievements.push({
            id: `streak_${ach.days}`,
            name: ach.name,
            description: ach.description,
            icon: ach.icon,
            earnedAt: new Date()
          });
        }
      }
    }
    
    if (newAchievements.length > 0) {
      user.achievements.push(...newAchievements);
      await user.save();
    }

    res.json({
      success: true,
      message: "Checked in successfully!",
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      newAchievements
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ LOG WORKOUT (progress for missions)
router.post("/log-workout", authenticateToken, async (req, res) => {
  try {
    const { workoutId, duration } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Update weekly progress
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    
    if (user.weeklyProgress.weekStart < weekStart) {
      // New week - reset
      user.weeklyProgress.weekStart = weekStart;
      user.weeklyProgress.completedWorkouts = 1;
      user.weeklyProgress.rewardClaimed = false;
    } else {
      user.weeklyProgress.completedWorkouts += 1;
    }
    
    // Update missions progress
    let completedMissions = [];
    for (let i = 0; i < user.missions.length; i++) {
      const mission = user.missions[i];
      if (!mission.completed) {
        mission.progress += 1;
        
        if (mission.progress >= mission.target) {
          mission.completed = true;
          mission.completedAt = new Date();
          completedMissions.push(mission);
          
          // Add reward (AI messages)
          user.aiMessagesRemaining += mission.reward;
        }
      }
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: "Workout logged!",
      weeklyProgress: user.weeklyProgress,
      completedMissions,
      aiMessagesRemaining: user.aiMessagesRemaining
    });
  } catch (error) {
    console.error("Log workout error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ CLAIM WEEKLY REWARD
router.post("/claim-weekly-reward", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    if (user.weeklyProgress.rewardClaimed) {
      return res.status(400).json({ 
        success: false, 
        error: "Reward already claimed this week" 
      });
    }
    
    const goalMet = user.weeklyProgress.completedWorkouts >= user.weeklyProgress.weeklyGoal;
    
    if (!goalMet) {
      return res.status(400).json({ 
        success: false, 
        error: `Complete ${user.weeklyProgress.weeklyGoal} workouts first! You've done ${user.weeklyProgress.completedWorkouts}` 
      });
    }
    
    // Give reward: +20 AI messages
    user.aiMessagesRemaining += 20;
    user.weeklyProgress.rewardClaimed = true;
    
    // Add achievement for completing weekly goal
    const weeklyAchievement = {
      id: `weekly_goal_${new Date().toISOString().slice(0, 10)}`,
      name: "Weekly Warrior",
      description: `Completed ${user.weeklyProgress.weeklyGoal} workouts in a week!`,
      icon: "🏆",
      earnedAt: new Date()
    };
    
    user.achievements.push(weeklyAchievement);
    await user.save();
    
    res.json({
      success: true,
      message: "Weekly reward claimed! +20 AI messages",
      aiMessagesRemaining: user.aiMessagesRemaining,
      achievement: weeklyAchievement
    });
  } catch (error) {
    console.error("Claim reward error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ GET USER ACTIVITY & MISSIONS
router.get("/activity", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    // Generate missions based on body type if none exist
    let missions = user.missions;
    if (missions.length === 0 && user.bodyType) {
      missions = generateMissionsForBodyType(user.bodyType);
      user.missions = missions;
      await user.save();
    }
    
    res.json({
      success: true,
      activity: {
        dailyCheckIns: user.dailyCheckIns,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastCheckIn: user.lastCheckIn,
        weeklyProgress: user.weeklyProgress,
        missions: user.missions,
        achievements: user.achievements,
        aiMessagesRemaining: user.aiMessagesRemaining
      }
    });
  } catch (error) {
    console.error("Activity fetch error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ UPDATE BODY TYPE (generates missions)
router.post("/set-body-type", authenticateToken, async (req, res) => {
  try {
    const { bodyType } = req.body;
    
    if (!['Ectomorph', 'Mesomorph', 'Endomorph'].includes(bodyType)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid body type" 
      });
    }
    
    const user = await User.findById(req.user.id);
    user.bodyType = bodyType;
    
    // Generate missions for this body type
    user.missions = generateMissionsForBodyType(bodyType);
    await user.save();
    
    res.json({
      success: true,
      message: `Body type set to ${bodyType}`,
      missions: user.missions
    });
  } catch (error) {
    console.error("Set body type error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Helper function to generate missions based on body type
function generateMissionsForBodyType(bodyType) {
  const missions = [];
  
  // Weekly workout mission (same for all, but different targets)
  let weeklyGoal = 4;
  let missionTitle = "";
  let missionDesc = "";
  
  switch(bodyType) {
    case 'Ectomorph':
      weeklyGoal = 4;
      missionTitle = "💪 Mass Builder";
      missionDesc = "Complete 4 heavy lifting sessions this week";
      break;
    case 'Mesomorph':
      weeklyGoal = 5;
      missionTitle = "⚡ Balanced Athlete";
      missionDesc = "Complete 5 balanced workouts this week";
      break;
    case 'Endomorph':
      weeklyGoal = 6;
      missionTitle = "🔥 Fat Torcher";
      missionDesc = "Complete 6 cardio/HIIT sessions this week";
      break;
  }
  
  missions.push({
    id: "weekly_workout_mission",
    title: missionTitle,
    description: missionDesc,
    category: "weekly",
    target: weeklyGoal,
    progress: 0,
    completed: false,
    reward: 20
  });
  
  // Streak mission
  missions.push({
    id: "streak_mission_7",
    title: "🔥 7-Day Streak",
    description: "Check in for 7 days in a row",
    category: "streak",
    target: 7,
    progress: 0,
    completed: false,
    reward: 15
  });
  
  // Share mission (social)
  missions.push({
    id: "social_share_mission",
    title: "📱 Share Your Progress",
    description: "Share your workout achievement on social media",
    category: "daily",
    target: 1,
    progress: 0,
    completed: false,
    reward: 10
  });
  
  return missions;
}

// ✅ GET AI MESSAGES REMAINING
router.get("/ai-messages", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("aiMessagesRemaining plan");
    
    res.json({
      success: true,
      aiMessagesRemaining: user.aiMessagesRemaining,
      plan: user.plan,
      isUnlimited: user.plan !== 'free'  // Premium users get unlimited
    });
  } catch (error) {
    console.error("AI messages fetch error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ USE ONE AI MESSAGE (decrement)
router.post("/use-ai-message", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Premium users have unlimited messages
    if (user.plan !== 'free') {
      return res.json({
        success: true,
        aiMessagesRemaining: -1, // -1 means unlimited
        isUnlimited: true
      });
    }
    
    if (user.aiMessagesRemaining <= 0) {
      return res.status(403).json({
        success: false,
        error: "No AI messages remaining. Complete missions or upgrade to premium!",
        aiMessagesRemaining: 0
      });
    }
    
    user.aiMessagesRemaining -= 1;
    await user.save();
    
    res.json({
      success: true,
      aiMessagesRemaining: user.aiMessagesRemaining,
      isUnlimited: false
    });
  } catch (error) {
    console.error("Use AI message error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ GET ACHIEVEMENTS
router.get("/achievements", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("achievements");
    
    res.json({
      success: true,
      achievements: user.achievements || [],
      count: user.achievements?.length || 0
    });
  } catch (error) {
    console.error("Achievements fetch error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});
export default router;
