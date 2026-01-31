const express = require('express');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile/:id', getProfile);
router.patch('/profile/:id', updateProfile);
// Add more if needed, e.g., /otp for OTP verification

module.exports = router;