const express = require('express');
const { requestOtp, verifyOtp, signup } = require('../controllers/authController');
const validateSignup = require('../validators/authValidator');
const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);

module.exports = router;