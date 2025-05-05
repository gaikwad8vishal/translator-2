// const axios = require("axios");

// exports.translateText = async (req, res) => {
//   const { text, from, to } = req.body;

//   if (!text || !from || !to) {
//     return res.status(400).json({ error: "Missing parameters" });
//   }

//   try {
//     const response = await axios.get(
//       `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
//         text
//       )}&langpair=${from}|${to}&de=your@email.com`
//     );

//     let translatedText = response.data.responseData.translatedText;
//     if (response.data.matches && response.data.matches.length > 0) {
//       translatedText = response.data.matches[0].translation;
//     }

//     res.json({ translatedText });
//   } catch (error) {
//     const errorMessage =
//       error.response?.data?.error ||
//       error.response?.statusText ||
//       "Translation failed";
//     if (error.response?.status === 429) {
//       return res
//         .status(429)
//         .json({
//           error:
//             "Too Many Requests: Daily limit exceeded. Try again tomorrow or use a new email/key.",
//         });
//     }
//     res.status(500).json({ error: errorMessage });
//   }
// };




const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.translateText = async (req, res) => {
  const { text, from, to } = req.body;

  if (!text || !from || !to) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  // Initialize Gemini model
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "AIzaSyDfN4YxlcJLyrSGg26To42cO6dCt78Ub-E");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  try {
    // Construct prompt with system instruction and user input
    const prompt = `
      You are a translator which can translate any language to any language. 
      Translate the following text from ${from} to ${to}. 
      Provide the translation only in the script of the target language, not in Latin script.
      Text: ${text} 
    `;

    // Generate translation
    const result = await model.generateContent(prompt);
    const translatedText = result.response.text();

    res.json({ translatedText });
  } catch (error) {
    const errorMessage = error.message || "Translation failed";
    if (error.status === 429) {
      return res
        .status(429)
        .json({
          error: "Too Many Requests: Rate limit exceeded. Try again later."
        });
    }
    res.status(500).json({ error: errorMessage });
  }
};