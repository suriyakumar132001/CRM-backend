const Contact = require('../models/Contact');
const Lead = require('../models/Lead');
const Policy = require('../models/Policy');
const User = require('../models/User');
const mongoose = require('mongoose');

// @route GET /api/stats
exports.getStats = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const totalContacts = await Contact.countDocuments({ owner: ownerId });
    const totalLeads = await Lead.countDocuments({ owner: ownerId });

    const leadsByStatus = await Lead.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(ownerId) } },
      { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$value' } } },
    ]);

    const pipelineValue = await Lead.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(ownerId), status: { $nin: ['won', 'lost'] } } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]);

    const wonValue = await Lead.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(ownerId), status: 'won' } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]);

    res.json({
      totalContacts,
      totalLeads,
      leadsByStatus,
      pipelineValue: pipelineValue[0]?.total || 0,
      wonValue: wonValue[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route GET /api/stats/agent-wise
exports.getAgentWiseStats = async (req, res) => {
  try {
    const { from, to } = req.query;

    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    const agentStats = await Policy.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$owner',
          policyCount: { $sum: 1 },
          totalAmount: { $sum: '$txnAmount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const userIds = agentStats.map((a) => a._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name email');
    const userMap = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    const result = agentStats.map((a) => ({
      agentId: a._id,
      agentName: userMap[a._id?.toString()]?.name || 'Unknown Agent',
      agentEmail: userMap[a._id?.toString()]?.email || '',
      policyCount: a.policyCount,
      totalAmount: a.totalAmount,
    }));

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};