const express = require('express');
const { protect, roleCheck } = require('../middleware/authMiddleware');
const { 
  createInteraction, 
  getInteractions,
  addReaction,
  deleteInteraction
} = require('../controllers/interactionController');

const router = express.Router();

router.post('/', protect, createInteraction); // Add comment/reaction
router.get('/', protect, getInteractions); // Get interactions for a parent (issue/announcement)
router.post('/:id/reaction', protect, addReaction); // Add emoji reaction
router.delete('/:id', protect, deleteInteraction); // Delete own comment

module.exports = router;
