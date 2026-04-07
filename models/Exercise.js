import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, enum: ['Compound', 'Isolation', 'Accessory', 'Cardio', 'HIIT', 'Plyometrics'], default: 'Compound' },
  sets: { type: Number, required: true },
  reps: { type: String, required: true },
  rest: { type: String, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  muscleGroups: [{ type: String }],
  primaryMuscle: { type: String },
  secondaryMuscles: [{ type: String }],
  equipment: [{ type: String }],
  description: { type: String, required: true },
  tips: [{ type: String }],
  imageUrl: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  gifUrl: { type: String, default: '' },
  calories: { type: String, default: '' },
  popularity: { type: Number, default: 0 },
  expertTip: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Exercise', exerciseSchema);