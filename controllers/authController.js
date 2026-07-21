const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.roleId?.name || null,
  permissions: user.roleId?.permissions || [],
});

// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, roleId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    let finalRoleId = roleId;
    if (!finalRoleId) {
      const defaultRole = await Role.findOne({ name: 'Student' });
      finalRoleId = defaultRole?._id;
    }

    let user = await User.create({ name, email, password, roleId: finalRoleId });
    user = await user.populate('roleId');
    const token = generateToken(user._id);

    res.status(201).json({ token, user: formatUser(user) });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).populate('roleId');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({ token, user: formatUser(user) });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('roleId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(formatUser(user));
  } catch (err) {
    console.error('GET ME ERROR:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};