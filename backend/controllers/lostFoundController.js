const LostFound = require('../models/LostFound');

exports.reportLostFound = async (req, res) => {
  try {
    const { itemName, itemType, description, location, foundDate, itemImage } = req.body;
    const item = new LostFound({
      itemName,
      itemType,
      description,
      location,
      foundDate,
      itemImage,
      reporter: req.user._id,
      status: 'unclaimed'
    });
    await item.save();
    // Award points for helping with lost & found
    try {
      await require('./../models/User').findByIdAndUpdate(req.user._id, { $inc: { points: 3 } });
    } catch (e) {
      console.warn('Failed to award points for lost&found:', e.message);
    }
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Error reporting item', error: err.message });
  }
};

exports.getLostFound = async (req, res) => {
  try {
    const items = await LostFound.find()
      .populate('reporter', 'email hostel block room')
      .populate('claimant', 'email hostel block room')
      .sort({ foundDate: -1 });
    res.json(items);
  } catch (err) {
    res.status(400).json({ msg: 'Error fetching items', error: err.message });
  }
};

exports.claimItem = async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    item.claimant = req.user._id;
    item.status = 'claimed';
    item.claimedDate = new Date();
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Error claiming item', error: err.message });
  }
};

exports.markReturned = async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    item.status = 'returned';
    item.returnedDate = new Date();
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Error marking as returned', error: err.message });
  }
};

exports.deleteLostFound = async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    await LostFound.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Item deleted successfully' });
  } catch (err) {
    res.status(400).json({ msg: 'Error deleting item', error: err.message });
  }
};