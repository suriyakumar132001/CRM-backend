const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPayouts, createPayout, updatePayout, deletePayout } = require('../controllers/payoutController');

router.use(protect);
router.get('/', getPayouts);
router.post('/', createPayout);
router.put('/:id', updatePayout);
router.delete('/:id', deletePayout);

module.exports = router;