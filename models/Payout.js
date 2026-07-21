const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  policy: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy' }, // optional link
  type: {
    type: String,
    enum: ['commission', 'claim', 'premium'],
    required: true,
  },
  amount: { type: Number, required: true },
  customerName: { type: String },
  description: { type: String },
  date: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);