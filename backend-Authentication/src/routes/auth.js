const express = require('express');
const { requestOtp, verifyOtp, signup, login, getMe } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');
const validateSignup = require('../middleware/validationMiddleware');
const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);

module.exports = router;