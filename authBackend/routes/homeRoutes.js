const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/welcome', authMiddleware,  (req, res) => {
    const { userId, username, email, role} = req.userInfo;
    res.json({
        message: 'Welcome to the home page',
        user : {
            _id : userId,
            username,
            email,
            role
        }
    })

});

module.exports = router;