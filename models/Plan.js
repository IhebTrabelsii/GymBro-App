const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  exercises: [String], // Array of exercise descriptions
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Plan', PlanSchema);
