const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  getMisPolicies, createMisPolicy, updateMisPolicy, deleteMisPolicy, scanPolicyPdf,deleteAllMisPolicies, 
} = require('../controllers/misPolicyController');

const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);
router.get('/', getMisPolicies);
router.post('/', createMisPolicy);
router.put('/:id', updateMisPolicy);
router.delete('/:id', deleteMisPolicy);
router.post('/scan-pdf', upload.single('file'), scanPolicyPdf);
router.delete('/bulk/all', requireRole('super Admin', 'Admin'), deleteAllMisPolicies);

module.exports = router;