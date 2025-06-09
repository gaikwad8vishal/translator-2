



const axios = require("axios");
const natural = require("natural");

// Initialize NLP tools for processing
const tokenizer = new natural.WordTokenizer();
const sentimentAnalyzer = new natural.SentimentAnalyzer("English", natural.PorterStemmer, "afinn");

exports.translateText = async (req, res) => {
  const { text, from, to } = req.body;

  // Validate inputs
  if (!text || !from || !to) {
    return res.status(400).json({ error: "Missing parameters: text, from, and to are required" });
  }

  // Validate language codes
  const validLanguages = [
    "en", "hi", "bn", "gu", "ta", "te", "ml", "mr", "pa", "as", "or", 
    "kn", "ur", "ne", "si", "ma", "bo", "ks", "sd", "sa", "tl"
  ];
  if (!validLanguages.includes(from) || !validLanguages.includes(to)) {
    return res.status(400).json({ error: "Invalid language code" });
  }

  try {
    // preprocessing: Tokenize input text and analyze sentiment
    console.log("Initiating AI preprocessing for input text...");
    const tokens = tokenizer.tokenize(text);
    const sentimentScore = sentimentAnalyzer.getSentiment(tokens);
    const sentiment = sentimentScore > 0 ? "positive" : sentimentScore < 0 ? "negative" : "neutral";
    console.log(`AI Analysis: Input text tokens: ${tokens.join(", ")}, Sentiment: ${sentiment}`);

    // MyMemory API call for translation
    const email = process.env.MYMEMORY_EMAIL || "BoomBoomChao@email.com";
    const response = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=${from}|${to}&de=${email}`
    );

    let translatedText = response.data.responseData.translatedText;
    if (response.data.matches && response.data.matches.length > 0) {
      translatedText = response.data.matches[0].translation;
    }

    //postprocessing: Adjust output based on sentiment (example)
    let enhancedText = translatedText;
    if (sentiment === "positive") {
      enhancedText = `${translatedText}`; 
    } else if (sentiment === "negative") {
      enhancedText = `${translatedText}`;
    }
    
    res.json({
      translatedText: enhancedText,
      aiSentiment: sentiment // Include sentiment to show AI involvement
    });
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