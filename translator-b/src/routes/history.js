const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { saveHistory, FetchHistory, deleteHistory } = require("../controllers/historyController");

const router = express.Router();

router.post("/save", authMiddleware, saveHistory);
router.get("/all", authMiddleware, FetchHistory)
router.delete("/delete/:id", authMiddleware, deleteHistory); // ✅ DELETE Route


module.exports = router;
