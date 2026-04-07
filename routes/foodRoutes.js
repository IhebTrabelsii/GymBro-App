import express from 'express';
import Food from '../models/Food.js';
import authenticateToken from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';

const router = express.Router();

// ===== PUBLIC ROUTES (All users) =====

// GET all foods
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const foods = await Food.find(query).sort({ name: 1 });
    res.json({ success: true, foods });
  } catch (error) {
    console.error('Get foods error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET single food by ID
router.get('/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ success: false, error: 'Food not found' });
    }
    res.json({ success: true, food });
  } catch (error) {
    console.error('Get food error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = ['All', 'Protein', 'Carbs', 'Fats', 'Fruit', 'Vegetables'];
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ===== ADMIN ONLY ROUTES =====

// CREATE new food
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, calories, protein, carbs, fat, benefit, image, category, tags } = req.body;
    
    const existingFood = await Food.findOne({ name });
    if (existingFood) {
      return res.status(400).json({ success: false, error: 'Food already exists' });
    }
    
    const food = new Food({
      name,
      calories,
      protein,
      carbs,
      fat,
      benefit,
      image: image || '🍗',
      category,
      tags: tags || [],
    });
    
    await food.save();
    res.status(201).json({ success: true, food, message: 'Food created successfully' });
  } catch (error) {
    console.error('Create food error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// UPDATE food
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, calories, protein, carbs, fat, benefit, image, category, tags } = req.body;
    
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ success: false, error: 'Food not found' });
    }
    
    food.name = name || food.name;
    food.calories = calories || food.calories;
    food.protein = protein || food.protein;
    food.carbs = carbs || food.carbs;
    food.fat = fat || food.fat;
    food.benefit = benefit || food.benefit;
    food.image = image || food.image;
    food.category = category || food.category;
    food.tags = tags || food.tags;
    food.updatedAt = new Date();
    
    await food.save();
    res.json({ success: true, food, message: 'Food updated successfully' });
  } catch (error) {
    console.error('Update food error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE food
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ success: false, error: 'Food not found' });
    }
    
    await food.deleteOne();
    res.json({ success: true, message: 'Food deleted successfully' });
  } catch (error) {
    console.error('Delete food error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;