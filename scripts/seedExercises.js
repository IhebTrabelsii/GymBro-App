import 'dotenv/config';
import mongoose from 'mongoose';
import Exercise from '../models/Exercise.js';
import Plan from '../models/Plan.js';


const MONGO_URI = process.env.MONGO_URI;

// Define exercises for each plan
const exercisesData = {
  // Ectomorph Mass Blueprint Exercises
  ectomorphExercises: [
    {
      name: "Barbell Bench Press",
      category: "Chest",
      sets: 4,
      reps: "8-10",
      rest: "90 sec",
      difficulty: "Intermediate",
      muscleGroups: ["Chest", "Triceps", "Shoulders"],
      equipment: ["Barbell", "Bench"],
      description: "Compound exercise for building chest mass and strength.",
      tips: ["Keep your back arched", "Drive through your heels", "Lower the bar to your sternum"],
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=ejI1Nlsul9k",
      calories: "120-150",
      popularity: 98,
      expertTip: "Touch the bar to your sternum, not your chest, for better pec activation"
    },
    {
      name: "Weighted Pull-Ups",
      category: "Back",
      sets: 4,
      reps: "6-10",
      rest: "75 sec",
      difficulty: "Advanced",
      muscleGroups: ["Back", "Biceps", "Forearms"],
      equipment: ["Pull-up Bar", "Weight Belt"],
      description: "Ultimate back width builder and strength developer.",
      tips: ["Squeeze your shoulder blades", "Pull your chest to the bar", "Control the descent"],
      imageUrl: "https://images.unsplash.com/photo-1598971639058-999901d212d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "100-130",
      popularity: 95,
      expertTip: "Add weight only when you can do 12+ strict bodyweight pull-ups"
    },
    {
      name: "Barbell Squat",
      category: "Legs",
      sets: 4,
      reps: "8-12",
      rest: "120 sec",
      difficulty: "Advanced",
      muscleGroups: ["Quads", "Glutes", "Hamstrings", "Core"],
      equipment: ["Barbell", "Squat Rack"],
      description: "King of all exercises for total lower body development.",
      tips: ["Keep your chest up", "Break at the hips first", "Go below parallel"],
      imageUrl: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "150-200",
      popularity: 99,
      expertTip: "Point your toes slightly outward and track knees over toes"
    },
    {
      name: "Standing Overhead Press",
      category: "Shoulders",
      sets: 3,
      reps: "8-10",
      rest: "90 sec",
      difficulty: "Intermediate",
      muscleGroups: ["Shoulders", "Triceps", "Core"],
      equipment: ["Barbell"],
      description: "Build powerful shoulders and improve upper body strength.",
      tips: ["Squeeze your glutes", "Keep your core tight", "Press directly overhead"],
      imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "90-120",
      popularity: 92,
      expertTip: "Don't flare your ribs - keep your core braced throughout"
    },
    {
      name: "Conventional Deadlift",
      category: "Back",
      sets: 3,
      reps: "5-8",
      rest: "150 sec",
      difficulty: "Advanced",
      muscleGroups: ["Back", "Glutes", "Hamstrings", "Forearms"],
      equipment: ["Barbell"],
      description: "Ultimate full-body strength builder.",
      tips: ["Keep the bar close", "Drive through your heels", "Lock your lats"],
      imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "180-220",
      popularity: 97,
      expertTip: "Pull the slack out of the bar before lifting - hear the 'click'"
    },
    {
      name: "Dumbbell Incline Press",
      category: "Chest",
      sets: 3,
      reps: "10-12",
      rest: "60 sec",
      difficulty: "Beginner",
      muscleGroups: ["Upper Chest", "Triceps"],
      equipment: ["Dumbbells", "Incline Bench"],
      description: "Target upper chest for balanced development.",
      tips: ["Keep shoulders pinned back", "Don't arch excessively", "Squeeze at the top"],
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "80-110",
      popularity: 88,
      expertTip: "Don't let the dumbbells touch at the top - keep tension"
    },
  ],
  
  // Mesomorph Athletic Performer Exercises
  mesomorphExercises: [
    {
      name: "Dumbbell Bench Press",
      category: "Chest",
      sets: 3,
      reps: "10-12",
      rest: "60 sec",
      difficulty: "Beginner",
      muscleGroups: ["Chest", "Triceps", "Shoulders"],
      equipment: ["Dumbbells", "Bench"],
      description: "Great for chest development and stability.",
      tips: ["Control the dumbbells", "Squeeze at the top", "Keep shoulders back"],
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "100-130",
      popularity: 94,
      expertTip: "Keep your shoulders pinned back on the bench"
    },
    {
      name: "Lat Pulldown",
      category: "Back",
      sets: 3,
      reps: "12-15",
      rest: "60 sec",
      difficulty: "Beginner",
      muscleGroups: ["Back", "Biceps"],
      equipment: ["Cable Machine"],
      description: "Build back width and strength.",
      tips: ["Pull to your upper chest", "Squeeze at the bottom", "Control the weight"],
      imageUrl: "https://images.unsplash.com/photo-1598971639058-999901d212d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "80-110",
      popularity: 91,
      expertTip: "Lean back slightly and pull to your upper chest"
    },
    {
      name: "Leg Press",
      category: "Legs",
      sets: 4,
      reps: "12-15",
      rest: "75 sec",
      difficulty: "Beginner",
      muscleGroups: ["Quads", "Glutes", "Hamstrings"],
      equipment: ["Leg Press Machine"],
      description: "Build leg mass safely.",
      tips: ["Don't lock your knees", "Control the weight", "Full range of motion"],
      imageUrl: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "110-140",
      popularity: 89,
      expertTip: "Keep your back flat against the pad"
    },
    {
      name: "Dumbbell Lateral Raises",
      category: "Shoulders",
      sets: 3,
      reps: "15-20",
      rest: "45 sec",
      difficulty: "Beginner",
      muscleGroups: ["Shoulders"],
      equipment: ["Dumbbells"],
      description: "Build shoulder width and definition.",
      tips: ["Light weight, high reps", "Lead with your elbows", "Control the negative"],
      imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "70-90",
      popularity: 93,
      expertTip: "Don't use momentum - control the movement"
    },
    {
      name: "Barbell Rows",
      category: "Back",
      sets: 3,
      reps: "10-12",
      rest: "75 sec",
      difficulty: "Intermediate",
      muscleGroups: ["Back", "Biceps"],
      equipment: ["Barbell"],
      description: "Build back thickness.",
      tips: ["Keep your back straight", "Pull to your stomach", "Squeeze at the top"],
      imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "120-150",
      popularity: 96,
      expertTip: "Pull the bar to your lower chest/stomach"
    },
  ],
  
  // Endomorph Fat Torcher Exercises
  endomorphExercises: [
    {
      name: "Burpees",
      category: "HIIT",
      sets: 4,
      reps: "15-20",
      rest: "30 sec",
      difficulty: "Intermediate",
      muscleGroups: ["Full Body", "Cardio"],
      equipment: ["None"],
      description: "Full body explosive movement for fat burning.",
      tips: ["Keep your core tight", "Jump explosively", "Land softly"],
      imageUrl: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "200-250",
      popularity: 97,
      expertTip: "Push through your heels when jumping up"
    },
    {
      name: "Kettlebell Swings",
      category: "Full Body",
      sets: 4,
      reps: "20-25",
      rest: "45 sec",
      difficulty: "Intermediate",
      muscleGroups: ["Glutes", "Hamstrings", "Core", "Cardio"],
      equipment: ["Kettlebell"],
      description: "Explosive hip movement for power and conditioning.",
      tips: ["Hinge at the hips", "Squeeze glutes at top", "Keep your back straight"],
      imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "180-220",
      popularity: 95,
      expertTip: "Let the kettlebell float, don't lift with your arms"
    },
    {
      name: "Box Jumps",
      category: "Plyometrics",
      sets: 3,
      reps: "10-12",
      rest: "60 sec",
      difficulty: "Advanced",
      muscleGroups: ["Legs", "Cardio"],
      equipment: ["Box", "Plyo Box"],
      description: "Explosive leg power and cardio.",
      tips: ["Land softly", "Step down, don't jump", "Use your arms"],
      imageUrl: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "150-180",
      popularity: 92,
      expertTip: "Start with a lower box and focus on form"
    },
    {
      name: "Battle Ropes",
      category: "Cardio",
      sets: 3,
      reps: "30 sec",
      rest: "30 sec",
      difficulty: "Intermediate",
      muscleGroups: ["Shoulders", "Arms", "Core", "Cardio"],
      equipment: ["Battle Ropes"],
      description: "Intense full body conditioning.",
      tips: ["Keep your knees soft", "Generate from your core", "Alternate waves"],
      imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "160-200",
      popularity: 90,
      expertTip: "Keep your back straight and engage your core"
    },
    {
      name: "Mountain Climbers",
      category: "HIIT",
      sets: 4,
      reps: "30 sec",
      rest: "20 sec",
      difficulty: "Beginner",
      muscleGroups: ["Full Body", "Cardio", "Core"],
      equipment: ["None"],
      description: "Great for cardio and core stability.",
      tips: ["Keep your hips down", "Drive your knees", "Maintain pace"],
      imageUrl: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example",
      calories: "120-150",
      popularity: 88,
      expertTip: "Keep your shoulders over your wrists"
    },
  ],
};

