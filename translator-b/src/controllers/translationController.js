const axios = require("axios");
const fs = require("fs");
const path = require("path");
const natural = require("natural");

// NLP setup
const tokenizer = new natural.WordTokenizer();
const sentimentAnalyzer = new natural.SentimentAnalyzer("English", natural.PorterStemmer, "afinn");

// Feedback memory file
const feedbackFilePath = path.join(__dirname, "feedback.json");

// Load feedback memory or initialize
const loadFeedbackMemory = () => {
  try {
    const data = fs.readFileSync(feedbackFilePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
};

// Save feedback memory
const saveFeedbackMemory = (memory) => {
  fs.writeFileSync(feedbackFilePath, JSON.stringify(memory, null, 2));
};

exports.translateText = async (req, res) => {
  const { text, from, to, userFeedback } = req.body;

  // Validate inputs
  if (!text || !from || !to) {
    return res.status(400).json({ error: "Missing parameters: text, from, and to are required" });
  }

  const validLanguages = [
    "en", "hi", "bn", "gu", "ta", "te", "ml", "mr", "pa", "as", "or",
    "kn", "ur", "ne", "si", "ma", "bo", "ks", "sd", "sa", "tl"
  ];
  if (!validLanguages.includes(from) || !validLanguages.includes(to)) {
    return res.status(400).json({ error: "Invalid language code" });
  }

  try {
    // Preprocessing: Tokenize and analyze sentiment
    console.log("AI preprocessing...");
    const tokens = tokenizer.tokenize(text);
    const sentimentScore = sentimentAnalyzer.getSentiment(tokens);
    const sentiment = sentimentScore > 0 ? "positive" : sentimentScore < 0 ? "negative" : "neutral";

    // MyMemory API call for translation
    const email = process.env.MYMEMORY_EMAIL || "BoomBoomChao@email.com";
    const response = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}&de=${email}`
    );

    let translatedText = response.data.responseData.translatedText;
    const matches = response.data.matches || [];

    // RL-based translation selection
    const feedbackMemory = loadFeedbackMemory();
    let selectedTranslation = translatedText;
    let maxReward = -Infinity;
    const stateKey = `${text}:${from}:${to}`; // Unique state identifier

    if (matches.length > 0) {
      // Check past rewards for each translation candidate
      matches.forEach(match => {
        const translationKey = `${stateKey}:${match.translation}`;
        const pastReward = feedbackMemory[translationKey]?.reward || 0;
        if (pastReward > maxReward) {
          maxReward = pastReward;
          selectedTranslation = match.translation;
        }
      });
    }

    // Postprocessing: Enhance output based on sentiment
    let enhancedText = selectedTranslation;
    if (sentiment === "positive") {
      enhancedText = `${selectedTranslation}`;
    } else if (sentiment === "negative") {
      enhancedText = `⚠️ ${selectedTranslation}`;
    }

    // Save feedback to memory if provided
    if (userFeedback) {
      const translationKey = `${stateKey}:${selectedTranslation}`;
      feedbackMemory[translationKey] = {
        inputText: text,
        sentiment,
        userFeedback,
        reward: userFeedback === "positive" ? 1 : userFeedback === "negative" ? -1 : 0,
        translatedText: selectedTranslation
      };
      saveFeedbackMemory(feedbackMemory);
    }

    res.json({
      translatedText: enhancedText,
      aiSentiment: sentiment,
      reinforcementUsed: !!userFeedback
    });
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.response?.statusText || "Translation failed";
    if (error.response?.status === 429) {
      return res.status(429).json({ error: "Too Many Requests: Daily limit exceeded." });
    }
    res.status(500).json({ error: errorMessage });
  }
};