const mongoose = require('mongoose');
const Policy = require('../models/Policy');
const Payout = require('../models/Payout');
const Contact = require('../models/Contact');
const Target = require('../models/Target');

exports.getDailyReport = async (req, res) => {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user.id);

    const dateParam = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(new Date(dateParam).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(dateParam).setHours(23, 59, 59, 999));

    const policiesToday = await Policy.find({
      owner: ownerId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const totalPremiumToday = policiesToday.reduce((sum, p) => sum + (p.txnAmount || 0), 0);

    const payoutsAgg = await Payout.aggregate([
      { $match: { owner: ownerId, date: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const payoutSummary = { commission: { total: 0, count: 0 }, claim: { total: 0, count: 0 }, premium: { total: 0, count: 0 } };
    payoutsAgg.forEach((p) => {
      payoutSummary[p._id] = { total: p.total, count: p.count };
    });

    const newCustomersToday = await Contact.countDocuments({
      owner: ownerId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const target = await Target.findOne({ owner: ownerId, period: 'daily' });

    res.json({
      date: startOfDay.toISOString().split('T')[0],
      policiesSold: policiesToday.length,
      totalPremiumCollected: totalPremiumToday,
      payoutSummary,
      newCustomers: newCustomersToday,
      target: target ? {
        policyTarget: target.policyTarget,
        premiumTarget: target.premiumTarget,
        policyProgress: target.policyTarget > 0 ? Math.round((policiesToday.length / target.policyTarget) * 100) : null,
        premiumProgress: target.premiumTarget > 0 ? Math.round((totalPremiumToday / target.premiumTarget) * 100) : null,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getReportRange = async (req, res) => {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user.id);
    const days = parseInt(req.query.days) || 7;
    const results = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(new Date(d).setHours(0, 0, 0, 0));
      const endOfDay = new Date(new Date(d).setHours(23, 59, 59, 999));

      const [policyCount, premiumAgg] = await Promise.all([
        Policy.countDocuments({ owner: ownerId, createdAt: { $gte: startOfDay, $lte: endOfDay } }),
        Policy.aggregate([
          { $match: { owner: ownerId, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
          { $group: { _id: null, total: { $sum: '$txnAmount' } } },
        ]),
      ]);

      results.push({
        date: startOfDay.toISOString().split('T')[0],
        policiesSold: policyCount,
        premium: premiumAgg[0]?.total || 0,
      });
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.setTarget = async (req, res) => {
  try {
    const { period, policyTarget, premiumTarget } = req.body;
    const target = await Target.findOneAndUpdate(
      { owner: req.user.id, period: period || 'daily' },
      { policyTarget, premiumTarget, owner: req.user.id, period: period || 'daily' },
      { new: true, upsert: true }
    );
    res.json(target);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};