const express = require('express');
const { protect, roleCheck } = require('../middleware/authMiddleware');
const { 
  getDashboard, 
  predictiveAnalytics, 
  rootCauseClustering, 
  vendorDelays
} = require('../controllers/analyticsController');

const router = express.Router();

router.get('/dashboard', protect, roleCheck(['management']), getDashboard);
router.get('/predictive', protect, roleCheck(['management']), predictiveAnalytics);
router.get('/clustering', protect, roleCheck(['management']), rootCauseClustering);
router.post('/report', protect, roleCheck(['management']), (req, res) => { return require('../controllers/analyticsController').generateReport(req, res); });
router.get('/leaderboard', protect, roleCheck(['management']), (req, res) => { return require('../controllers/analyticsController').leaderboard(req, res); });
router.get('/staff-scores', protect, roleCheck(['management']), (req, res) => {
  // Aggregate feedback ratings per staff
});
router.get('/cause-analytics', protect, roleCheck(['management']), (req, res) => {
  // Group by rootCause
});
router.get('/vendor-delays', protect, roleCheck(['management']), (req, res) => {
  // Metrics for vendor vs internal
  return vendorDelays(req, res);
});

module.exports = router;