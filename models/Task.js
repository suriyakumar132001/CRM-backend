const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  completed: { type: Boolean, default: false },
  relatedTo: {
    type: { type: String, enum: ['contact', 'lead', null], default: null },
    id: { type: mongoose.Schema.Types.ObjectId, default: null },
    name: { type: String, default: '' }, // denormalized for quick display
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);