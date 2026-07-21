require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const Role = require('./models/Role');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Role.find();
  if (existing.length > 0) {
    console.log('Roles already exist:', existing.map(r => r.name));
    process.exit(0);
  }

  const roles = await Role.insertMany([
    { name: 'admin', permissions: ['manage_users', 'view_all_data', 'delete_any'] },
    { name: 'user', permissions: ['manage_own_data'] },
  ]);

  console.log('Roles created:');
  roles.forEach(r => console.log(`${r.name} → ${r._id}`));
  process.exit(0);
};

seed();