const { generateOtp, storeOtp, validateOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../services/mailService');

const bcrypt = require('bcryptjs');
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
    const user = new User({
      email,
      password: hashedPassword,
      title: title || undefined,
      department: department || undefined,
      firstname: firstname || undefined,
      lastname: lastname || undefined
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

// Login controller
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    // You can add JWT or session logic here if needed
    res.json({ message: 'Login successful', user: {
      email: user.email,
      title: user.title,
      department: user.department,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role
    }});
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

