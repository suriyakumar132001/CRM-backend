const mongoose = require('mongoose');

const misPolicySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleNumber: { type: String, required: true },
  clientName: { type: String, required: true },
  policyNumber: { type: String, required: true, unique: true },
  insuranceCompany: { type: String },
  segment: { type: String }, // e.g. GCV, PRIVATE CAR, PCV 3 WHEELER
  makeModel: { type: String },
  gvw: { type: Number, default: 0 },
  cc: { type: Number, default: 0 },
  odPremium: { type: Number, default: 0 },   // OD
  tpPremium: { type: Number, default: 0 },   // TP
  netPremium: { type: Number, default: 0 },  // NET
  grossPremium: { type: Number, default: 0 }, // Gross
  sourcePdf: { type: String }, // original filename, for reference
}, { timestamps: true });

module.exports = mongoose.model('MisPolicy', misPolicySchema);