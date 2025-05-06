import { useState, useCallback } from "react";
import axios from "axios";




const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";


export const useTranslation = () => {
  const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);



  const translateText = useCallback(async (inputText, from, to) => {
    if (!inputText.trim()) {
      setTranslatedText("");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      console.log("Translating text:", { inputText, from, to });
      const response = await axios.post(
        `${backendURL}/translate/`,
        { text: inputText, from: from === "auto" ? "auto" : from, to },
        { headers: { "Content-Type": "application/json" } }
      );
      const translated = response.data.translatedText;
      if (translated.startsWith("Error:")) {
        setError(translated.replace("Error: ", ""));
        setTimeout(() => setError(""), 3000);
        setTranslatedText("");
      } else {
        setTranslatedText(translated);
      }
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await axios.post(
            `${backendURL}/history/save`,
            { input: inputText, translation: translated, from, to },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setHistory((prev) => [{ input: inputText, translation: translated, from, to, _id: Date.now() }, ...prev]);
        } catch (historyError) {
          console.error("Failed to save history:", historyError.message);
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      setTimeout(() => setError(""), 3000);
      setTranslatedText("");
    } finally {
      setLoading(false);
    }
  }, []);

  return { translatedText, loading, error, setError, history, setHistory, translateText };
};