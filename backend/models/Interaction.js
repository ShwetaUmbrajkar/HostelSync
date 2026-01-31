const mongoose = require('mongoose');
const interactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['comment', 'reaction', 'reply'] },
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentId: { type: mongoose.Schema.Types.ObjectId }, // Issue or Announcement ID
  parentType: { type: String, enum: ['Issue', 'Announcement'], default: 'Issue' },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Interaction' }, // For threaded replies
  reactions: { type: Map, of: [mongoose.Schema.Types.ObjectId] }, // { emoji: [userId1, userId2] }
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Interaction' }],
}, { timestamps: true });
module.exports = mongoose.model('Interaction', interactionSchema);