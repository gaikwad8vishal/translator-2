const TranslationHistory = require("../models/TranslationHistory");

exports.saveTranslation = async (req, res) => {
  try {
    const { sourceLanguage, targetLanguage, originalText, translatedText } = req.body;

    const newHistory = new TranslationHistory({
      userId: req.user.id, // Ye user ka ID middleware se aayega
      sourceLanguage,
      targetLanguage,
      originalText,
      translatedText,
    });

    await newHistory.save();
    res.status(201).json({ message: "Translation saved successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