async function seedExercises() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clear existing exercises
    await Exercise.deleteMany({});
    console.log('🗑️ Cleared existing exercises');

    // Create exercises
    const ectomorphExercises = await Exercise.insertMany(exercisesData.ectomorphExercises);
    const mesomorphExercises = await Exercise.insertMany(exercisesData.mesomorphExercises);
    const endomorphExercises = await Exercise.insertMany(exercisesData.endomorphExercises);
    
    console.log(`✅ Created ${ectomorphExercises.length} Ectomorph exercises`);
    console.log(`✅ Created ${mesomorphExercises.length} Mesomorph exercises`);
    console.log(`✅ Created ${endomorphExercises.length} Endomorph exercises`);

    // Find plans and link exercises
    const ectomorphPlan = await Plan.findOne({ title: "Ectomorph Mass Blueprint" });
    const mesomorphPlan = await Plan.findOne({ title: "Mesomorph Athletic Performer" });
    const endomorphPlan = await Plan.findOne({ title: "Endomorph Fat Torcher" });

    if (ectomorphPlan) {
      ectomorphPlan.exercises = ectomorphExercises.map(ex => ex._id);
      await ectomorphPlan.save();
      console.log(`✅ Linked ${ectomorphExercises.length} exercises to Ectomorph Mass Blueprint`);
    }

    if (mesomorphPlan) {
      mesomorphPlan.exercises = mesomorphExercises.map(ex => ex._id);
      await mesomorphPlan.save();
      console.log(`✅ Linked ${mesomorphExercises.length} exercises to Mesomorph Athletic Performer`);
    }

    if (endomorphPlan) {
      endomorphPlan.exercises = endomorphExercises.map(ex => ex._id);
      await endomorphPlan.save();
      console.log(`✅ Linked ${endomorphExercises.length} exercises to Endomorph Fat Torcher`);
    }

    console.log('🎉 Seeding completed successfully!');
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
}

seedExercises();