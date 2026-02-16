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
export default router;
