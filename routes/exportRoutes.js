const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
  exportContacts, exportLeads, importContacts,
  exportPolicies, importPolicies,
  exportPayouts, importPayouts,
  exportDailyReport,
  exportMisPolicies, importMisPolicies,
} = require('../controllers/exportController');

const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.get('/contacts', exportContacts);
router.get('/leads', exportLeads);
router.post('/contacts/import', upload.single('file'), importContacts);

router.get('/policies', exportPolicies);
router.post('/policies/import', upload.single('file'), importPolicies);

router.get('/payouts', exportPayouts);
router.post('/payouts/import', upload.single('file'), importPayouts);

router.get('/daily-report', exportDailyReport);

router.get('/mis-policies', exportMisPolicies);
router.post('/mis-policies/import', upload.single('file'), importMisPolicies);

module.exports = router;