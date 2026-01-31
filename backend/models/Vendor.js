const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  phone: { type: String },
  email: { type: String },
  avgResponseTimeHours: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
