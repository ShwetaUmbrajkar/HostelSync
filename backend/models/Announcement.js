const mongoose = require('mongoose');
const announcementSchema = new mongoose.Schema({
  title: String,
  content: String,
  targetHostel: String,
  targetBlock: String,
  targetRole: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Announcement', announcementSchema);