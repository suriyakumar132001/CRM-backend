const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, enum: ['daily', 'monthly'], required: true },
  policyTarget: { type: Number, default: 0 },     // number of policies
  premiumTarget: { type: Number, default: 0 },    // total ₹ target
}, { timestamps: true });

module.exports = mongoose.model('Target', targetSchema);