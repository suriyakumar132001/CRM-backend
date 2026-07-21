const Policy = require('../models/Policy');

exports.getPolicies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = { owner: req.user.id };

    if (req.query.product) filter.product = req.query.product;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

    const [policies, total] = await Promise.all([
      Policy.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Policy.countDocuments(filter),
    ]);

    res.json({
      data: policies,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPolicy = async (req, res) => {
  try {
    const policy = await Policy.findOne({ _id: req.params.id, owner: req.user.id });
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createPolicy = async (req, res) => {
  try {
    const policy = await Policy.create({ ...req.body, owner: req.user.id });
    res.status(201).json(policy);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Policy number already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const policy = await Policy.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    const policy = await Policy.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json({ message: 'Policy deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteAllPolicies = async (req, res) => {
  try {
    const result = await Policy.deleteMany({ owner: req.user.id });
    res.json({ message: 'All policies deleted', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getExpiringPolicies = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const policies = await Policy.find({
      owner: req.user.id,
      policyEndDate: { $gte: today, $lte: futureDate },
    }).sort({ policyEndDate: 1 });

    res.json({ data: policies, count: policies.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.getTodayPolicies = async (req, res) => {
  try {
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

    const isAdmin = ['super Admin', 'Admin'].includes(req.user.role);
    const filter = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    };
    if (!isAdmin) filter.owner = req.user.id;

    const policies = await Policy.find(filter).sort({ createdAt: -1 });
    const totalAmount = policies.reduce((sum, p) => sum + (p.txnAmount || 0), 0);

    res.json({
      date: startOfDay.toISOString().split('T')[0],
      count: policies.length,
      totalAmount,
      data: policies,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};