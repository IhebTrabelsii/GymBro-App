import mongoose from 'mongoose';

const PlanSchema = new mongoose.Schema({
  // Basic info
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Body type classification
  bodyType: { 
    type: String, 
    required: true,
    enum: ['Ectomorph', 'Mesomorph', 'Endomorph']
  },
  
  // Focus/Goal
  focus: { type: String, required: true },
  
  // Workout days/schedule
  days: [{ type: String, required: true }],
  
  // Tips for this plan
  tips: { type: String, required: true },
  
  // Metadata
  icon: { 
    type: String, 
    default: 'fitness',
    enum: ['leaf', 'arm-flex', 'run', 'barbell', 'fitness', 'flash', 'run-fast']
  },
  
  // Admin who created it
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp on save
PlanSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Plan', PlanSchema);