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


// const axios = require("axios");
// require("dotenv").config();

// const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// exports.translateText = async (req, res) => {
//     const { text, from, to } = req.body;

//     // Validate input parameters
//     if (!text || !from || !to) {
//         return res.status(400).json({ error: "Missing parameters" });
//     }

//     try {
//         // Google Cloud Translation API endpoint
//         const response = await axios.post(
//             `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
//             {
//                 q: text,
//                 source: from === "auto" ? undefined : from,
//                 target: to,
//                 format: "text",
//             }
//         );

//         // Extract translated text and detected language
//         const translatedText = response.data.data.translations[0].translatedText;
//         const detectedLanguage = response.data.data.translations[0].detectedSourceLanguage;

//         res.json({
//             translatedText,
//             detectedLanguage: from === "auto" ? detectedLanguage : undefined,
//         });
//     } catch (error) {
//         console.error("Translation error:", error.message);
//         const errorMessage = error.response?.data?.error?.message || "Translation failed";
//         res.status(error.response?.status || 500).json({ error: errorMessage });
//     }
// };