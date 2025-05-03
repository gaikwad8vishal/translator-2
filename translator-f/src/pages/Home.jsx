import axios from "axios";
import { ArrowLeftRight, Home, Languages, Mic, MicOff, Volume2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { HiClipboard, HiClipboardCheck } from "react-icons/hi";
import { FaHistory, FaCamera, FaUpload, FaPaperclip, FaSyncAlt } from "react-icons/fa";
import Tesseract from "tesseract.js";

const backendURL = import.meta.env.VITE_BACKEND_URL || "https://translator-5-6fr1.onrender.com";



// Available languages for translation
const languages = [
  { code: "as", name: "Assamese" },
  { code: "bn", name: "Bengali" },
  { code: "brx", name: "Bodo" },
  { code: "en", name: "English" },
  { code: "gbm", name: "Garhwali" },
  { code: "gu", name: "Gujarati" },
  { code: "hi", name: "Hindi" },
  { code: "kn", name: "Kannada" },
  { code: "kfy", name: "Kumaoni" },
  { code: "mai", name: "Maithili" },
  { code: "ml", name: "Malayalam" },
  { code: "mr", name: "Marathi" },
  { code: "mtei", name: "Meitei" },
  { code: "ne", name: "Nepali" },
  { code: "or", name: "Odia" },
  { code: "pa", name: "Punjabi" },
  { code: "sa", name: "Sanskrit" },
  { code: "si", name: "Sinhala" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "tcy", name: "Tulu" },
  { code: "ur", name: "Urdu" },
];

// Hook: Handle translation API calls and history
const useTranslation = () => {
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


// Hook: Handle speech recognition and text-to-speech
const useSpeech = (lang, onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [availableVoices, setAvailableVoices] = useState([]);
  const recognitionRef = useRef(null);

  // Load available voices for speech synthesis
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

  // Start speech recognition
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in your browser.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Prevent multiple recognition instances
    if (isListening) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = lang === "auto" ? "en-US" : `${lang}-${lang.toUpperCase()}`;
    recognition.interimResults = false; // Disable interim results to avoid partial repeats
    recognition.continuous = false; // Disable continuous mode to avoid multiple triggers

    recognition.onresult = (event) => {
      const finalTranscript = event.results[0][0].transcript; // Process only final result
      onResult(finalTranscript);
      recognition.stop(); // Stop recognition after final result
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

  // Stop speech recognition
  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Speak text using speech synthesis
  const speakText = useCallback(
    (textToSpeak, lang) => {
      if (!window.speechSynthesis) {
        setError("Speech synthesis is not supported in your browser.");
        setTimeout(() => setError(""), 3000);
        return;
      }

      // Stop any ongoing speech and recognition to prevent overlap/feedback
      window.speechSynthesis.cancel();
      stopSpeechRecognition();

      if (!textToSpeak.trim()) {
        setError("No text to read aloud.");
        setTimeout(() => setError(""), 3000);
        return;
      }

      // Prevent multiple speak calls while speaking
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

      // Select matching voice or fallback to en-US
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

  // Cleanup on unmount
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


// Hook: Handle camera stream and OCR
const useCamera = () => {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not supported in your browser.");
      setTimeout(() => setError(""), 3000);
      return false;
    }

    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      setStream(mediaStream);
      return true;
    } catch (error) {
      let errorMessage = "Failed to access camera.";
      if (error.name === "NotAllowedError") {
        errorMessage = "Camera access denied. Please allow camera permissions.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      }
      setError(errorMessage);
      setTimeout(() => setError(""), 3000);
      return false;
    }
  }, [facingMode, stream]);

  const toggleCameraFacing = useCallback(async () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not supported in your browser.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
      });
      setStream(mediaStream);
    } catch (error) {
      let errorMessage = "Failed to switch camera.";
      if (error.name === "NotAllowedError") {
        errorMessage = "Camera access denied. Please allow camera permissions.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "Requested camera not found on this device.";
      }
      setError(errorMessage);
      setTimeout(() => setError(""), 3000);
      setFacingMode(facingMode);
    }
  }, [facingMode, stream]);

  const captureAndProcessImage = useCallback(async () => {
    if (!canvasRef.current || !videoRef.current) {
      setError("Camera stream not available. Please reopen the camera.");
      setTimeout(() => setError(""), 3000);
      return null;
    }

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Unable to get canvas context");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");

      const result = await Tesseract.recognize(dataUrl, "eng", {
        logger: (m) => console.log("Tesseract Logger:", m),
      });

      if (result.data.confidence < 50) {
        setError("Text detection confidence too low. Please try a clearer image.");
        setTimeout(() => setError(""), 3000);
        return null;
      }

      let extractedText = result.data.text
        .replace(/[^a-zA-Z0-9\s@.\n]/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (!extractedText) {
        setError("No valid text detected in the image.");
        setTimeout(() => setError(""), 3000);
        return null;
      }

      return extractedText;
    } catch (error) {
      setError(`Error: ${error.message || "Failed to process image"}`);
      setTimeout(() => setError(""), 3000);
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((error) => {
        setError("Failed to play video stream. Please ensure camera permissions are granted.");
        setTimeout(() => setError(""), 3000);
      });
    }
  }, [stream]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return { stream, startCamera, stopCamera, toggleCameraFacing, captureAndProcessImage, videoRef, canvasRef, error, setError };
};

