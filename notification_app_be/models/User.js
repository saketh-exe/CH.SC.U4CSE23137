const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Using String to match studentID like "1042"
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['STUDENT', 'ADMIN', 'HR'], default: 'STUDENT' },
  department: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
