import { useState, useEffect, useRef, useCallback } from "react";

export const useSpeech = (lang, onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [availableVoices, setAvailableVoices] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in your browser.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (isListening) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = lang === "auto" ? "en-US" : `${lang}-${lang.toUpperCase()}`;
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const finalTranscript = event.results[0][0].transcript;
      onResult(finalTranscript);
      recognition.stop();
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
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      setError(errorMessage);
      setTimeout(() => setError(""), 3000);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  }, [lang, onResult, isListening]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const speakText = useCallback(
    (textToSpeak, lang) => {
      if (!window.speechSynthesis) {
        setError("Speech synthesis is not supported in your browser.");
        setTimeout(() => setError(""), 3000);
        return;
      }

      window.speechSynthesis.cancel();
      stopSpeechRecognition();

      if (!textToSpeak.trim()) {
        setError("No text to read aloud.");
        setTimeout(() => setError(""), 3000);
        return;
      }

      if (isSpeaking) {
        return;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const langMap = {
        ar: "ar-SA",
        as: "as-IN",
        bn: "bn-IN",
        brx: "brx-IN",
        de: "de-DE",
        en: "en-US",
        es: "es-ES",
        fr: "fr-FR",
        gbm: "gbm-IN",
        gu: "gu-IN",
        hi: "hi-IN",
        it: "it-IT",
        ja: "ja-JP",
        kfy: "kfy-IN",
        kn: "kn-IN",
        ko: "ko-KR",
        ml: "ml-IN",
        mr: "mr-IN",
        mtei: "mni-IN",
        or: "or-IN",
        pa: "pa-IN",
        pt: "pt-BR",
        ru: "ru-RU",
        ta: "ta-IN",
        tcy: "tcy-IN",
        te: "te-IN",
        zh: "zh-CN",
      };
      const speechLang = langMap[lang] || "en-US";
      utterance.lang = speechLang;

      const matchingVoice =
        availableVoices.find((voice) => voice.lang === speechLang) ||
        availableVoices.find((voice) => voice.lang === "en-US");
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      } else {
        setError(`No voice available for ${lang}. Falling back to default or install a ${lang} language pack.`);
        setTimeout(() => setError(""), 5000);
      }

      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = (event) => {
        setError(`Speech synthesis error: ${event.error}`);
        setTimeout(() => setError(""), 3000);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
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