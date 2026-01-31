const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'management'], required: true },
  hostel: String,
  block: String,
  room: String,
  points: { type: Number, default: 0 },
  badges: [{ type: String }]
});
module.exports = mongoose.model('User', userSchema);