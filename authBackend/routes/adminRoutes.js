const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();


router.get('/adminpanel', authMiddleware, adminMiddleware, (req, res) => {
    const {userId, username, email, role} = req.userInfo;
    res.status(200).json({
        success: true,
        message: "Welcome to Admin Panel",
        admin : {
            _id : userId,
            username,
            email,
            role
        }
    })
})


module.exports = router;
