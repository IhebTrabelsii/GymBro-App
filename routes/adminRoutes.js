import express from 'express';
import User from '../models/User.js';
import Plan from '../models/Plan.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import requireAdmin from '../middleware/requireAdmin.js';
import { adminAuth } from "../middleware/adminAuth.js";
import Food from '../models/Food.js';
import Exercise from '../models/Exercise.js';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

// Helper function to auto-link exercises based on body type
async function autoLinkExercisesToPlan(plan) {
  const exercises = await Exercise.find();
  
  let exercisesToLink = [];
  
  if (plan.bodyType === 'Ectomorph') {
    // Strength focused exercises for Ectomorph
    exercisesToLink = exercises.filter(e => 
      ['Chest', 'Back', 'Legs', 'Shoulders'].includes(e.category)
    ).slice(0, 6);
  } else if (plan.bodyType === 'Mesomorph') {
    // Balanced exercises for Mesomorph
    exercisesToLink = exercises.filter(e => 
      ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'].includes(e.category)
    ).slice(0, 5);
  } else if (plan.bodyType === 'Endomorph') {
    // Cardio/HIIT focused for Endomorph
    exercisesToLink = exercises.filter(e => 
      ['HIIT', 'Cardio', 'Full Body'].includes(e.category)
    ).slice(0, 5);
  }
  
  plan.exercises = exercisesToLink.map(e => e._id);
  await plan.save();
  
  return exercisesToLink.length;
}
// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, role: 'admin' }).select('+password');
    
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { userId: admin._id, role: 'admin' },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        lastLogin: admin.lastLogin,
      }
    });
  } catch (err) {
    console.error('💥 Login error:', err);
    return res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

// Dashboard stats - REAL DATA from database
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const users = await User.countDocuments({ role: 'user' });
    const workouts = await Plan.countDocuments();
    const food = await Food.countDocuments();

    console.log('📊 Dashboard stats fetched:', { users, workouts, food });

    res.json({ 
      users, 
      workouts, 
      food
    });
  } catch (err) {
    console.error('💥 Dashboard error:', err);
    res.status(500).json({ success: false, error: 'Failed to load dashboard stats' });
  }
});

// Get all users (for user management page)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json({ success: true, users });
  } catch (err) {
    console.error('💥 Error fetching users:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// UPDATE user (admin only)
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { username, email } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('💥 Error updating user:', err);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('💥 Error deleting user:', err);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// GET all plans with their exercises populated
router.get('/plans-with-exercises', requireAdmin, async (req, res) => {
  try {
    const plans = await Plan.find().populate('exercises');
    res.json({ success: true, plans });
  } catch (error) {
    console.error('Error fetching plans with exercises:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET all exercises (for admin to select from)
router.get('/exercises/all', requireAdmin, async (req, res) => {
  try {
    const exercises = await Exercise.find().sort({ name: 1 });
    res.json({ success: true, exercises });
  } catch (error) {
    console.error('Error fetching all exercises:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE plan exercises (add/remove exercises from a plan)
router.put('/plans/:planId/exercises', requireAdmin, async (req, res) => {
  try {
    const { planId } = req.params;
    const { exerciseIds } = req.body;
    
    const plan = await Plan.findByIdAndUpdate(
      planId,
      { exercises: exerciseIds },
      { new: true }
    ).populate('exercises');
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }
    
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error updating plan exercises:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET exercises by category
router.get('/exercises/category/:category', requireAdmin, async (req, res) => {
  try {
    const { category } = req.params;
    const exercises = await Exercise.find({ category }).sort({ name: 1 });
    res.json({ success: true, exercises });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET all unique muscle groups
router.get('/exercises/muscle-groups', requireAdmin, async (req, res) => {
  try {
    const muscleGroups = await Exercise.distinct('muscleGroups');
    res.json({ success: true, muscleGroups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET exercise stats by category
router.get('/exercises/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await Exercise.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE exercise (admin only) - OPTIONALLY ADD TO RELEVANT PLANS
router.post('/exercises', requireAdmin, async (req, res) => {
  try {
    const exercise = new Exercise(req.body);
    await exercise.save();
    
    // Optional: Add this exercise to relevant plans based on category
    let targetBodyType = null;
    if (['Chest', 'Back', 'Legs', 'Shoulders'].includes(exercise.category)) {
      targetBodyType = 'Ectomorph';
    } else if (['HIIT', 'Cardio', 'Full Body'].includes(exercise.category)) {
      targetBodyType = 'Endomorph';
    } else if (['Arms', 'Core'].includes(exercise.category)) {
      targetBodyType = 'Mesomorph';
    }
    
    if (targetBodyType) {
      const relevantPlans = await Plan.find({ bodyType: targetBodyType });
      for (const plan of relevantPlans) {
        if (!plan.exercises.includes(exercise._id)) {
          plan.exercises.push(exercise._id);
          await plan.save();
        }
      }
      console.log(`✅ Added new exercise to ${relevantPlans.length} ${targetBodyType} plans`);
    }
    
    res.status(201).json({ 
      success: true, 
      exercise,
      message: 'Exercise created and linked to relevant plans'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE exercise
router.put('/exercises/:id', requireAdmin, async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ success: true, exercise });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE exercise
router.delete('/exercises/:id', requireAdmin, async (req, res) => {
  try {
    await Exercise.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Exercise deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE new plan (admin only) - WITH AUTO-LINK EXERCISES
router.post('/plans', requireAdmin, async (req, res) => {
  try {
    const { title, description, bodyType, focus, days, tips, icon } = req.body;
    
    // Validation
    if (!title || !description || !bodyType || !focus || !days || !tips) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    const newPlan = new Plan({
      title,
      description,
      bodyType,
      focus,
      days: Array.isArray(days) ? days : [days],
      tips,
      icon: icon || 'fitness',
      createdBy: req.userId,
      exercises: [] // Start empty
    });
    
    await newPlan.save();
    
    // 🔥 AUTO-LINK EXERCISES BASED ON BODY TYPE
    const linkedCount = await autoLinkExercisesToPlan(newPlan);
    
    res.status(201).json({ 
      success: true, 
      data: newPlan,
      message: `Plan created with ${linkedCount} exercises automatically linked`
    });
  } catch (err) {
    console.error('💥 Error creating plan:', err);
    res.status(500).json({ success: false, error: 'Failed to create plan' });
  }
});

// POST - Refresh exercises for a specific plan (auto-link based on body type)
router.post('/plans/:planId/refresh-exercises', requireAdmin, async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await Plan.findById(planId);
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }
    
    const linkedCount = await autoLinkExercisesToPlan(plan);
    
    res.json({ 
      success: true, 
      message: `Refreshed ${linkedCount} exercises for plan: ${plan.title}`,
      linkedCount
    });
  } catch (error) {
    console.error('Error refreshing plan exercises:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;