// Hook: Handle geolocation and language detection
const useGeolocation = (setTo, setDetectedLanguage) => {
  const [error, setError] = useState("");

  const setFallbackLanguage = useCallback(() => {
    const browserLang = navigator.language.split("-")[0];
    const validLang = languages.find((lang) => lang.code === browserLang)?.code || "en";
    setDetectedLanguage(validLang);
    setTo(validLang);
  }, [setDetectedLanguage, setTo]);

  const fetchLocationAndSetLanguage = useCallback(
    async (lat, lon, retries = 3) => {
      while (retries > 0) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { "User-Agent": "TranslatorApp/1.0 (your@email.com)" }, timeout: 10000 }
          );
          if (!response.ok) throw new Error(`Nominatim API error: ${response.status}`);
          const data = await response.json();
          const state = data.address?.state;
          const country = data.address?.country;

          const stateToLanguage = {
            Maharashtra: "mr", "Uttar Pradesh": "hi", "West Bengal": "bn", "Tamil Nadu": "ta",
            Gujarat: "gu", Karnataka: "kn", Rajasthan: "hi", Punjab: "pa", Bihar: "hi",
            Kerala: "ml", Telangana: "te", "Andhra Pradesh": "te", "Madhya Pradesh": "hi",
            Odisha: "or", Assam: "as", Jharkhand: "hi", Chhattisgarh: "hi", Haryana: "hi",
            "Himachal Pradesh": "hi", Uttarakhand: "hi", Manipur: "mtei", Meghalaya: "en",
            Mizoram: "en", Nagaland: "en", Sikkim: "ne", Tripura: "bn", "Arunachal Pradesh": "en",
            Goa: "kn", Delhi: "hi", "Jammu and Kashmir": "ur", Ladakh: "hi",
          };

          const countryToLanguage = {
            India: "hi", China: "zh", Japan: "ja", Germany: "de", France: "fr", Spain: "es",
            Italy: "it", Brazil: "pt", Russia: "ru", "United States": "en", "United Kingdom": "en",
            Canada: "en", Australia: "en", Nigeria: "en", "South Africa": "en", Mexico: "es",
            Argentina: "es", "South Korea": "ko", Indonesia: "id", Pakistan: "ur", Bangladesh: "bn",
            Turkey: "tr", Egypt: "ar", "Saudi Arabia": "ar", Thailand: "th", Vietnam: "vi",
          };

          let detectedLang = "en";
          if (country === "India" && state && stateToLanguage[state]) detectedLang = stateToLanguage[state];
          else if (country && countryToLanguage[country]) detectedLang = countryToLanguage[country];
          const validLang = languages.find((lang) => lang.code === detectedLang)?.code || "en";
          setDetectedLanguage(validLang);
          setTo(validLang);
          setError("");
          return;
        } catch (error) {
          retries--;
          if (retries === 0) {
            setError("Failed to detect location. Using default language.");
            setTimeout(() => setError(""), 5000);
            setFallbackLanguage();
          }
          await new Promise((resolve) => setTimeout(resolve, 1000 * (4 - retries)));
        }
      }
    },
    [setDetectedLanguage, setTo, setFallbackLanguage]
  );

  const getUserLanguage = useCallback(
    (retries = 3) => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser.");
        setTimeout(() => setError(""), 2000);
        setFallbackLanguage();
        return;
      }

      const attemptGeolocation = (attempt) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            fetchLocationAndSetLanguage(latitude, longitude);
          },
          (error) => {
            if (error.code === error.POSITION_UNAVAILABLE && attempt < retries) {
              setTimeout(() => attemptGeolocation(attempt + 1), 2000 * attempt);
              return;
            }
            let errorMessage = "An error occurred while accessing your location.";
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "Please allow location access for better language detection.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information unavailable. Using default language.";
                break;
              case error.TIMEOUT:
                errorMessage = "Location request timed out. Try again later.";
                break;
              default:
                errorMessage = "An unexpected error occurred. Using default language.";
            }
            setError(errorMessage);
            setTimeout(() => setError(""), 5000);
            setFallbackLanguage();
          },
          { timeout: 30000, maximumAge: 300000, enableHighAccuracy: false }
        );
      };
      attemptGeolocation(1);
    },
    [fetchLocationAndSetLanguage, setFallbackLanguage]
  );

  return { getUserLanguage, error, setError };
};

