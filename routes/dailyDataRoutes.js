import express from 'express';
import DailyData from '../models/DailyData.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// ===== SAVE TODAY'S DATA =====
router.post('/save', authenticateToken, async (req, res) => {
  try {
    console.log("📥 Received save request:", req.body); // ← ADD THIS

    const {
      gender,
      age,
      weight,
      height,
      activityLevel,
      bmi,
      bmr,
      tdee,
    } = req.body;

    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    console.log("👤 User ID:", userId);
    console.log("📅 Date:", today);

    // Check if already saved today
    const existingEntry = await DailyData.findOne({ userId, date: today });

    if (existingEntry) {
      console.log("⏭️ Already saved today");
      return res.status(200).json({
        success: false,
        message: 'Already saved today',
        alreadySaved: true,
      });
    }

    // Create new entry
    const dailyData = new DailyData({
      userId,
      date: today,
      gender,
      age,
      weight,
      height,
      activityLevel,
      bmi,
      bmr,
      tdee,
    });

    await dailyData.save();
    console.log("✅ Daily data saved successfully");

    res.status(201).json({
      success: true,
      message: 'Daily data saved successfully',
    });
  } catch (error) {
    console.error('❌ Save daily data error DETAILS:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    if (error.code === 11000) {
      console.error('❌ Duplicate key error');
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GET MONTHLY HISTORY =====
router.get('/history/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.user.id;

    // Format: 2026-04-01 to 2026-04-30
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    const entries = await DailyData.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    res.json({
      success: true,
      entries,
      count: entries.length,
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ===== CHECK IF SAVED TODAY =====
router.get('/check-today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const existingEntry = await DailyData.findOne({ userId, date: today });

    res.json({
      success: true,
      savedToday: !!existingEntry,
    });
  } catch (error) {
    console.error('Check today error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;