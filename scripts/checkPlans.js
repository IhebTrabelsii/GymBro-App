import 'dotenv/config';
import mongoose from 'mongoose';
import Plan from '../models/Plan.js';
import Exercise from '../models/Exercise.js';

const MONGO_URI = process.env.MONGO_URI;

async function checkPlans() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    const plans = await Plan.find();
    
    console.log(`\n📊 Total plans found: ${plans.length}\n`);
    
    for (const plan of plans) {
      console.log(`📋 Plan: ${plan.title}`);
      console.log(`   Body Type: ${plan.bodyType}`);
      console.log(`   Focus: ${plan.focus}`);
      console.log(`   Days: ${plan.days?.length || 0} days/week`);
      console.log(`   Exercises count: ${plan.exercises?.length || 0}`);
      console.log('---');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPlans();