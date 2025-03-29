const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { saveHistory, FetchHistory } = require("../controllers/historyController");

const router = express.Router();

router.post("/save", authMiddleware, saveHistory);
router.get("/", authMiddleware, FetchHistory)

module.exports = router;
