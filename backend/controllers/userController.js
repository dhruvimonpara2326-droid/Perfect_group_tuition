const User = require('../models/User');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// GET /api/users/students
const getStudents = async (req, res) => {
  try {
    const { standard, batch } = req.query;
    const filter = { role: 'student' };
    if (standard) filter.standard = standard;
    if (batch) filter.batch = batch;
    const students = await User.find(filter).select('-password').sort({ rollNo: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/faculty
const getFaculty = async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' }).select('-password').sort({ name: 1 });
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/faculty  (Admin creates faculty)
const createFaculty = async (req, res) => {
  try {
    const { username, password, name, email, mobile, subject } = req.body;

    if (!username || !password || !name || !email) {
      return res.status(400).json({ message: 'Username, password, name and email are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email address already registered' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = await User.create({
      username,
      password,
      name,
      email: email.toLowerCase(),
      mobile,
      subject,
      role: 'faculty'
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Welcome to Perfect Group Tuition - Faculty Account',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #1e3a8a; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Perfect Group Tuition</h2>
          <h3 style="color: #334155;">Faculty Account Created</h3>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>An administrator has created your faculty account on the portal.</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #334155;"><strong>Login Portal:</strong> <a href="http://localhost:5173/login">Click Here</a></p>
            <p style="margin: 5px 0; color: #334155;"><strong>Username:</strong> ${username}</p>
            <p style="margin: 5px 0; color: #334155;"><strong>Password:</strong> ${password}</p>
            <p style="margin: 5px 0; color: #334155;"><strong>Subject:</strong> ${subject}</p>
          </div>
          <p>Please login to the portal using these credentials. We recommend keeping this email safe.</p>
          <p style="color: #64748b; font-size: 14px;">Regards,<br><strong>Perfect Group Administration</strong></p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailError) {
      console.error('Failed to send faculty welcome email:', mailError);
    }

    res.status(201).json({
      _id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      subject: user.subject
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = req.body;
    // Don't allow role changes through this endpoint
    delete updates.role;
    // If password is being updated, let the pre-save hook handle hashing
    if (updates.password) {
      user.password = updates.password;
      delete updates.password;
    }

    Object.assign(user, updates);
    await user.save();

    const updatedUser = await User.findById(req.params.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/stats
const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });

    // Get students per standard
    const standardGroups = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$standard', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalStudents,
      totalFaculty,
      standardGroups
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStudents, getFaculty, createFaculty, updateUser, deleteUser, getDashboardStats };
