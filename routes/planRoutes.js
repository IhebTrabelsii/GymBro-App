import express from 'express';
import Plan from '../models/Plan.js';
import requireAdmin from '../middleware/requireAdmin.js';
import authenticateToken from '../middleware/auth.js';
import Exercise from '../models/Exercise.js';

const router = express.Router();

// GET all plans (public)
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find().sort({ bodyType: 1, createdAt: -1 });
    res.json({ success: true, data: plans });
  } catch (err) {
    console.error('💥 Error fetching plans:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

// GET plans by body type (public)
router.get('/bodytype/:bodyType', async (req, res) => {
  try {
    const { bodyType } = req.params;
    const plans = await Plan.find({ bodyType });
    
    res.json({ success: true, data: plans });
  } catch (err) {
    console.error('💥 Error fetching plans by body type:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

// GET single plan by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }
    
    res.json({ success: true, data: plan });
  } catch (err) {
    console.error('💥 Error fetching plan:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch plan' });
  }
});

// CREATE new plan (admin only)
router.post('/', requireAdmin, async (req, res) => {
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
      createdBy: req.userId // From requireAdmin middleware
    });
    
    await newPlan.save();
    
    res.status(201).json({ success: true, data: newPlan });
  } catch (err) {
    console.error('💥 Error creating plan:', err);
    res.status(500).json({ success: false, error: 'Failed to create plan' });
  }
});

// UPDATE plan (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const updatedPlan = await Plan.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedPlan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }
    
    res.json({ success: true, data: updatedPlan });
  } catch (err) {
    console.error('💥 Error updating plan:', err);
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

// DELETE plan (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deletedPlan = await Plan.findByIdAndDelete(req.params.id);
    
    if (!deletedPlan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }
    
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (err) {
    console.error('💥 Error deleting plan:', err);
    res.status(500).json({ success: false, error: 'Failed to delete plan' });
  }
});

// GET exercises for a specific plan by plan title
// GET exercises for a specific plan by plan title
router.get('/:planTitle/exercises', authenticateToken, async (req, res) => {
  try {
    const { planTitle } = req.params;
    
    if (planTitle === 'all') {
      const allPlans = await Plan.find().populate('exercises');
      const allExercises = allPlans.flatMap(plan => plan.exercises);
      const uniqueExercises = [];
      const exerciseIds = new Set();
      for (const exercise of allExercises) {
        if (!exerciseIds.has(exercise._id.toString())) {
          exerciseIds.add(exercise._id.toString());
          uniqueExercises.push(exercise);
        }
      }
      
      return res.json({
        success: true,
        plan: {
          name: "All Exercises",
          description: "Complete collection of exercises from all plans",
          color: "#2E7D32",
          emoji: "📚",
          stats: {
            totalExercises: uniqueExercises.length,
            weeklyFrequency: 0,
            avgDuration: "0 min",
            caloriesBurn: "0"
          },
          exercises: uniqueExercises.map(ex => ({
            id: ex._id,
            name: ex.name,
            category: ex.category,
            sets: ex.sets,
            reps: ex.reps,
            rest: ex.rest,
            difficulty: ex.difficulty,
            muscleGroups: ex.muscleGroups,
            equipment: ex.equipment,
            description: ex.description,
            tips: ex.tips,
            imageUrl: ex.imageUrl,
            videoUrl: ex.videoUrl,
            gifUrl: ex.gifUrl,
            calories: ex.calories,
            popularity: ex.popularity,
            expertTip: ex.expertTip
          }))
        }
      });
    }
    
    // Normal case: find specific plan
    const plan = await Plan.findOne({ title: planTitle }).populate('exercises');
    
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        error: "Plan not found" 
      });
    }
    
    // ... rest of your existing code for single plan
    const getEmoji = (bodyType) => {
      switch(bodyType) {
        case 'Ectomorph': return '🔥';
        case 'Mesomorph': return '💪';
        case 'Endomorph': return '⚡';
        default: return '🏋️';
      }
    };
    
    res.json({
      success: true,
      plan: {
        name: plan.title,
        description: plan.description,
        color: "#2E7D32",
        emoji: getEmoji(plan.bodyType),
        stats: {
          totalExercises: plan.exercises.length,
          weeklyFrequency: plan.days.length,
          avgDuration: "45 min",
          caloriesBurn: "400-600"
        },
        exercises: plan.exercises.map(ex => ({
          id: ex._id,
          name: ex.name,
          category: ex.category,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          difficulty: ex.difficulty,
          muscleGroups: ex.muscleGroups,
          equipment: ex.equipment,
          description: ex.description,
          tips: ex.tips,
          imageUrl: ex.imageUrl,
          videoUrl: ex.videoUrl,
          gifUrl: ex.gifUrl,
          calories: ex.calories,
          popularity: ex.popularity,
          expertTip: ex.expertTip
        }))
      }
    });
    
  } catch (error) {
    console.error("Error fetching plan exercises:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
export default router;