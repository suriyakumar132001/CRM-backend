const Payout = require('../models/Payout');

exports.getPayouts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = { owner: req.user.id };

    if (req.query.type) filter.type = req.query.type;

    const [payouts, total] = await Promise.all([
      Payout.find(filter).populate('policy', 'policyNumber vehicleNumber').sort({ date: -1 }).skip(skip).limit(limit),
      Payout.countDocuments(filter),
    ]);

    res.json({
      data: payouts,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createPayout = async (req, res) => {
  try {
    const payout = await Payout.create({ ...req.body, owner: req.user.id });
    res.status(201).json(payout);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updatePayout = async (req, res) => {
  try {
    const payout = await Payout.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!payout) return res.status(404).json({ message: 'Payout not found' });
    res.json(payout);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deletePayout = async (req, res) => {
  try {
    const payout = await Payout.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!payout) return res.status(404).json({ message: 'Payout not found' });
    res.json({ message: 'Payout deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};