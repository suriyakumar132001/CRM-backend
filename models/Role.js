const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "admin", "user"
  permissions: {
    type: [String],
    default: [],
  }, // e.g. ["manage_users", "view_all_data"]
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);