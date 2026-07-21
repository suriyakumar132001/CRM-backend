const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
  getMisPolicies, createMisPolicy, updateMisPolicy, deleteMisPolicy, scanPolicyPdf,
} = require('../controllers/misPolicyController');

const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);
router.get('/', getMisPolicies);
router.post('/', createMisPolicy);
router.put('/:id', updateMisPolicy);
router.delete('/:id', deleteMisPolicy);
router.post('/scan-pdf', upload.single('file'), scanPolicyPdf);

module.exports = router;