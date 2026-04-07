import 'dotenv/config';
import mongoose from 'mongoose';
import Food from '../models/Food.js';

const MONGO_URI = process.env.MONGO_URI;

const foods = [
  {
    name: "Chicken Breast",
    calories: 165,
    protein: "31g",
    carbs: "0g",
    fat: "3.6g",
    benefit: "Lean protein for muscle growth and recovery.",
    image: "🍗",
    category: "Protein",
    tags: ["high-protein", "low-carb", "lean"],
  },
  {
    name: "Eggs",
    calories: 155,
    protein: "13g",
    carbs: "1g",
    fat: "11g",
    benefit: "Complete protein with all essential amino acids.",
    image: "🥚",
    category: "Protein",
    tags: ["high-protein", "healthy-fats"],
  },
  {
    name: "Banana",
    calories: 89,
    protein: "1.1g",
    carbs: "23g",
    fat: "0.3g",
    benefit: "Fast energy and potassium for muscle function.",
    image: "🍌",
    category: "Fruit",
    tags: ["pre-workout", "energy"],
  },
  {
    name: "Salmon",
    calories: 208,
    protein: "20g",
    carbs: "0g",
    fat: "13g",
    benefit: "Rich in omega-3 fatty acids for heart health.",
    image: "🐟",
    category: "Protein",
    tags: ["high-protein", "omega-3", "healthy-fats"],
  },
  {
    name: "Sweet Potato",
    calories: 86,
    protein: "1.6g",
    carbs: "20g",
    fat: "0.1g",
    benefit: "Complex carbs for sustained energy release.",
    image: "🍠",
    category: "Carbs",
    tags: ["complex-carbs", "pre-workout"],
  },
  {
    name: "Avocado",
    calories: 160,
    protein: "2g",
    carbs: "9g",
    fat: "15g",
    benefit: "Healthy monounsaturated fats and fiber.",
    image: "🥑",
    category: "Fats",
    tags: ["healthy-fats", "fiber"],
  },
  {
    name: "Brown Rice",
    calories: 112,
    protein: "2.6g",
    carbs: "24g",
    fat: "0.9g",
    benefit: "Whole grain energy source with B vitamins.",
    image: "🍚",
    category: "Carbs",
    tags: ["complex-carbs", "energy"],
  },
  {
    name: "Greek Yogurt",
    calories: 100,
    protein: "17g",
    carbs: "6g",
    fat: "0.7g",
    benefit: "High protein with probiotics for gut health.",
    image: "🥛",
    category: "Protein",
    tags: ["high-protein", "probiotic", "low-fat"],
  },
  {
    name: "Almonds",
    calories: 164,
    protein: "6g",
    carbs: "6g",
    fat: "14g",
    benefit: "Nutrient-dense snack with vitamin E.",
    image: "🌰",
    category: "Fats",
    tags: ["healthy-fats", "snack"],
  },
  {
    name: "Spinach",
    calories: 23,
    protein: "2.9g",
    carbs: "3.6g",
    fat: "0.4g",
    benefit: "Iron and vitamins powerhouse for recovery.",
    image: "🥬",
    category: "Vegetables",
    tags: ["low-calorie", "vitamins"],
  },
  {
    name: "Oatmeal",
    calories: 150,
    protein: "5g",
    carbs: "27g",
    fat: "3g",
    benefit: "Fiber-rich breakfast for sustained energy.",
    image: "🥣",
    category: "Carbs",
    tags: ["fiber", "breakfast", "complex-carbs"],
  },
  {
    name: "Blueberries",
    calories: 57,
    protein: "0.7g",
    carbs: "14g",
    fat: "0.3g",
    benefit: "Antioxidants for recovery and brain health.",
    image: "🫐",
    category: "Fruit",
    tags: ["antioxidants", "low-calorie"],
  },
  {
    name: "Tuna",
    calories: 132,
    protein: "28g",
    carbs: "0g",
    fat: "1.3g",
    benefit: "Ultra lean protein source, perfect for cutting.",
    image: "🐟",
    category: "Protein",
    tags: ["high-protein", "low-fat", "lean"],
  },
  {
    name: "Quinoa",
    calories: 120,
    protein: "4.4g",
    carbs: "21g",
    fat: "1.9g",
    benefit: "Complete plant protein with all amino acids.",
    image: "🌾",
    category: "Carbs",
    tags: ["plant-protein", "complex-carbs"],
  },
  {
    name: "Broccoli",
    calories: 34,
    protein: "2.8g",
    carbs: "7g",
    fat: "0.4g",
    benefit: "High in vitamins C and K, low calorie.",
    image: "🥦",
    category: "Vegetables",
    tags: ["low-calorie", "vitamins", "fiber"],
  },
];

async function seedFoods() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clear existing foods
    await Food.deleteMany({});
    console.log('🗑️ Cleared existing foods');

    // Insert new foods
    const result = await Food.insertMany(foods);
    console.log(`✅ Seeded ${result.length} foods successfully`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
}

seedFoods();