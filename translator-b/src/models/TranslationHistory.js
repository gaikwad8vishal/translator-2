const mongoose = require("mongoose");

const translationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  sourceLanguage: { type: String, required: true },
  targetLanguage: { type: String, required: true },
  originalText: { type: String, required: true },
  translatedText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model("TranslationHistory", translationHistorySchema);
