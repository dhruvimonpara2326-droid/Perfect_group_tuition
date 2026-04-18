const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
const registerStudent = async (req, res) => {
  try {
    const { username, password, name, email, mobile, rollNo, batch, standard, role, subject } = req.body;

    // Validate common fields
    if (!username || !password || !name || !email) {
      return res.status(400).json({ message: 'Username, password, name and email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const userRole = role || 'student';

    // Validate role-specific fields
    if (userRole === 'student') {
      if (!mobile || !rollNo || !batch || !standard) {
        return res.status(400).json({ message: 'All student fields are required (mobile, rollNo, batch, standard)' });
      }
    }

    if (userRole === 'faculty') {
      if (!subject) {
        return res.status(400).json({ message: 'Subject is required for faculty registration' });
      }
    }

    if (userRole === 'admin') {
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        return res.status(403).json({ message: 'An administrator account already exists. Only one admin is allowed.' });
      }
    }

    // Check for existing username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check for existing email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email address already registered' });
    }

    // Build user data based on role
    const userData = {
      username,
      password,
      name,
      email: email.toLowerCase(),
      mobile: mobile || '',
      role: userRole,
    };

    if (userRole === 'student') {
      userData.rollNo = rollNo;
      userData.batch = batch;
      userData.standard = standard;
    }

    if (userRole === 'faculty') {
      userData.subject = subject;
    }

    const user = await User.create(userData);

    const responseData = {
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    };

    // Add role-specific fields to response
    if (user.role === 'student') {
      responseData.rollNo = user.rollNo;
      responseData.batch = user.batch;
      responseData.standard = user.standard;
    }

    if (user.role === 'faculty') {
      responseData.subject = user.subject;
    }

    res.status(201).json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // ── Admin login via email (env-defined credentials) ──────────────────────
    // If the entered "username" is the admin email from .env, validate password
    // directly against ADMIN_PASSWORD (plain text comparison) without bcrypt.
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && username.toLowerCase() === adminEmail.toLowerCase()) {
      if (password !== adminPassword) {
        return res.status(401).json({ message: 'Invalid administrator credentials' });
      }

      // Find the admin user record in DB (created via seed)
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        return res.status(404).json({
          message: 'Admin account not found. Please run the seed script first.'
        });
      }

      return res.json({
        _id: adminUser._id,
        username: adminUser.username,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        token: generateToken(adminUser._id)
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Regular login: lookup by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Prevent non-admin users from accessing admin via email shortcut
    res.json({
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      standard: user.standard,
      batch: user.batch,
      subject: user.subject,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address / આ ઈમેલ એડ્રેસ સાથે કોઈ એકાઉન્ટ મળ્યું નથી' });
    }

    // Generate a random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store hashed token and expiry (1 hour) on the user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

    // Send email with reset link
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Link - Perfect Group Tuition',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #1e3a8a; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Perfect Group Tuition</h2>
          <h3 style="color: #334155;">Password Reset Request</h3>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your password. Click the button below to securely reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser: <br><a href="${resetLink}" style="color: #2563eb;">${resetLink}</a></p>
          <p>This link is valid for <strong>1 hour</strong>. If you did not request a password reset, please safely ignore this email.</p>
          <br>
          <p style="color: #64748b; font-size: 14px;">Regards,<br><strong>Perfect Group Tuition Team</strong></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: 'Password reset link sent to your email successfully. Please check your inbox (and spam folder). / તમારા ઈમેલ પર પાસવર્ડ રીસેટ લિંક મોકલવામાં આવી છે.',
      username: user.username,
      name: user.name
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters / પાસવર્ડ ઓછામાં ઓછા 4 અક્ષરનો હોવો જોઈએ' });
    }

    // Hash the incoming token and find matching user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset link. / અમાન્ય અથવા સમયસીમા સમાપ્ત થયેલ પાસવર્ડ રીસેટ લિંક.' });
    }

    // Update password and clear reset fields
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      message: 'Password has been reset successfully. You can now login with your new password. / પાસવર્ડ સફળતાપૂર્વક રીસેટ થયો. હવે તમે નવા પાસવર્ડ સાથે લૉગિન કરી શકો છો.',
      username: user.username
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerStudent, loginUser, getMe, forgotPassword, resetPassword };
