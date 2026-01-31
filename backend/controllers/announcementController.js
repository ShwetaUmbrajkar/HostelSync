const Announcement = require('../models/Announcement');

exports.createAnnouncement = async (req, res) => {
  const announcement = new Announcement({ ...req.body, createdBy: req.user._id });
  await announcement.save();
  res.status(201).json(announcement);
};

exports.getAnnouncements = async (req, res) => {
  try {
    // For students, return announcements targeted to their hostel/block/role OR announcements with empty target (meaning "All")
    if (req.user.role === 'student') {
      const hostel = req.user.hostel || '';
      const block = req.user.block || '';
      const role = req.user.role || '';
      console.log('getAnnouncements (student) called by:', req.user._id, 'hostel:', hostel, 'block:', block, 'role:', role);

      const anns = await Announcement.find({
        $and: [
          { $or: [{ targetHostel: '' }, { targetHostel: { $exists: false } }, { targetHostel: hostel }] },
          { $or: [{ targetBlock: '' }, { targetBlock: { $exists: false } }, { targetBlock: block }] },
          { $or: [{ targetRole: '' }, { targetRole: { $exists: false } }, { targetRole: role }] }
        ]
      }).sort({ createdAt: -1 });

      console.log('getAnnouncements: Found', anns.length, 'announcements for student');
      return res.json(anns);
    }

    // Management and caretakers see all announcements
    console.log('getAnnouncements (management) called by:', req.user._id);
    const anns = await Announcement.find({}).sort({ createdAt: -1 });
    console.log('getAnnouncements: Found', anns.length, 'announcements for management');
    res.json(anns);
  } catch (err) {
    console.error('getAnnouncements error:', err.message);
    res.status(500).json({ msg: 'Error fetching announcements', error: err.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ msg: 'Announcement not found' });
    }
    // Only creator can delete
    if (announcement.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Not authorized to delete this announcement' });
    }
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    console.log('UpdateAnnouncement called by user:', req.user?._id, 'role:', req.user?.role, 'annId:', req.params.id);
    console.log('Payload:', req.body);
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ msg: 'Announcement not found' });

    // Only creator or management role can update
    if (ann.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'management') {
      return res.status(403).json({ msg: 'Not authorized to update this announcement' });
    }

    const updates = { ...req.body };
    Object.assign(ann, updates);
    await ann.save();
    res.json(ann);
  } catch (err) {
    res.status(500).json({ msg: 'Error updating announcement', error: err.message });
  }
};