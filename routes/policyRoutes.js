const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  getPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  deleteAllPolicies,
  getExpiringPolicies,
  getTodayPolicies,
} = require('../controllers/policyController');

router.use(protect);
router.get('/today', getTodayPolicies);
router.get('/expiring/soon', getExpiringPolicies);
router.get('/', getPolicies);
router.get('/:id', getPolicy);
router.post('/', createPolicy);
router.put('/:id', updatePolicy);
router.delete('/bulk/all', requireRole('super Admin', 'Admin'), deleteAllPolicies);
router.delete('/:id', deletePolicy);

module.exports = router;