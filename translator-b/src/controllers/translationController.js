const axios = require("axios");

exports.translateText = async (req, res) => {
  const { text, from, to } = req.body;

  if (!text || !from || !to) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const response = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=${from}|${to}&de=your@email.com`
    );

    let translatedText = response.data.responseData.translatedText;
    if (response.data.matches && response.data.matches.length > 0) {
      translatedText = response.data.matches[0].translation;
    }

    res.json({ translatedText });
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.response?.statusText ||
      "Translation failed";
    if (error.response?.status === 429) {
      return res
        .status(429)
        .json({
          error:
            "Too Many Requests: Daily limit exceeded. Try again tomorrow or use a new email/key.",
        });
    }
    res.status(500).json({ error: errorMessage });
  }
};



// require('dotenv').config();
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const Bottleneck = require('bottleneck');

// // Initialize rate limiter
// const limiter = new Bottleneck({
//   minTime: 1000, // 1 second between requests
//   maxConcurrent: 1,
// });

// exports.translateText = async (req, res) => {
//   const { text, from, to } = req.body;

//   if (!text || !from || !to) {
//     return res.status(400).json({ error: "Missing parameters" });
//   }

//   // Initialize Gemini model
//   const genAI = new GoogleGenerativeAI("AIzaSyBslHvGbZjeq7c27jOErVb0zEvrQMv3ecc");
//   const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

//   const retryRequest = async (fn, maxRetries = 3, delay = 1000) => {
//     for (let i = 0; i < maxRetries; i++) {
//       try {
//         return await fn();
//       } catch (error) {
//         if (error.status === 429 && i < maxRetries - 1) {
//           await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
//           continue;
//         }
//         throw error;
//       }
//     }
//   };

//   try {
//     const prompt = `
//       You are a translator which can translate any language to any language. 
//       Translate the following text from ${from} to ${to}. 
//       Provide the translation only in the script of the target language, not in Latin script.
//       Text: ${text}
//     `;

//     const translateWithGemini = limiter.wrap(async () => {
//       const result = await retryRequest(() => model.generateContent(prompt));
//       return result.response.text();
//     });

//     const translatedText = await translateWithGemini();
//     res.json({ translatedText });
//   } catch (error) {
//     const errorMessage = error.message || "Translation failed";
//     if (error.status === 429) {
//       return res
//         .status(429)
//         .json({
//           error: "Too Many Requests: Rate limit exceeded. Try again later.",
//         });
//     }
//     res.status(500).json({ error: errorMessage });
//   }
// };