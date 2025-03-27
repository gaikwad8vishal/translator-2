const { translateText } = require("../config/googleTranslate");

const translateController = async (req, res) => {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
        return res.status(400).json({ error: "Text and targetLanguage are required!" });
    }

    const translatedText = await translateText(text, targetLanguage);

    if (translatedText) {
        return res.json({ translatedText });
    } else {
        return res.status(500).json({ error: "Translation failed!" });
    }
};

module.exports = { translateController };
