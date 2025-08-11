// const nodemailer = require('nodemailer');
// require('dotenv').config();

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST, // e.g., smtp.engug.ruh.ac.lk
//   port: process.env.SMTP_PORT, // e.g., 587
//   secure: false, // true for port 465, false for 587
//   auth: {
//     user: process.env.SMTP_USER, // your university email
//     pass: process.env.SMTP_PASS, // your university email password
//   },
// });

// exports.sendOtpEmail = async (to, otp) => {
//   await transporter.sendMail({
//     from: `"Auth System" <${process.env.SMTP_USER}>`,
//     to,
//     subject: 'Your OTP Code',
//     text: `Your OTP is: ${otp}`,
//     html: `<b>Your OTP is: ${otp}</b>`,
//   });
// };


const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, 
    pass: process.env.GMAIL_PASS, 
  },
});

exports.sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"AI Assistance - FOE" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Your OTP Code',
    text: `OTP code for login to the AI Assistance - FOE: ${otp}`,
    html: `<b>OTP code for login to the AI Assistance - FOE: ${otp}</b>`,
  });
};