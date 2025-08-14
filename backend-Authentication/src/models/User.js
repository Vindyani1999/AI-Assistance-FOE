const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String , required: true },
  title: { type: String , required: true },
  firstname: { type: String },
  lastname: { type: String },
  role: { type: String },
  department: { type: String , required: true },
//   createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
