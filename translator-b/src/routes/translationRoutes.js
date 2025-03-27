const express = require("express");
const { translateController } = require("../controllers/translationController");

const router = express.Router();

router.post("/translate", translateController);

module.exports = router;
