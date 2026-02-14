import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Plan from '../models/Plan.js';

dotenv.config();

const plans = [
  // Ectomorph Plans
  {
    title: "Mass Builder (4 Day Split)",
    bodyType: "Ectomorph",
    description: "Heavy weights, low reps, high calories",
    focus: "Heavy weights, low reps, high calories",
    days: [
      "Monday: Chest/Back - Bench Press 4x6, Pull-ups 4x8, Incline Press 3x8, Rows 3x10",
      "Tuesday: Legs - Squats 4x6, Deadlifts 3x5, Leg Press 3x10, Calf Raises 4x15",
      "Wednesday: Rest + 500 extra calories",
      "Thursday: Shoulders/Arms - Military Press 4x8, Lateral Raises 3x12, Tricep Dips 4x10, Curls 3x12",
      "Friday: Full Body - Clean & Press 4x6, Kettlebell Swings 3x15, Pull-ups 3xMax, Push-ups 3x20",
      "Weekend: Rest + High Carb Meals"
    ],
    tips: "Eat every 3 hours, focus on compound lifts, minimum 8 hours sleep",
    icon: "leaf"
  },
  {
    title: "Strength & Power (3 Day)",
    bodyType: "Ectomorph",
    description: "Powerlifting focus, strength gains",
    focus: "Powerlifting focus, strength gains",
    days: [
      "Monday: Power Day - Squats 5x5, Bench Press 5x5, Power Cleans 4x3",
      "Wednesday: Volume Day - Deadlifts 3x8, Overhead Press 4x6, Weighted Pull-ups 3x5",
      "Friday: Accessory Day - Front Squats 3x8, Incline Bench 3x10, Rows 4x8, Arms 3x12",
      "Rest Days: Active recovery, mobility work"
    ],
    tips: "Heavy weights, long rest periods (3-5 min), progressive overload weekly",
    icon: "barbell"
  },
  
  // Mesomorph Plans
  {
    title: "Push/Pull/Legs (6 Day Split)",
    bodyType: "Mesomorph",
    description: "Balanced muscle growth and definition",
    focus: "Balanced muscle growth and definition",
    days: [
      "Monday: Push - Bench Press 4x10, Shoulder Press 3x12, Tricep Extensions 3x15",
      "Tuesday: Pull - Deadlifts 4x8, Pull-ups 4x10, Rows 3x12, Curls 3x15",
      "Wednesday: Legs - Squats 4x10, Lunges 3x12, Leg Curls 4x15, Calf Raises 5x20",
      "Thursday: Push - Incline Press 4x10, Dips 3x15, Lateral Raises 4x12",
      "Friday: Pull - Barbell Rows 4x10, Lat Pulldowns 3x12, Face Pulls 4x15",
      "Saturday: Legs - Front Squats 4x8, Romanian DL 3x10, Leg Press 4x12",
      "Sunday: Active Recovery"
    ],
    tips: "45-60 min sessions, moderate cardio 3x week, balanced macros",
    icon: "fitness"
  },
  {
    title: "Upper/Lower Split (4 Day)",
    bodyType: "Mesomorph",
    description: "Strength & hypertrophy balance",
    focus: "Strength & hypertrophy balance",
    days: [
      "Monday: Upper Strength - Bench 5x5, Rows 5x5, Shoulder Press 4x8",
      "Tuesday: Lower Strength - Squats 5x5, Deadlifts 3x5, Leg Press 4x10",
      "Thursday: Upper Hypertrophy - Incline DB Press 4x10, Pull-ups 4x12, Arms 3x15",
      "Friday: Lower Hypertrophy - Hack Squats 4x12, Lunges 3x10, Hamstring Curls 4x15",
      "Off Days: 30 min cardio or sports"
    ],
    tips: "Alternate heavy/light weeks, track progress, 1.6g protein/kg bodyweight",
    icon: "arm-flex"
  },
  
  // Endomorph Plans
  {
    title: "Fat Loss Circuit (5 Day)",
    bodyType: "Endomorph",
    description: "High intensity, metabolic conditioning",
    focus: "High intensity, metabolic conditioning",
    days: [
      "Monday: Full Body Circuit - 45 sec work/15 rest: Squats, Push-ups, Rows, Plank, Jumping Jacks x 4 rounds",
      "Tuesday: HIIT Cardio - 20 min: 30 sec sprint/90 sec walk x 10 rounds",
      "Wednesday: Strength Circuit - 3 rounds: Deadlifts 10x, Overhead Press 10x, Lunges 10x each",
      "Thursday: Active Recovery - 45 min brisk walk, stretching",
      "Friday: Metabolic Conditioning - AMRAP 20 min: 5 Burpees, 10 KB Swings, 15 Air Squats",
      "Weekend: 1 hour low intensity cardio"
    ],
    tips: "Keep rest short (30-60 sec), focus on compound movements, intermittent fasting",
    icon: "run-fast"
  },
  {
    title: "Strength & Conditioning (3 Day)",
    bodyType: "Endomorph",
    description: "Build muscle while burning fat",
    focus: "Build muscle while burning fat",
    days: [
      "Monday: Heavy Day - Squats 4x8, Bench Press 4x8, Rows 4x8 (2 min rest)",
      "Wednesday: Conditioning - 10 min warm-up, 20 min EMOM: 1) 10 KB Swings 2) 10 Push-ups 3) 10 Air Squats",
      "Friday: Full Body - Deadlifts 3x6, Shoulder Press 3x10, Pull-ups 3xMax, 15 min HIIT after",
      "Other Days: 45 min steady cardio, core work"
    ],
    tips: "Lift heavy but keep workouts under 60 min, prioritize protein, limit processed carbs",
    icon: "flash"
  }
];

async function seedPlans() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connected to MongoDB');
    
    // Clear existing plans
    await Plan.deleteMany({});
    console.log('🗑️ Cleared existing plans');
    
    // Insert new plans
    const inserted = await Plan.insertMany(plans);
    console.log(`✅ Seeded ${inserted.length} workout plans`);
    
    mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('💥 Seeding error:', error);
    process.exit(1);
  }
}

seedPlans();