
const { generateOtp, storeOtp, validateOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../services/mailService');

const bcrypt = require('bcryptjs');
const User = require('../models/User');

const otpStore = {}; // In-memory store for demo
const otpVerified = {}; // Tracks OTP verification status per email

// Signup controller
exports.signup = async (req, res) => {
  const { email, password, role, department, firstname, lastname } = req.body;
  if (!otpVerified[email]) {
    return res.status(400).json({ message: 'OTP not verified for this email. Please verify OTP before signing up.' });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      role,
      department,
      name: firstname && lastname ? `${firstname} ${lastname}` : undefined
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
  await sendOtpEmail(email, otp);
  res.json({ message: 'OTP sent' });
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

