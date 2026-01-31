const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { protect, roleCheck } = require('../middleware/authMiddleware');
const { 
  reportLostFound, 
  getLostFound,
  claimItem,
  markReturned,
  deleteLostFound 
} = require('../controllers/lostFoundController');

const router = express.Router();

router.post('/', protect, upload.array('images', 5), reportLostFound);
router.get('/', protect, getLostFound);
router.patch('/:id/claim', protect, roleCheck(['management']), claimItem);
router.patch('/:id/return', protect, roleCheck(['management']), markReturned);
router.delete('/:id', protect, roleCheck(['management']), deleteLostFound);

module.exports = router;