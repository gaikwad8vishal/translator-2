const axios = require("axios");

exports.translateText = async (req, res) => {
    const { text, from, to } = req.body;  // ✅ Body se data lo

    if (!text || !from || !to) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    try {
        const response = await axios.get(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
        );
        res.json({ translatedText: response.data.responseData.translatedText });
    } catch (error) {
        res.status(500).json({ error: "Translation failed" });
    }
};
