const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String },
  department: { type: String , required: true },
//   createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
