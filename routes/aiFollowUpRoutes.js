const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generateFollowUp } = require('../controllers/aiFollowUpController');

router.use(protect);
router.post('/generate', generateFollowUp);

module.exports = router;