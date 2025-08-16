const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const lecturerMiddleware = require('../middleware/lecturerMiddleware');
const router = express.Router();

router.get('/lectureraccesscheck', authMiddleware, lecturerMiddleware, (req, res) => {
    const { userId, username, email, role } = req.userInfo;
    res.status(200).json({
        success: true,
        message: "Role is Lecturer ",
        lecturer: {
            _id: userId,
            username,
            email,
            role
        }
    });
});

module.exports = router;