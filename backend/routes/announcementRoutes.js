const express = require('express');
const { protect, roleCheck } = require('../middleware/authMiddleware');
const { createAnnouncement, getAnnouncements, deleteAnnouncement, updateAnnouncement } = require('../controllers/announcementController');

const router = express.Router();

router.post('/', protect, roleCheck(['management']), createAnnouncement);
router.get('/', protect, getAnnouncements); // Filtered by user
router.get('/:id', protect, (req, res) => {
  // Get single announcement
});
// Allow management (PUT) and creators (PATCH) to update announcements
router.put('/:id', protect, roleCheck(['management']), updateAnnouncement);
router.patch('/:id', protect, updateAnnouncement);
router.delete('/:id', protect, roleCheck(['management']), deleteAnnouncement);

module.exports = router;