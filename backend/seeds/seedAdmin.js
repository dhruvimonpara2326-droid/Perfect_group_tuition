const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.username, '|', existingAdmin.email);

      // If the existing admin doesn't have the correct email, update it
      if (existingAdmin.email !== process.env.ADMIN_EMAIL?.toLowerCase()) {
        existingAdmin.email = process.env.ADMIN_EMAIL?.toLowerCase() || existingAdmin.email;
        await existingAdmin.save();
        console.log('✅ Admin email updated to:', existingAdmin.email);
      }

      process.exit(0);
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'perfectgrouptuition@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const admin = await User.create({
      username: 'admin',
      password: adminPassword,
      name: 'Administrator',
      email: adminEmail.toLowerCase(),
      role: 'admin',
      mobile: '9824156290'
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Login Email :', adminEmail);
    console.log('   Login Pass  : (as set in ADMIN_PASSWORD env)');
    console.log('   Username    : admin');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
