const mongoose = require('mongoose');
const lostFoundSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  itemType: { type: String, enum: ['lost', 'found'], required: true },
  description: String,
  location: String,
  foundDate: Date,
  itemImage: String,
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['unclaimed', 'claimed', 'returned'], default: 'unclaimed' },
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  claimedDate: Date,
  returnedDate: Date
}, { timestamps: true });
module.exports = mongoose.model('LostFound', lostFoundSchema);