import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  calories: {
    type: Number,
    required: true,
  },
  protein: {
    type: String,
    required: true,
  },
  carbs: {
    type: String,
    required: true,
  },
  fat: {
    type: String,
    required: true,
  },
  benefit: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '🍗',
  },
  category: {
    type: String,
    enum: ['Protein', 'Carbs', 'Fats', 'Fruit', 'Vegetables'],
    required: true,
  },
  tags: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Food = mongoose.model('Food', foodSchema);

export default Food;