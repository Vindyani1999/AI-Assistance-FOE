const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const studentMiddleware = require('../middleware/studentMiddleware');
const router = express.Router();

router.get('/studentaccesscheck', authMiddleware, studentMiddleware, (req, res) => {
    const { userId, username, email, role } = req.userInfo;
    res.status(200).json({
        success: true,
        message: "Role is Student",
        student: {
            _id: userId,
            username,
            email,
            role
        }
    });
});

module.exports = router;