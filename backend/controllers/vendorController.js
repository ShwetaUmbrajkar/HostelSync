const Vendor = require('../models/Vendor');

exports.createVendor = async (req, res) => {
  try {
    const v = new Vendor(req.body);
    await v.save();
    res.status(201).json(v);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.listVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ name: 1 });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const v = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(v);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    await Vendor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vendor removed' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