// Component: Error message display
const ErrorMessage = ({ error, onClose, onRetry }) => {
  if (!error) return null;

  return (
    <div className="text-red-500 text-center mb-4 p-3 rounded-lg flex justify-between items-center">
      <p>
        {error} {error.includes("unavailable") && "This may be due to a weak signal."}
      </p>
      <div className="flex gap-2">
        {onRetry && (
          <button onClick={onRetry} className="text-blue-700 hover:text-blue-900">
            Try Again
          </button>
        )}
        <button onClick={onClose} className="text-red-700 hover:text-red-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Component: Language selector dropdown
const LanguageSelector = ({ selectedLang, onSelect, isOpen, setIsOpen, search, setSearch }) => {
  const filteredLanguages = useMemo(
    () => languages.filter((lang) => lang.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <div className="relative w-full" onClick={() => setIsOpen(!isOpen)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border p-3 rounded-lg flex justify-between items-center"
        aria-label={`Select ${selectedLang} language`}
      >
        {languages.find((lang) => lang.code === selectedLang)?.name || "Select Language"}
        <svg
          className="w-4 h-4 ml-2 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search languages..."
            className="w-full p-2 border-b rounded-t-lg focus:outline-none"
            autoFocus
            aria-label="Search languages"
          />
          <div className="max-h-40 overflow-y-auto">
            {filteredLanguages.sort((a, b) => a.name.localeCompare(b.name)).map((lang) => (
              <div
                key={lang.code}
                onClick={() => {
                  onSelect(lang.code);
                  setSearch("");
                  setIsOpen(false);
                }}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                role="option"
                aria-selected={selectedLang === lang.code}
              >
                {lang.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Component: Input textarea and controls
const TextInput = ({
  value,
  onChange,
  onMicrophoneToggle,
  isListening,
  onSpeak,
  onCameraOpen,
  onPhotoUpload,
  onDocumentUpload,
}) => {
  const textareaRef = useRef(null);
  const [inputHeight, setInputHeight] = useState("auto");
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const maxChars = 5000;
  const charCount = value.length;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
      setInputHeight(`${scrollHeight}px`);
    }
  }, [value]);

  return (
    <div className="p-4 border rounded-lg min-h-40 relative">
      <div className="flex items-start gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-32 resize-none focus:outline-none"
          placeholder="Enter text or use the microphone..."
          style={{ height: inputHeight, overflowWrap: "break-word", whiteSpace: "pre-wrap" }}
          aria-label="Input text for translation"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-gray-500 hover:text-gray-900"
            aria-label="Clear input"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex justify-between mb-2">
        <button
          onClick={onMicrophoneToggle}
          className="text-gray-500 hover:text-gray-700"
          aria-label={isListening ? "Stop microphone" : "Start microphone"}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <div className="flex gap-4">
          <button
            onClick={onSpeak}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Speak input text"
          >
            <Volume2 className="w-6 h-6" />
          </button>
          <button
            onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Open upload menu"
          >
            <FaPaperclip className="w-6 h-6" />
          </button>
          {isUploadMenuOpen && (
            <div className="absolute z-10 bottom-12 right-4 bg-white border rounded-lg shadow-lg p-2">
              <button
                onClick={onCameraOpen}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 w-full text-left"
                aria-label="Open camera"
              >
                <FaCamera className="w-4 h-4" /> Camera
              </button>
              <label className="flex items-center gap-2 p-2 hover:bg-gray-100 w-full text-left cursor-pointer">
                <FaUpload className="w-4 h-4" /> Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPhotoUpload}
                  className="hidden"
                  aria-label="Upload photo"
                />
              </label>
              <label className="flex items-center gap-2 p-2 hover:bg-gray-100 w-full text-left cursor-pointer">
                <FaUpload className="w-4 h-4" /> Document
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={onDocumentUpload}
                  className="hidden"
                  aria-label="Upload document"
                />
              </label>
            </div>
          )}
          <div className="flex items-center text-md text-right">
            {charCount}/{maxChars}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component: Output text display and controls
const TextOutput = ({ text, loading, onCopy, onSpeak }) => {
  const outputRef = useRef(null);
  const [outputHeight, setOutputHeight] = useState("auto");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.style.height = "auto";
      const scrollHeight = outputRef.current.scrollHeight;
      outputRef.current.style.height = `${scrollHeight}px`;
      setOutputHeight(`${scrollHeight}px`);
    }
  }, [text, loading]);

  const handleCopy = useCallback(() => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy();
  }, [text, onCopy]);

  return (
    <div className="flex items-start p-4 border rounded-lg min-h-40">
      <div
        ref={outputRef}
        className="w-full"
        style={{ height: outputHeight, overflowWrap: "break-word", whiteSpace: "pre-wrap" }}
        aria-live="polite"
      >
        {loading ? (
          <span className="text-gray-500 flex gap-1">
            Loading<span className="animate-bounce">.</span>
            <span className="animate-bounce delay-100">.</span>
            <span className="animate-bounce delay-200">.</span>
          </span>
        ) : text.startsWith("Error:") ? (
          <p className="text-red-500">{text}</p>
        ) : text ? (
          <p>{text}</p>
        ) : (
          <span className="text-gray-500">Translation will appear here...</span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="text-gray-500 hover:text-black"
          aria-label={copied ? "Text copied" : "Copy text"}
        >
          {copied ? (
            <HiClipboardCheck className="w-5 h-5 text-green-500" />
          ) : (
            <HiClipboard className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={onSpeak}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Speak output text"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Component: Camera modal for capturing and processing images
const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const { stream, startCamera, stopCamera, toggleCameraFacing, captureAndProcessImage, videoRef, canvasRef, error, setError } =
    useCamera();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, startCamera, stopCamera]);

  const handleCapture = useCallback(async () => {
    setLoading(true);
    const extractedText = await captureAndProcessImage();
    if (extractedText) {
      onCapture(extractedText);
      onClose();
    }
    setLoading(false);
  }, [captureAndProcessImage, onCapture, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded-lg max-w-md w-full sm:min-h-[300px] sm:max-h-[50vh] min-h-[450px] max-h-[70vh] flex flex-col">
        <ErrorMessage error={error} onClose={() => setError("")} />
        <div className="relative w-full flex-1 overflow-hidden rounded-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain rounded-lg"
            aria-label="Camera preview"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex justify-between items-center mt-4 gap-2">
          <button
            onClick={toggleCameraFacing}
            className="flex-1 px-2 py-2 text-black active:scale-150 transition-transform duration-150 rounded-lg flex items-center justify-center"
            aria-label="Toggle camera facing"
          >
            <FaSyncAlt className="inline-block mr-2" />
          </button>
          <button
            onClick={handleCapture}
            className={`w-16 h-16 rounded-full bg-white border border-gray-300 flex items-center justify-center disabled:opacity-50 hover:bg-gray-100 active:scale-105 transition-transform duration-150 ${
              loading ? "animate-spin-border" : ""
            }`}
            disabled={loading}
            aria-label="Capture image"
          >
            <div className="w-8 h-8 bg-black rounded-sm"></div>
          </button>
          <button
            onClick={onClose}
            className="flex-1 group relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-800 hover:text-red-600 transition-all duration-200 ease-in-out active:scale-95"
            aria-label="Close camera"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-red-500 transition-transform duration-200 group-hover:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={4}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Component: History sidebar
const HistorySidebar = ({ isOpen, setIsOpen, history, setHistory }) => {
  const sidebarRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`${backendURL}/history/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await axios.delete(`${backendURL}/history/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error deleting history:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen]);

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-0 z-50 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 p-4 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ maxHeight: "100vh", overflowY: "auto", overflowX: "hidden" }}
      aria-label="Translation history"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-800">History</h2>
        <button
          className="text-gray-600 p-1 rounded hover:bg-gray-300"
          onClick={() => setIsOpen(false)}
          aria-label="Close history"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
            />
          </svg>
        </button>
      </div>
      {history.length === 0 ? (
        <p className="text-gray-500">No history available</p>
      ) : (
        <ul className="space-y-4">
          {history.map((item) => (
            <li
              key={item._id}
              className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 relative"
            >
              <div className="w-16 h-1 bg-purple-300 rounded mb-3"></div>
              <div className="text-gray-700 text-sm">
                <div className="flex justify-start mb-1">
                  <span className="text-purple-700 font-semibold">{item.from.toUpperCase()}→</span>
                  <span className="text-purple-700 font-semibold">{item.to.toUpperCase()}</span>
                </div>
                <p className="mb-1">
                  {item.input} → {item.translation}
                </p>
              </div>
              <button
                onClick={() => deleteHistoryItem(item._id)}
                className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
                aria-label="Delete history item"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};





// Main Component: Translator
const Translator = () => {
  const [text, setText] = useState("");
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("hi");
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loginWarning, setLoginWarning] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("en");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { translatedText, loading, error: translationError, setError: setTranslationError, history, setHistory, translateText } = useTranslation();
  const { isListening, startSpeechRecognition, stopSpeechRecognition, speakText, error: speechError, setError: setSpeechError, isSpeaking } = useSpeech(from, (transcript) => setText((prev) => prev + transcript));
  const { getUserLanguage, error: locationError, setError: setLocationError } = useGeolocation(setTo, setDetectedLanguage);

  useEffect(() => {
    getUserLanguage();
  }, [getUserLanguage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.trim()) translateText(text, from, to);
      else setTranslatedText("");
    }, 500);
    return () => clearTimeout(timer);
  }, [text, from, to, translateText]);

  const handleSwapLanguages = useCallback(() => {
    setFrom(to);
    setTo(from);
    setText(translatedText);
    if (translatedText) translateText(translatedText, to, from);
  }, [from, to, translatedText, translateText]);

  const handleHistoryClick = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoginWarning("Please log in to view your translation history.");
      setTimeout(() => setLoginWarning(""), 3000);
      return;
    }
    setIsHistoryOpen(true);
  }, []);

  const handlePhotoUpload = useCallback(
    async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setTranslationError("");
      try {
        const result = await Tesseract.recognize(file, "eng", {
          logger: (m) => console.log("Tesseract Logger:", m),
        });
        const extractedText = result.data.text
          .replace(/[^a-zA-Z0-9\s@.\n]/g, "")
          .replace(/[ \t]+/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

        if (extractedText) {
          setText(extractedText);
          await translateText(extractedText, from, to);
        } else {
          setTranslationError("No text detected in the image.");
          setTimeout(() => setTranslationError(""), 3000);
        }
      } catch (error) {
        setTranslationError(`Error: ${error.message || "Failed to process photo"}`);
        setTimeout(() => setTranslationError(""), 3000);
      }
    },
    [from, to, translateText, setTranslationError]
  );

  const handleDocumentUpload = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const docData = e.target.result;
        const cleanedText = docData.trim();

        if (cleanedText) {
          setText(cleanedText);
          translateText(cleanedText, from, to);
        } else {
          setTranslationError("No text found in the document.");
          setTimeout(() => setTranslationError(""), 3000);
        }
      };
      reader.onerror = () => {
        setTranslationError("Error reading the document file.");
        setTimeout(() => setTranslationError(""), 3000);
      };
      reader.readAsText(file);
    },
    [translateText, setTranslationError]
  );

  return (
    <div className="flex flex-col md:mt-4 justify-center p-4">
      <div className="card p-4 bg-white rounded-2xl shadow-2xl mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <LanguageSelector
            selectedLang={from}
            onSelect={setFrom}
            isOpen={isFromOpen}
            setIsOpen={setIsFromOpen}
            search={searchFrom}
            setSearch={setSearchFrom}
          />
          <button
            onClick={handleSwapLanguages}
            className="p-3 rounded-full hover:bg-gray-200 transition self-center sm:self-auto text-gray-600"
            aria-label="Swap languages"
          >
            <ArrowLeftRight />
          </button>
          <LanguageSelector
            selectedLang={to}
            onSelect={setTo}
            isOpen={isToOpen}
            setIsOpen={setIsToOpen}
            search={searchTo}
            setSearch={setSearchTo}
          />
        </div>
      </div>

      <div className="card relative p-6 bg-white rounded-2xl sm:mt-0 shadow-2xl w-full transition-all">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Languages className="text-purple-700" />
            <div>PolyglotPro</div>
          </h1>
        </div>
        <ErrorMessage error={locationError} onClose={() => setLocationError("")} onRetry={getUserLanguage} />
        <ErrorMessage error={loginWarning} onClose={() => setLoginWarning("")} />
        <ErrorMessage error={translationError || speechError} onClose={() => { setTranslationError(""); setSpeechError(""); }} />
        <div className="flex gap-6 grid grid-cols-1 sm:grid-cols-2">
          <TextInput
            value={text}
            onChange={setText}
            onMicrophoneToggle={() => (isListening ? stopSpeechRecognition() : startSpeechRecognition())}
            isListening={isListening}
            onSpeak={() => speakText(text, from === "auto" ? "en" : from)}
            onCameraOpen={() => setIsCameraOpen(true)}
            onPhotoUpload={handlePhotoUpload}
            onDocumentUpload={handleDocumentUpload}
          />
          <TextOutput
            text={translatedText}
            loading={loading}
            onCopy={() => {}}
            onSpeak={() => speakText(translatedText, to)}
          />
        </div>
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(extractedText) => {
          setText(extractedText);
          translateText(extractedText, from, to);
        }}
      />

      <div className="mt-12">
        <button
          onClick={handleHistoryClick}
          className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg bg-purple-800 text-white"
          aria-label="View history"
        >
          <FaHistory size={24} />
        </button>
        <HistorySidebar
          isOpen={isHistoryOpen}
          setIsOpen={setIsHistoryOpen}
          history={history}
          setHistory={setHistory}
        />
      </div>
    </div>
  );
};

export default Translator;
