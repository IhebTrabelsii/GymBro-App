import mongoose from 'mongoose';

const dailyDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  activityLevel: {
    type: String,  // ← Remove the enum, just use String
    required: true,
  },
  bmi: {
    type: Number,
    required: true,
  },
  bmr: {
    type: Number,
    required: true,
  },
  tdee: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

dailyDataSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyData = mongoose.model('DailyData', dailyDataSchema);

export default DailyData;