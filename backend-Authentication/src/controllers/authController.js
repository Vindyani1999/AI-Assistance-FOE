
const { generateOtp, storeOtp, validateOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../services/mailService');

const path = require('path');
const fs = require('fs');

const bcrypt = require('bcryptjs');
const User = require('../models/User');

const otpStore = {}; // In-memory store for demo

// Signup controller
exports.signup = async (req, res) => {
  const { email, password, name, role, department } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
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
      name,
      role,
      department
    });
    await user.save();
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

  // Map domain to department for lecturers
  const domainToDepartment = {
    'cee.ruh.ac.lk': 'civil',
    'mme.ruh.ac.lk': 'mechanical',
    'eie.ruh.ac.lk': 'electrical',
    'eng.ruh.ac.lk': 'faculty',
    'lib.ruh.ac.lk': 'library',
    'cis.ruh.ac.lk': 'it',
  };
  const department = domainToDepartment[domain] || null;
  if (department) {
    try {
      const lecturersPath = path.join(__dirname, '../utils/lecturers.json');
      const lecturersData = fs.readFileSync(lecturersPath, 'utf8');
      const lecturers = JSON.parse(lecturersData);
      const lecturer = lecturers.find(l => l.email.toLowerCase() === email.toLowerCase());
      if (lecturer) {
        // Level: 1 = lecturer, 2 = senior_lecturer
        let levelRole = lecturer.level === 2 ? 'senior_lecturer' : 'lecturer';
        return { role: levelRole, name: lecturer.name, department };
      } else {
        return { role: department + '_lecturer', name: null, department };
      }
    } catch (err) {
      console.error('JSON read error:', err);
      return { role: department + '_lecturer', name: null, department };
    }
  }
  return { role: 'unknown', name: null, department: null };
}


exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (validateOtp(otpStore, email, otp)) {
    const { role, name , department} = await getUserRoleAndName(email);
    res.json({ message: 'OTP verified', role, name, department });
  } else {
    res.status(400).json({ message: 'Invalid or expired OTP' });
  }
};

