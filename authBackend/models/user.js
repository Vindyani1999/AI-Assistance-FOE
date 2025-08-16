const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: [true, 'Username already exists']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email already exists'],
        match: [/\S+@\S+\.\S+/, 'Please enter a valid email'],
        lowercase: true,
        trim: [true, 'Email should not have any leading or trailing spaces']
    },
    password: {
        type: String,
        required: [true, 'password is required'],
        minlength: [6, 'Password should be at least 6 characters long'],
        trim: [true, 'Password should not have any leading or trailing spaces']
    },
    role: {
        type: String,
        enum: ['admin', 'student', 'electrical_lecturer', 'civil_lecturer', 'mechanical_lecturer', 'user'],
        default: 'user'
    }

}, { timestamps: true })

const User = mongoose.model('User', userSchema);

module.exports = User;