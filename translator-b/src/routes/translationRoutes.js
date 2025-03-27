const express = require("express");
const router = express.Router();

// @route   POST /api/translate
// @desc    Translate text from one language to another
// @access  Public
router.post("/", async (req, res) => {
  try {
    const { sourceLang, targetLang, text } = req.body;

    // Translation API call yaha hoga (Google Translate, OpenAI, DeepL, etc.)
    const translatedText = `Translated (${sourceLang} ➝ ${targetLang}): ${text}`;

    res.json({ translatedText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Translation failed" });
  }
});

module.exports = router;
