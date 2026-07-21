const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  parentId: { type: String },                 // e.g. LC0000000527
  category: { type: String, default: 'VEHICLE' },
  proposalNumber: { type: String },
  sourceOfPurchase: { type: String },          // e.g. WEB
  orderId: { type: String },
  gatewayTransactionId: { type: String },

  customerName: { type: String, required: true },
  mobileNumber: { type: String },
  email: { type: String },

  policyNumber: { type: String, required: true, unique: true },
  previousPolicyNumber: { type: String },
  policyMainId: { type: String },
  product: {
    type: String,
    enum: ['TWO_WHEELER', 'CAR', 'COMMERCIAL_VEHICLE', 'OTHER'],
    default: 'TWO_WHEELER',
  },
  policyType: {
    type: String,
    enum: ['FRESH', 'RENEWAL', 'ROLLOVER', 'PORT'],
    default: 'FRESH',
  },

  txnAmount: { type: Number, required: true },
  dateOfTxn: { type: Date },
  transactionDate: { type: Date },
  paymentGateway: { type: String },
  paymentStatus: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS',
  },
  paymentSettlementDate: { type: Date },
  paymentSettlementStatus: {
    type: String,
    enum: ['SETTLED', 'PENDING', 'UNSETTLED'],
    default: 'PENDING',
  },
  errorDescription: { type: String },
  finalStatus: { type: String, default: 'SUCCESS' },

  officeCode: { type: String },
  createdBy: { type: String },

  notes: { type: String },

  policyEndDate: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);