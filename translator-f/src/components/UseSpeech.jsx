import { useState, useEffect, useRef, useCallback } from "react";

export const useSpeech = (lang, onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [availableVoices, setAvailableVoices] = useState([]);
  const recognitionRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const lastStartAttemptRef = useRef(0);
  const minStartInterval = 2000; // Minimum interval between start attempts (ms)

  // Supported language codes for speech recognition and synthesis (restricted to widely supported languages)
  const supportedLangMap = {
    ar: "ar-SA",
    bn: "bn-IN",
    de: "de-DE",
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    gu: "gu-IN",
    hi: "hi-IN",
    it: "it-IT",
    ja: "ja-JP",
    kn: "kn-IN",
    ko: "ko-KR",
    ml: "ml-IN",
    mr: "mr-IN",
    or: "or-IN",
    pa: "pa-IN",
    pt: "pt-BR",
    ru: "ru-RU",
    ta: "ta-IN",
    te: "te-IN",
    zh: "zh-CN",
  };

  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      console.log("Available voices:", voices.map(v => v.lang));
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Monitor network status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network online");
      setError(""); // Clear any offline error
    };
    const handleOffline = () => {
      console.log("Network offline");
      setError("No internet connection. Speech recognition paused.");
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const startSpeechRecognition = useCallback(() => {
    // Prevent rapid successive start attempts
    const now = Date.now();
    if (now - lastStartAttemptRef.current < minStartInterval) {
      console.log("Speech recognition start attempt throttled");
      return;
    }
    lastStartAttemptRef.current = now;

    // Check internet connectivity
    if (!navigator.onLine) {
      setError("No internet connection. Please check your network.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in your browser.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    if (isListening) {
      console.log("Speech recognition already active");
      return;
    }

    // Map language to supported code or fallback to en-US
    const speechLang = lang === "auto" ? "en-US" : supportedLangMap[lang] || "en-US";
    if (!supportedLangMap[lang]) {
      console.warn(`Language ${lang} not supported for speech recognition, falling back to en-US`);
      setError(`Language ${lang} not supported. Using English (US).`);
      setTimeout(() => setError(""), 5000);
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const finalTranscript = event.results[0][0].transcript;
      console.log(`Speech recognition result: ${finalTranscript} (lang: ${speechLang})`);
      onResult(finalTranscript);
      recognition.stop();
      retryCountRef.current = 0; // Reset retry count on success
    };

    recognition.onerror = (event) => {
      let errorMessage = "An error occurred during speech recognition.";
      switch (event.error) {
        case "no-speech":
          errorMessage = "No speech detected. Please try again.";
          break;
        case "audio-capture":
          errorMessage = "Microphone not detected. Please check your device.";
          break;
        case "not-allowed":
          errorMessage = "Microphone access denied. Please allow microphone permissions.";
          break;
        case "network":
          errorMessage = "Network error. Please check your internet connection.";
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            // Exponential backoff: 1.5s, 3s, 6s
            const retryDelay = 1500 * Math.pow(2, retryCountRef.current - 1);
            console.log(`Retrying speech recognition (${retryCountRef.current}/${maxRetries}) in ${retryDelay}ms`);
            setTimeout(() => startSpeechRecognition(), retryDelay);
            return;
          }
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      console.error(`Speech recognition error: ${event.error}, lang: ${speechLang}, details:`, event);
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
      setIsListening(false);
      retryCountRef.current = 0; // Reset retry count on final failure
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);
    };

    console.log(`Starting speech recognition with language: ${speechLang}`);
    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to start speech recognition. Please try again.");
      setTimeout(() => setError(""), 5000);
      setIsListening(false);
    }
  }, [lang, onResult, isListening]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      retryCountRef.current = 0; // Reset retry count
    }
  }, []);

  const speakText = useCallback(
    (textToSpeak, lang) => {
      if (!window.speechSynthesis) {
        setError("Speech synthesis is not supported in your browser.");
        setTimeout(() => setError(""), 5000);
        return;
      }

      window.speechSynthesis.cancel();
      stopSpeechRecognition();

      if (!textToSpeak.trim()) {
        setError("No text to read aloud.");
        setTimeout(() => setError(""), 5000);
        return;
      }

      if (isSpeaking) {
        return;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const speechLang = supportedLangMap[lang] || "en-US";
      utterance.lang = speechLang;

      const matchingVoice =
        availableVoices.find((voice) => voice.lang === speechLang) ||
        availableVoices.find((voice) => voice.lang === "en-US");
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      } else {
        console.warn(`No voice available for ${lang}, falling back to default`);
        setError(`No voice available for ${lang}. Using default voice.`);
        setTimeout(() => setError(""), 5000);
      }

      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setError(`Speech synthesis error: ${event.error}`);
        setTimeout(() => setError(""), 5000);
        setIsSpeaking(false);
      };

      try {
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      } catch (err) {
        console.error("Failed to start speech synthesis:", err);
        setError("Failed to start speech synthesis. Please try again.");
        setTimeout(() => setError(""), 5000);
        setIsSpeaking(false);
      }
    },
    [availableVoices, isSpeaking, stopSpeechRecognition]
  );

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    isListening,
    startSpeechRecognition,
    stopSpeechRecognition,
    speakText,
    error,
    setError,
    isSpeaking,
  };
};