const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String , required: false },
  title: { type: String , required: false },
  firstname: { type: String },
  lastname: { type: String },
  role: { type: String }
//   createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
