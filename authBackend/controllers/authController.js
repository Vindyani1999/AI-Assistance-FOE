const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const NodeCache = require('node-cache');
const otpCache = new NodeCache({ stdTTL: 300 }); // OTP expires in 5 minutes
//const crypto = require('crypto');
// In-memory cache for reset tokens (use Redis or DB for production)
//const resetCache = new NodeCache({ stdTTL: 900 }); // 15 min expiry


exports.registerUser = async (req,res) => {
    try {
        const { username, email, password } = req.body;

        const existUser = await User.findOne({$or : [{username}, {email}]})
        if(existUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }

        // Role assignment based on email domain
        let role = 'user';
        if (email.endsWith('@eie.ruh.ac.lk')) {
            role = 'electrical_lecturer';
        } else if (email.endsWith('@cee.ruh.ac.lk')) {
            role = 'civil_lecturer';
        } else if (email.endsWith('@mme.ruh.ac.lk')) {
            role = 'mechanical_lecturer';
        } else if (email.endsWith('@engug.ruh.ac.lk')) {
            role = 'student';
        } else if (email.endsWith('@admin.ruh.ac.lk')) {
            role = 'admin';
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role
        })
        await newUser.save();

        if(!newUser) {
            return res.status(400).json({
                success: false,
                message: "Error creating user"
            })  
        }
        res.status(201).json({
            success: true,
            message: "User created successfully"
        })

    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login a user
 * @access  Public
 */

exports.loginUser = async (req,res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({email});
        if(!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            })
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

        // Send OTP to user's email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // your email
                pass: process.env.EMAIL_PASS  // your email password or app password
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}`
        };

        await transporter.sendMail(mailOptions);
        
        otpCache.set(user.email, otp);
        // You can save the OTP in DB or cache for later verification
        // For demo, just send it in response (not secure for production)
        res.status(200).json({
            success: true,
            message: "OTP sent to your email",
            otp: otp // Remove this in production!
        });

    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}


/** * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP for login
 * @access  Public
 */
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    const cachedOtp = otpCache.get(email);

    if (!cachedOtp) {
        return res.status(400).json({
            success: false,
            message: "OTP expired or not found"
        });
    }

    if (parseInt(otp) === cachedOtp) {
        otpCache.del(email); // Remove OTP after successful verification

        // Find user and generate token
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            token: token
        });
    } else {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP"
        });
    }
};






// const transporter = nodemailer.createTransport({
//     host: 'smtp.university.edu', 
//     port: 587,
//     secure: false,
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });


/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (client should delete token)
 * @access  Public
 */
exports.logoutUser = (req, res) => {
    // On client: remove token from storage (localStorage/cookies)
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
};



/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset link to user's email
 * @access  Public
 */
// exports.forgotPassword = async (req, res) => {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//         return res.status(400).json({
//             success: false,
//             message: "No account found with that email"
//         });
//     }

//     // Generate secure token
//     const resetToken = crypto.randomBytes(32).toString('hex');
//     resetCache.set(resetToken, email);

//     // Create reset link (adjust frontend URL as needed)
//     const resetLink = `https://your-frontend-app.com/reset-password?token=${resetToken}`;

//     // Send email
//     const transporter = nodemailer.createTransport({
//         service: 'gmail', // or  SMTP config
//         auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS
//         }
//     });

//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: 'Password Reset Request',
//         text: `Click the link to reset your password: ${resetLink}\nThis link will expire in 15 minutes.`
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({
//         success: true,
//         message: "Password reset link sent to your email"
//     });
// };


/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
// exports.resetPassword = async (req, res) => {
//     const { token, newPassword } = req.body;
//     const email = resetCache.get(token);

//     if (!email) {
//         return res.status(400).json({
//             success: false,
//             message: "Invalid or expired reset token"
//         });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//         return res.status(400).json({
//             success: false,
//             message: "User not found"
//         });
//     }

//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(newPassword, salt);
//     await user.save();

//     resetCache.del(token);

//     res.status(200).json({
//         success: true,
//         message: "Password reset successful"
//     });
// };