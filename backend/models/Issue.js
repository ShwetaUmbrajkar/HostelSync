const mongoose = require('mongoose');
const issueSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  category: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'emergency'] },
  description: String,
  media: [String], // Cloudinary URLs
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  hostel: String,
  block: String,
  room: String,
  status: { type: String, default: 'Reported' },
  assignedTo: String, // Caretaker name/ID
  timestamps: [{ status: String, time: Date }],
  duplicates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }],
  meTooCount: { type: Number, default: 0 },
  feedback: { rating: Number, comment: String },
  rootCause: { type: String, enum: ['infrastructure', 'wear_tear', 'user_misuse', 'weather', 'vendor_delay'] },
  vendorType: { type: String, enum: ['internal', 'external'] },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  estimatedCost: { type: Number },
  finalBillUrl: { type: String },
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  slaDeadline: { type: Date },
  vendorStatus: { type: String, enum: ['Vendor Contacted', 'Visit Scheduled', 'Completed'] },
  merged: { type: Boolean, default: false },
  mergedInto: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
  vendorResponses: [{ vendor: String, assignedAt: Date, respondedAt: Date, resolvedAt: Date }],
}, { timestamps: true });
module.exports = mongoose.model('Issue', issueSchema);