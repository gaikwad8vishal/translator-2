const axios = require("axios");

const backendURL = process.env.VITE_BACKEND_URL; // ✅ Correct way

const translateText = async (text, sourceLang, targetLang) => {
  try {
    const response = await axios.post(`${backendURL}/api/translate`, {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: "text",
    });

    return response.data.translatedText;
  } catch (error) {
    console.error("Translation Error:", error.response ? error.response.data : error.message);
    return null;
  }
};

// Example Usage
translateText("Hello, how are you?", "en", "hi").then(console.log);
