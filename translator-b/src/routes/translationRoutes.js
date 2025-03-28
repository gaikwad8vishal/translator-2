const express = require("express");
const { translateController } = require("../controllers/translationController");
const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/translate", translateController);

// Get Translation History (Protected)
router.get("/history", protect, async (req, res) => {
    try {
      const history = await TranslationHistory.find({ userId: req.user.id }).sort({ createdAt: -1 });
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });

module.exports = router;
