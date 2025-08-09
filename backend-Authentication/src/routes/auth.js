const express = require('express');
const { requestOtp, verifyOtp, signup, login } = require('../controllers/authController');
const validateSignup = require('../middleware/validationMiddleware');
const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);

module.exports = router;