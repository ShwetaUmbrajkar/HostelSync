const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temp storage; upload to Cloudinary in controller
const { protect, roleCheck } = require('../middleware/authMiddleware');
const { 
  reportIssue, 
  updateStatus, 
  mergeIssues,
  meToo, 
  addFeedback, 
  setRootCause,
  resolveIssue,
  getIssues,
  getMyIssues,
  assignIssue,
  uploadFinalBill
} = require('../controllers/issueController');

const router = express.Router();

router.post('/', protect, roleCheck(['student']), upload.array('media', 5), reportIssue); // Up to 5 files
router.get('/', protect, getIssues); // Get issues based on role
router.get('/my/issues', protect, getMyIssues); // Get user's own issues
router.patch('/:id/status', protect, roleCheck(['management']), updateStatus);
router.post('/merge', protect, roleCheck(['management']), mergeIssues);
router.post('/:id/metoo', protect, meToo);
router.patch('/:id/feedback', protect, roleCheck(['student']), addFeedback);
router.patch('/:id/resolve', protect, roleCheck(['management']), resolveIssue);
router.patch('/:id/finalbill', protect, roleCheck(['management']), upload.single('bill'), uploadFinalBill);
router.patch('/:id/rootcause', protect, roleCheck(['management']), setRootCause);
router.patch('/:id/assign', protect, roleCheck(['management']), assignIssue);

module.exports = router;