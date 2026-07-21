const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  company: { type: String },
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'cold_call', 'event', 'other'],
    default: 'other',
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
    default: 'new',
  },
  value: { type: Number, default: 0 }, // estimated deal value
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);