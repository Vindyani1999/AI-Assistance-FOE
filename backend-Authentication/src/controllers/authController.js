// Get current user profile (secure)
exports.getMe = async (req, res) => {
  try {
    // Disable caching for this endpoint
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      email: user.email,
      title: user.title,
      department: user.department,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role
    });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
const { generateOtp, storeOtp, validateOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../services/mailService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');


const otpStore = {}; // In-memory store for demo
const otpVerified = {}; // Tracks OTP verification status per email

// Signup controller
exports.signup = async (req, res) => {
  const { email, password, title, department, firstname, lastname } = req.body;
  if (!otpVerified[email]) {
    return res.status(400).json({ message: 'OTP not verified for this email. Please verify OTP before signing up.' });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    let userFirstname = firstname;
    let userLastname = lastname;
    // Auto-extract first and last name for engug.ruh.ac.lk users if not provided
    if (email.endsWith('@engug.ruh.ac.lk') && (!firstname || !lastname)) {
      // Remove domain and possible trailing _eXX
      let prefix = email.split('@')[0].replace(/_e\d+$/, '');
      const parts = prefix.split('_');
      if (parts.length >= 2) {
        userFirstname = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        userLastname = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      } else if (parts.length === 1) {
        userFirstname = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
    }
    const user = new User({
      email,
      password: hashedPassword,
      title: title || undefined,
      department: department || undefined,
      firstname: userFirstname || undefined,
      lastname: userLastname || undefined
    });
    await user.save();
    // Remove OTP verified flag after successful signup
    delete otpVerified[email];
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.requestOtp = async (req, res) => {
  const { email } = req.body;
  const otp = generateOtp();
  storeOtp(otpStore, email, otp);
  try {
    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP email', error: err.message });
  }
};


// Async version to support DB lookup for lecturers
async function getUserRoleAndName(email) {
  if (!email) return { role: 'unknown', name: null, department: null };
  const [prefix, domain] = email.split('@');
  if (domain === 'engug.ruh.ac.lk') {
    let namePart = prefix.replace(/_[a-zA-Z0-9]+$/, '');
    const name = namePart
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    return { role: 'undergraduate', name, department: null };
  }

}


exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (validateOtp(otpStore, email, otp)) {
    otpVerified[email] = true;
    const { role, name , department} = await getUserRoleAndName(email);
    res.json({ message: 'OTP verified', role, name, department });
  } else {
    res.status(400).json({ message: 'Invalid or expired OTP' });
  }
};

// Login controller with JWT rolling token
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    //Uncomment for real password check:
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    // Generate JWT access token (5 min expiry)
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '60m' }
    );
    res.set('x-access-token', token);
    res.json({
      message: 'Login successful',
      accessToken: token,
      user: {
        id: user._id,
        email: user.email,
        title: user.title,
        department: user.department,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

