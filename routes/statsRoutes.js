const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getStats, getAgentWiseStats } = require('../controllers/statsController');

router.use(protect);
router.get('/', getStats);
router.get('/agent-wise', requireRole('super Admin', 'Admin'), getAgentWiseStats);

module.exports = router;