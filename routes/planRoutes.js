import express from 'express';
import Plan from '../models/Plan.js';
import requireAdmin from '../middleware/requireAdmin.js';

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

export default router;