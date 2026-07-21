const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  company: { type: String },
  jobTitle: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);