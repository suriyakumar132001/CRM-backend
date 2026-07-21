const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getAllUsers, updateUserRole, deleteUser, getOverview } = require('../controllers/adminController');

router.use(protect);
router.use(requireRole('super Admin', 'Admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/overview', getOverview);

module.exports = router;