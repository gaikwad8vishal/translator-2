const axios = require("axios");

exports.translateText = async (req, res) => {
    const { text, from, to } = req.body;

    if (!text || !from || !to) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    try {
        const response = await axios.get(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}&de=your@email.com`
        );

        // ✅ Agar cache se aaya toh alternate API response bhi check karega
        let translatedText = response.data.responseData.translatedText;
        if (response.data.matches && response.data.matches.length > 0) {
            translatedText = response.data.matches[0].translation;
        }

        res.json({ translatedText });
    } catch (error) {
        res.status(500).json({ error: "Translation failed" });
    }
};
