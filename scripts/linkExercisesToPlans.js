import 'dotenv/config';
import mongoose from 'mongoose';
import Plan from '../models/Plan.js';
import Exercise from '../models/Exercise.js';

const MONGO_URI = process.env.MONGO_URI;

// Define exercises for each body type with REAL YouTube URLs
const exercisesByBodyType = {
  Ectomorph: [
    { name: "Barbell Bench Press", category: "Chest", sets: 4, reps: "8-10", rest: "90 sec", difficulty: "Intermediate", muscleGroups: ["Chest", "Triceps", "Shoulders"], equipment: ["Barbell", "Bench"], description: "Compound exercise for building chest mass.", tips: ["Keep your back arched", "Drive through your heels"], imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b", videoUrl: "https://www.youtube.com/watch?v=ejI1Nlsul9k", calories: "120-150", popularity: 98, expertTip: "Touch the bar to your sternum" },
    { name: "Weighted Pull-Ups", category: "Back", sets: 4, reps: "6-10", rest: "75 sec", difficulty: "Advanced", muscleGroups: ["Back", "Biceps"], equipment: ["Pull-up Bar"], description: "Build back width.", tips: ["Squeeze shoulder blades"], imageUrl: "https://images.unsplash.com/photo-1598971639058-999901d212d1", videoUrl: "https://www.youtube.com/watch?v=eGo4IYjbEzg", calories: "100-130", popularity: 95, expertTip: "Add weight progressively" },
    { name: "Barbell Squat", category: "Legs", sets: 4, reps: "8-12", rest: "120 sec", difficulty: "Advanced", muscleGroups: ["Quads", "Glutes"], equipment: ["Barbell"], description: "King of leg exercises.", tips: ["Keep chest up"], imageUrl: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a", videoUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8", calories: "150-200", popularity: 99, expertTip: "Go below parallel" },
    { name: "Deadlift", category: "Back", sets: 3, reps: "5-8", rest: "150 sec", difficulty: "Advanced", muscleGroups: ["Back", "Glutes"], equipment: ["Barbell"], description: "Full body strength builder.", tips: ["Keep bar close"], imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd", videoUrl: "https://www.youtube.com/watch?v=r4MzxtBKyNE", calories: "180-220", popularity: 97, expertTip: "Pull the slack out" },
    { name: "Overhead Press", category: "Shoulders", sets: 3, reps: "8-10", rest: "90 sec", difficulty: "Intermediate", muscleGroups: ["Shoulders", "Triceps"], equipment: ["Barbell"], description: "Build shoulder power.", tips: ["Squeeze glutes"], imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e", videoUrl: "https://www.youtube.com/watch?v=2yjwXTZQDDI", calories: "90-120", popularity: 92, expertTip: "Press directly overhead" },
  ],
  Mesomorph: [
    { name: "Dumbbell Bench Press", category: "Chest", sets: 3, reps: "10-12", rest: "60 sec", difficulty: "Beginner", muscleGroups: ["Chest", "Triceps"], equipment: ["Dumbbells"], description: "Great for chest development.", tips: ["Control the dumbbells"], imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b", videoUrl: "https://www.youtube.com/watch?v=VmB1G1K7v94", calories: "100-130", popularity: 94, expertTip: "Keep shoulders pinned back" },
    { name: "Lat Pulldown", category: "Back", sets: 3, reps: "12-15", rest: "60 sec", difficulty: "Beginner", muscleGroups: ["Back", "Biceps"], equipment: ["Cable Machine"], description: "Build back width.", tips: ["Pull to upper chest"], imageUrl: "https://images.unsplash.com/photo-1598971639058-999901d212d1", videoUrl: "https://www.youtube.com/watch?v=CAwf7n6Luuc", calories: "80-110", popularity: 91, expertTip: "Lean back slightly" },
    { name: "Leg Press", category: "Legs", sets: 4, reps: "12-15", rest: "75 sec", difficulty: "Beginner", muscleGroups: ["Quads", "Glutes"], equipment: ["Leg Press"], description: "Build leg mass safely.", tips: ["Don't lock knees"], imageUrl: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a", videoUrl: "https://www.youtube.com/watch?v=IZxyjW7MPJQ", calories: "110-140", popularity: 89, expertTip: "Keep back flat" },
    { name: "Dumbbell Lateral Raises", category: "Shoulders", sets: 3, reps: "15-20", rest: "45 sec", difficulty: "Beginner", muscleGroups: ["Shoulders"], equipment: ["Dumbbells"], description: "Build shoulder width.", tips: ["Light weight, high reps"], imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e", videoUrl: "https://www.youtube.com/watch?v=3VcKaXpzqH4", calories: "70-90", popularity: 93, expertTip: "Lead with elbows" },
    { name: "Barbell Rows", category: "Back", sets: 3, reps: "10-12", rest: "75 sec", difficulty: "Intermediate", muscleGroups: ["Back", "Biceps"], equipment: ["Barbell"], description: "Build back thickness.", tips: ["Pull to stomach"], imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd", videoUrl: "https://www.youtube.com/watch?v=G8l_8chR5BE", calories: "120-150", popularity: 96, expertTip: "Squeeze at top" },
  ],
  Endomorph: [
    { name: "Burpees", category: "HIIT", sets: 4, reps: "15-20", rest: "30 sec", difficulty: "Intermediate", muscleGroups: ["Full Body"], equipment: ["None"], description: "Full body fat burner.", tips: ["Jump explosively"], imageUrl: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a", videoUrl: "https://www.youtube.com/watch?v=TU8QYVW0gDU", calories: "200-250", popularity: 97, expertTip: "Push through heels" },
    { name: "Kettlebell Swings", category: "Full Body", sets: 4, reps: "20-25", rest: "45 sec", difficulty: "Intermediate", muscleGroups: ["Glutes", "Core"], equipment: ["Kettlebell"], description: "Explosive hip movement.", tips: ["Hinge at hips"], imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd", videoUrl: "https://www.youtube.com/watch?v=ZQo_fTVGSHk", calories: "180-220", popularity: 95, expertTip: "Let it float" },
    { name: "Box Jumps", category: "Plyometrics", sets: 3, reps: "10-12", rest: "60 sec", difficulty: "Advanced", muscleGroups: ["Legs"], equipment: ["Box"], description: "Explosive leg power.", tips: ["Land softly"], imageUrl: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a", videoUrl: "https://www.youtube.com/watch?v=52r_Ul5k03k", calories: "150-180", popularity: 92, expertTip: "Step down, don't jump" },
    { name: "Battle Ropes", category: "Cardio", sets: 3, reps: "30 sec", rest: "30 sec", difficulty: "Intermediate", muscleGroups: ["Shoulders", "Core"], equipment: ["Battle Ropes"], description: "Intense conditioning.", tips: ["Keep knees soft"], imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd", videoUrl: "https://www.youtube.com/watch?v=d9EcnKQIxPE", calories: "160-200", popularity: 90, expertTip: "Engage core" },
    { name: "Mountain Climbers", category: "HIIT", sets: 4, reps: "30 sec", rest: "20 sec", difficulty: "Beginner", muscleGroups: ["Full Body"], equipment: ["None"], description: "Great for cardio.", tips: ["Keep hips down"], imageUrl: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a", videoUrl: "https://www.youtube.com/watch?v=nmwgirgXLYM", calories: "120-150", popularity: 88, expertTip: "Drive knees" },
  ],
};

async function linkExercises() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clear existing exercises
    await Exercise.deleteMany({});
    console.log('🗑️ Cleared existing exercises');

    // Create exercises for each body type
    const createdExercises = {};
    
    for (const [bodyType, exercises] of Object.entries(exercisesByBodyType)) {
      const inserted = await Exercise.insertMany(exercises);
      createdExercises[bodyType] = inserted;
      console.log(`✅ Created ${inserted.length} exercises for ${bodyType}`);
    }

    // Find plans and link exercises
    const ectomorphPlans = await Plan.find({ bodyType: 'Ectomorph' });
    const mesomorphPlans = await Plan.find({ bodyType: 'Mesomorph' });
    const endomorphPlans = await Plan.find({ bodyType: 'Endomorph' });

    // Link Ectomorph exercises
    for (const plan of ectomorphPlans) {
      plan.exercises = createdExercises.Ectomorph.map(ex => ex._id);
      await plan.save();
      console.log(`✅ Linked ${plan.exercises.length} exercises to "${plan.title}"`);
    }

    // Link Mesomorph exercises
    for (const plan of mesomorphPlans) {
      plan.exercises = createdExercises.Mesomorph.map(ex => ex._id);
      await plan.save();
      console.log(`✅ Linked ${plan.exercises.length} exercises to "${plan.title}"`);
    }

    // Link Endomorph exercises
    for (const plan of endomorphPlans) {
      plan.exercises = createdExercises.Endomorph.map(ex => ex._id);
      await plan.save();
      console.log(`✅ Linked ${plan.exercises.length} exercises to "${plan.title}"`);
    }

    console.log('\n🎉 All exercises linked successfully!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

linkExercises();