import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import authenticateToken from "../middleware/auth.js";
import { sendVerificationEmail } from "../utils/emailService.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";
import nodemailer from 'nodemailer';
import { Expo } from 'expo-server-sdk';
const expo = new Expo();


async function sendPushNotification(user, title, body, data = {}) {
  if (!user.pushTokens || user.pushTokens.length === 0) return;
  
  const messages = [];
  for (const pushToken of user.pushTokens) {
    if (!Expo.isExpoPushToken(pushToken)) continue;
    
    messages.push({
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    });
  }
  
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'iheb.trabelsi.gd@gmail.com',
    pass: process.env.SMTP_PASS_SUPPORT,  
  },
  debug: true,
  logger: true,
});
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) throw new Error("🚨 Missing JWT_SECRET env variable.");

const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters",
    };
  }
  return { isValid: true, message: "" };
};

router.get("/", async (_req, res) => {
  try {
    const users = await User.find({}, "username email phone");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { username, phone, email, password, role } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid email address",
      });
    }

    const { isValid: isPasswordValid, message: passwordMessage } =
      validatePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: passwordMessage,
      });
    }

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
    const alreadyCheckedIn = user.dailyCheckIns.some((date) => {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate.getTime() === today.getTime();
    });

    if (alreadyCheckedIn) {
      return res.status(400).json({
        success: false,
        error: "Already checked in today!",
      });
    }
    // Add today's check-in
    user.dailyCheckIns.push(today);

    // Update streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const checkedInYesterday = user.dailyCheckIns.some((date) => {
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
    if (user.currentStreak === 7) {
      user.bonusMessages = (user.bonusMessages || 0) + 15;
        await sendPushNotification(user, '🔥 7-Day Streak!',
         `Amazing! 7 days in a row! Keep it up! 💪`, { type: 'streak' });
         
      console.log(
        `🎉 7-day streak! +15 bonus messages. Total bonus: ${user.bonusMessages}`,
      );
    } else if (user.currentStreak === 30) {
      user.bonusMessages = (user.bonusMessages || 0) + 50;
      console.log(
        `🎉 30-day streak! +50 bonus messages. Total bonus: ${user.bonusMessages}`,
      );
    } else if (user.currentStreak === 100) {
      user.bonusMessages = (user.bonusMessages || 0) + 100;
      console.log(
        `🎉 100-day streak! +100 bonus messages. Total bonus: ${user.bonusMessages}`,
      );
    }
    user.lastCheckIn = today;
    await user.save();

    // Check for streak achievements
    const streakAchievements = [
      {
        days: 7,
        name: "Week Warrior",
        description: "7 day streak!",
        icon: "🔥",
      },
      {
        days: 30,
        name: "Monthly Master",
        description: "30 day streak!",
        icon: "👑",
      },
      {
        days: 100,
        name: "Century Club",
        description: "100 day streak!",
        icon: "💎",
      },
    ];

    let newAchievements = [];
    for (const ach of streakAchievements) {
      if (user.currentStreak === ach.days) {
        const alreadyHas = user.achievements.some((a) => a.name === ach.name);
        if (!alreadyHas) {
          newAchievements.push({
            id: `streak_${ach.days}`,
            name: ach.name,
            description: ach.description,
            icon: ach.icon,
            earnedAt: new Date(),
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
      newAchievements,
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

          // ✅ NEW: Add reward to bonusMessages (not aiMessagesRemaining)
          user.bonusMessages = (user.bonusMessages || 0) + mission.reward;
          await sendPushNotification(user, '🎉 Mission Complete!', `${mission.title}
             completed! You earned +${mission.reward} AI messages!`,
              { type: 'mission_complete' }
            );
          console.log(
            `✅ Mission complete! +${mission.reward} bonus messages. Total bonus: ${user.bonusMessages}`,
          );
        }
      }
    }
    await user.save();

    res.json({
      success: true,
      message: "Workout logged!",
      weeklyProgress: user.weeklyProgress,
      completedMissions,
      aiMessagesRemaining: user.aiMessagesRemaining,
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
        error: "Reward already claimed this week",
      });
    }

    const goalMet =
      user.weeklyProgress.completedWorkouts >= user.weeklyProgress.weeklyGoal;

    if (!goalMet) {
      return res.status(400).json({
        success: false,
        error: `Complete ${user.weeklyProgress.weeklyGoal} workouts first! You've done ${user.weeklyProgress.completedWorkouts}`,
      });
    }

    // Give reward: +20 AI messages
    // ✅ NEW: Give reward to bonusMessages
    user.bonusMessages = (user.bonusMessages || 0) + 20;
    user.weeklyProgress.rewardClaimed = true;
    console.log(
      `✅ Weekly reward claimed! +20 bonus messages. Total bonus: ${user.bonusMessages}`,
    );

    const weeklyAchievement = {
      id: `weekly_goal_${new Date().toISOString().slice(0, 10)}`,
      name: "Weekly Warrior",
      description: `Completed ${user.weeklyProgress.weeklyGoal} workouts in a week!`,
      icon: "🏆",
      earnedAt: new Date(),
    };

    user.achievements.push(weeklyAchievement);
    await user.save();

    res.json({
      success: true,
      message: "Weekly reward claimed! +20 AI messages",
      aiMessagesRemaining: user.aiMessagesRemaining,
      achievement: weeklyAchievement,
    });
  } catch (error) {
    console.error("Claim reward error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get("/activity", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // ✅ Generate missions if none exist (even without bodyType)
    // ✅ Generate missions if none exist (for ALL users)
    let missions = user.missions;
    if (!missions || missions.length === 0) {
      // Use bodyType if set, otherwise default to 'Mesomorph'
      const bodyType = user.bodyType || "Mesomorph";
      missions = generateMissionsForBodyType(bodyType);
      user.missions = missions;
      await user.save();
      console.log(
        `✅ Auto-created ${missions.length} missions for user: ${user.email}`,
      );
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
        aiMessagesRemaining: user.aiMessagesRemaining ?? 10,
        weeklyCupsCompleted: user.weeklyCupsCompleted || 0,
        monthlyRewardClaimed: user.monthlyRewardClaimed || false,
      },
    });
  } catch (error) {
    console.error("Activity fetch error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ UPDATE BODY TYPE (generates missions)
// ✅ UPDATE BODY TYPE (regenerates missions)
router.post("/set-body-type", authenticateToken, async (req, res) => {
  try {
    const { bodyType } = req.body;

    if (!["Ectomorph", "Mesomorph", "Endomorph"].includes(bodyType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid body type",
      });
    }

    const user = await User.findById(req.user.id);
    user.bodyType = bodyType;

    // ✅ Regenerate missions for the new body type
    user.missions = generateMissionsForBodyType(bodyType);

    // ✅ Initialize AI messages if not set
    //if (user.aiMessagesRemaining === undefined || user.aiMessagesRemaining === null) {
    // // user.aiMessagesRemaining = 10;
    //}

    await user.save();

    res.json({
      success: true,
      message: `Body type set to ${bodyType}`,
      missions: user.missions,
      aiMessagesRemaining: user.aiMessagesRemaining,
    });
  } catch (error) {
    console.error("Set body type error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

function generateMissionsForBodyType(bodyType) {
  const missions = [];

  // Weekly workout mission
  let weeklyGoal = 4;
  let missionTitle = "";
  let missionDesc = "";

  switch (bodyType) {
    case "Ectomorph":
      weeklyGoal = 4;
      missionTitle = "💪 Mass Builder";
      missionDesc = "Complete 4 heavy lifting sessions this week";
      break;
    case "Mesomorph":
      weeklyGoal = 5;
      missionTitle = "⚡ Balanced Athlete";
      missionDesc = "Complete 5 balanced workouts this week";
      break;
    case "Endomorph":
      weeklyGoal = 6;
      missionTitle = "🔥 Fat Torcher";
      missionDesc = "Complete 6 cardio/HIIT sessions this week";
      break;
    default:
      weeklyGoal = 4;
      missionTitle = "💪 Fitness Journey";
      missionDesc = "Complete 4 workouts this week";
  }

  missions.push({
    id: "weekly_workout_mission",
    title: missionTitle,
    description: missionDesc,
    category: "weekly",
    target: weeklyGoal,
    progress: 0,
    completed: false,
    reward: 20,
  });

  // Streak missions
  missions.push({
    id: "streak_mission_7",
    title: "🔥 7-Day Streak",
    description: "Check in for 7 days in a row",
    category: "streak",
    target: 7,
    progress: 0,
    completed: false,
    reward: 15,
  });

  missions.push({
    id: "streak_mission_30",
    title: "👑 Monthly Master",
    description: "Check in for 30 days in a row",
    category: "streak",
    target: 30,
    progress: 0,
    completed: false,
    reward: 50,
  });

  // Workout count mission
  missions.push({
    id: "workout_master",
    title: "🏋️ Workout Master",
    description: "Complete 20 workouts total",
    category: "workout",
    target: 20,
    progress: 0,
    completed: false,
    reward: 30,
  });

  // Social share mission
  missions.push({
    id: "social_share_mission",
    title: "📱 Share Your Progress",
    description: "Share your workout achievement on social media",
    category: "daily",
    target: 1,
    progress: 0,
    completed: false,
    reward: 10,
  });

  return missions;
}

// ✅ GET AI MESSAGES REMAINING
// ✅ GET AI MESSAGES REMAINING (with daily reset)
router.get("/ai-messages", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const today = new Date().toISOString().split("T")[0];

    // Check if we need to reset daily counter
    if (user.dailyMessagesDate !== today) {
      user.dailyMessagesUsed = 0;
      user.bonusMessages = 0;
      user.dailyMessagesDate = today;
      await user.save();
    }

    // Total available = 10 daily free + bonus from missions
    const totalAvailable = 10 + (user.bonusMessages || 0);
    const remaining = totalAvailable - (user.dailyMessagesUsed || 0);

    res.json({
      success: true,
      aiMessagesRemaining: Math.max(0, remaining),
      plan: user.plan,
      isUnlimited: user.plan !== "free",
      dailyUsed: user.dailyMessagesUsed || 0,
      dailyLimit: 10,
      bonusMessages: user.bonusMessages || 0,
    });
  } catch (error) {
    console.error("AI messages fetch error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/use-ai-message", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const today = new Date().toISOString().split("T")[0];

    // Check if we need to reset daily counter
    if (user.dailyMessagesDate !== today) {
      user.dailyMessagesUsed = 0;
      user.bonusMessages = 0;
      user.dailyMessagesDate = today;
      await user.save();
    }

    // Premium users have unlimited messages
    if (user.plan !== "free") {
      return res.json({
        success: true,
        aiMessagesRemaining: -1,
        isUnlimited: true,
      });
    }

    const totalAvailable = 10 + (user.bonusMessages || 0);
    const remaining = totalAvailable - (user.dailyMessagesUsed || 0);

    if (remaining <= 0) {
      return res.status(403).json({
        success: false,
        error:
          "No messages remaining today. Complete missions to earn bonus messages or upgrade to premium!",
        aiMessagesRemaining: 0,
      });
    }

    user.dailyMessagesUsed = (user.dailyMessagesUsed || 0) + 1;
    await user.save();

    const newRemaining = totalAvailable - user.dailyMessagesUsed;

    res.json({
      success: true,
      aiMessagesRemaining: newRemaining,
      isUnlimited: false,
      dailyUsed: user.dailyMessagesUsed,
      dailyLimit: 10,
      bonusMessages: user.bonusMessages || 0,
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
      count: user.achievements?.length || 0,
    });
  } catch (error) {
    console.error("Achievements fetch error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ TEMPORARY: Force reset missions for current user
router.post("/reset-missions", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const bodyType = user.bodyType || "Mesomorph";
    const missions = generateMissionsForBodyType(bodyType);

    user.missions = missions;
    user.bonusMessages = user.bonusMessages ?? 0;
    await user.save();

    res.json({
      success: true,
      message: `Missions reset! ${missions.length} missions created.`,
      missions: missions,
      aiMessagesRemaining: user.aiMessagesRemaining,
    });
  } catch (error) {
    console.error("Reset missions error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ SIMPLE: Auto-create missions for ANY user who visits profile
router.get("/ensure-missions", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.missions || user.missions.length === 0) {
      // Default body type for everyone
      const defaultMissions = [
        {
          id: "weekly_workout",
          title: "💪 Weekly Warrior",
          description: "Complete 4 workouts this week",
          category: "weekly",
          target: 4,
          progress: 0,
          completed: false,
          reward: 20,
        },
        {
          id: "streak_7",
          title: "🔥 7-Day Streak",
          description: "Check in for 7 days in a row",
          category: "streak",
          target: 7,
          progress: 0,
          completed: false,
          reward: 15,
        },
        {
          id: "workout_20",
          title: "🏋️ Workout Master",
          description: "Complete 20 workouts total",
          category: "workout",
          target: 20,
          progress: 0,
          completed: false,
          reward: 30,
        },
      ];

      user.missions = defaultMissions;
      user.aiMessagesRemaining = user.aiMessagesRemaining ?? 10;
      await user.save();

      console.log(`✅ Created missions for ${user.email}`);
    }

    res.json({
      success: true,
      missions: user.missions,
      aiMessagesRemaining: user.aiMessagesRemaining,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// DEBUG: Check current AI messages
router.get("/debug-ai", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      aiMessagesRemaining: user.aiMessagesRemaining,
      missions: user.missions.map((m) => ({
        title: m.title,
        completed: m.completed,
        reward: m.reward,
        progress: m.progress,
        target: m.target,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/contact-support", authenticateToken, async (req, res) => {
  try {
    const { subject, message } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    console.log("📧 SMTP_USER:", process.env.SMTP_USER);
    console.log("📧 SMTP_HOST:", process.env.SMTP_HOST);
    console.log("📧 SMTP_PORT:", process.env.SMTP_PORT);
    console.log("📧 SMTP_PASS length:", process.env.SMTP_PASS?.length || 0);
    console.log("📧 SMTP_PASS first 4 chars:", process.env.SMTP_PASS?.substring(0, 4));
    
    const nodemailer = await import('nodemailer');
    
    // Try with correct Gmail SMTP settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',  // Hardcoded for testing
      port: 465,                // Try 465 first (SSL)
      secure: true,             // true for port 465
      auth: {
        user: 'iheb.trabelsi.gd@gmail.com',  // Hardcoded for testing
        pass: process.env.SMTP_PASS,          // Your app password with spaces
      },
      debug: true,  // This will show SMTP conversation in console
      logger: true,
    });
    
    // Verify connection before sending
    await transporter.verify();
    console.log("✅ Transporter verified successfully!");
    
    // Send email
    const info = await transporter.sendMail({
      from: '"GymBro Support" <iheb.trabelsi.gd@gmail.com>',
      to: 'iheb.trabelsi.gd@gmail.com',
      subject: `GymBro Support: ${subject}`,
      text: `From: ${user.email}\n\nMessage:\n${message}`,
    });
    
    console.log("✅ Email sent:", info.messageId);
    res.json({ success: true, message: "Support request sent!" });
    
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
export default router;
