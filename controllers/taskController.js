const Task = require('../models/Task');
const Policy = require('../models/Policy');
const User = require('../models/User');
const mongoose = require('mongoose');


// @route GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const { completed } = req.query;
    const filter = { owner: req.user.id };
    if (completed !== undefined) filter.completed = completed === 'true';

    const tasks = await Task.find(filter).sort({ dueDate: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, relatedTo } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const task = await Task.create({
      owner: req.user.id, title, description, dueDate, priority, relatedTo,
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route PATCH /api/tasks/:id/toggle
exports.toggleTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// @route GET /api/stats/agent-wise
// Admin only — shows how many policies each agent sold and total amount collected
exports.getAgentWiseStats = async (req, res) => {
  try {
    const { from, to } = req.query; // optional date range filters

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

    // Join with User to get agent names
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


