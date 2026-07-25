const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { chatWithAI } = require("../controllers/aiController");

router.use(protect);
router.post("/chat", chatWithAI);

module.exports = router;