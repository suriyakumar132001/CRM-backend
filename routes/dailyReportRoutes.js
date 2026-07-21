const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDailyReport, getReportRange, setTarget } = require('../controllers/dailyReportController');

router.use(protect);
router.get('/', getDailyReport);
router.get('/range', getReportRange);
router.put('/target', setTarget);

module.exports = router;