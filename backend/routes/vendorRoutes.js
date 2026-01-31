const express = require('express');
const router = express.Router();
const { protect, roleCheck } = require('../middleware/authMiddleware');
const { createVendor, listVendors, updateVendor, deleteVendor } = require('../controllers/vendorController');

router.get('/', protect, listVendors);
router.post('/', protect, roleCheck(['management']), createVendor);
router.patch('/:id', protect, roleCheck(['management']), updateVendor);
router.delete('/:id', protect, roleCheck(['management']), deleteVendor);

module.exports = router;
