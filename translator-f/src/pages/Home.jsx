import axios from "axios";
import { ArrowLeftRight, Home, Languages, Mic, MicOff, Volume2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { HiClipboard, HiClipboardCheck } from "react-icons/hi";
import { FaHistory, FaCamera, FaUpload, FaPaperclip, FaSyncAlt } from "react-icons/fa";
import Tesseract from "tesseract.js";

const backendURL = import.meta.env.VITE_BACKEND_URL || "https://translator-5-6fr1.onrender.com";

// Supported Tesseract languages
const supportedTesseractLangs = ["eng", "hin", "tam", "ben"];

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

const Translator = () => {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("hi");
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  const textareaRef = useRef(null);
  const outputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputHeight, setInputHeight] = useState("auto");
  const [outputHeight, setOutputHeight] = useState("auto");
  const [detectedLanguage, setDetectedLanguage] = useState("en");
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [loginWarning, setLoginWarning] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef(null);
  const [isSpeakingInput, setIsSpeakingInput] = useState(false);
  const [isSpeakingOutput, setIsSpeakingOutput] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // Default to front camera

  const getCharCount = (text) => text.length;
  const charCount = getCharCount(text);
  const maxChars = 5000;

  // Filter languages based on search term
  const filteredFromLanguages = languages.filter((lang) =>
    lang.name.toLowerCase().includes(searchFrom.toLowerCase())
  );
  const filteredToLanguages = languages.filter((lang) =>
    lang.name.toLowerCase().includes(searchTo.toLowerCase())
  );

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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
      setInputHeight(`${scrollHeight}px`);
    }
  }, [text]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.style.height = "auto";
      const scrollHeight = outputRef.current.scrollHeight;
      outputRef.current.style.height = `${scrollHeight}px`;
      setOutputHeight(`${scrollHeight}px`);
    }
  }, [translatedText, loading]);

  // Attach the stream to the video element when the camera is opened or facingMode changes
  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
        setSpeechError("Failed to play video stream. Please ensure camera permissions are granted.");
        setTimeout(() => setSpeechError(""), 3000);
      });
    }
  }, [isCameraOpen, stream]);

  // Clean up the stream when the component unmounts or camera is closed
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const startSpeechRecognition = () => {
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in your browser.");
      setTimeout(() => setSpeechError(""), 3000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = from === "auto" ? "en-US" : `${from}-${from.toUpperCase()}`;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setText((prev) => prev + finalTranscript);
      }
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
          break;
      }
      setSpeechError(errorMessage);
      setTimeout(() => setSpeechError(""), 3000);
      setIsListening(false);
      recognition.stop();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
    setSpeechError("");
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleMicrophone = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const speakText = (textToSpeak, lang, isInput) => {
    if (!window.speechSynthesis) {
      setSpeechError("Speech synthesis is not supported in your browser.");
      setTimeout(() => setSpeechError(""), 3000);
      return;
    }

    window.speechSynthesis.cancel();

    if ((isInput && isSpeakingInput) || (!isInput && isSpeakingOutput)) {
      if (isInput) setIsSpeakingInput(false);
      else setIsSpeakingOutput(false);
      return;
    }

    if (!textToSpeak.trim()) {
      setSpeechError("No text to read aloud.");
      setTimeout(() => setSpeechError(""), 3000);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const langMap = {
      ar: "ar-SA", as: "as-IN", bn: "bn-IN", brx: "brx-IN", de: "de-DE", en: "en-US",
      es: "es-ES", fr: "fr-FR", gbm: "gbm-IN", gu: "gu-IN", hi: "hi-IN", it: "it-IT",
      ja: "ja-JP", kfy: "kfy-IN", kn: "kn-IN", ko: "ko-KR", ml: "ml-IN", mr: "mr-IN",
      mtei: "mni-IN", or: "or-IN", pa: "pa-IN", pt: "pt-BR", ru: "ru-RU", ta: "ta-IN",
      tcy: "tcy-IN", te: "te-IN", zh: "zh-CN",
    };
    const speechLang = langMap[lang] || "en-US";
    utterance.lang = speechLang;

    const matchingVoice = availableVoices.find((voice) => voice.lang === speechLang);
    if (matchingVoice) utterance.voice = matchingVoice;
    else {
      setSpeechError(`No voice available for ${lang}. Try installing a ${lang} language pack.`);
      setTimeout(() => setSpeechError(""), 5000);
    }

    utterance.onend = () => {
      if (isInput) setIsSpeakingInput(false);
      else setIsSpeakingOutput(false);
    };

    utterance.onerror = (event) => {
      setSpeechError(`Speech synthesis error: ${event.error}`);
      setTimeout(() => setSpeechError(""), 3000);
      if (isInput) setIsSpeakingInput(false);
      else setIsSpeakingOutput(false);
    };

    window.speechSynthesis.speak(utterance);
    if (isInput) setIsSpeakingInput(true);
    else setIsSpeakingOutput(true);
  };

  const toggleSpeakInput = () => speakText(text, from === "auto" ? "en" : from, true);
  const toggleSpeakOutput = () => speakText(translatedText, to, false);

  const getUserLanguage = (retries = 3) => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setTimeout(() => setLocationError(""), 2000);
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
              break;
          }
          setLocationError(errorMessage);
          setTimeout(() => setLocationError(""), 5000);
          setFallbackLanguage();
        },
        { timeout: 30000, maximumAge: 300000, enableHighAccuracy: false }
      );
    };
    attemptGeolocation(1);
  };

  const setFallbackLanguage = () => {
    const browserLang = navigator.language.split("-")[0];
    const validLang = languages.find((lang) => lang.code === browserLang)?.code || "en";
    setDetectedLanguage(validLang);
    setTo(validLang);
  };

  const fetchLocationAndSetLanguage = async (lat, lon, retries = 3) => {
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
        setLocationError("");
        return;
      } catch (error) {
        retries--;
        if (retries === 0) {
          setLocationError("Failed to detect location. Using default language.");
          setTimeout(() => setLocationError(""), 5000);
          setFallbackLanguage();
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * (4 - retries)));
      }
    }
  };

  useEffect(() => {
    getUserLanguage();
  }, []);

  const handleHistoryClick = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoginWarning("Please log in to view your translation history.");
      setTimeout(() => setLoginWarning(""), 3000);
      return;
    }
    setIsHistoryOpen(true);
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const translateText = async (inputText) => {
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
        setSpeechError(translated.replace("Error: ", ""));
        setTimeout(() => setSpeechError(""), 3000);
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
      setTranslatedText(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const swapLanguages = () => {
    setFrom(to);
    setTo(from);
    setText(translatedText);
    setTranslatedText("");
    if (translatedText) {
      translateText(translatedText);
    }
  };

  const handleCameraScan = async () => {
    setIsUploadMenuOpen(false);
    setSpeechError("");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSpeechError("Camera access is not supported in your browser.");
      setTimeout(() => setSpeechError(""), 3000);
      return;
    }

    try {
      // Stop any existing stream before starting a new one
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (error) {
      let errorMessage = "Failed to access camera.";
      if (error.name === "NotAllowedError") {
        errorMessage = "Camera access denied. Please allow camera permissions.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      }
      setSpeechError(errorMessage);
      setTimeout(() => setSpeechError(""), 3000);
    }
  };

  const toggleCameraFacing = async () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSpeechError("Camera access is not supported in your browser.");
      setTimeout(() => setSpeechError(""), 3000);
      return;
    }

    try {
      // Stop the current stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Start a new stream with the updated facingMode
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
      setSpeechError(errorMessage);
      setTimeout(() => setSpeechError(""), 3000);
      // Revert facingMode if switching fails
      setFacingMode(facingMode);
    }
  };

  const captureAndProcessImage = async () => {
    if (!canvasRef.current || !videoRef.current) {
      setSpeechError("Camera stream not available. Please reopen the camera.");
      setTimeout(() => setSpeechError(""), 3000);
      closeCamera();
      return;
    }
  
    setLoading(true);
    setSpeechError("");
  
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
  
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to get canvas context");
      }
  
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
  
      console.log("Starting Tesseract OCR...");
      const result = await Tesseract.recognize(dataUrl, "eng", {
        logger: (m) => console.log("Tesseract Logger:", m),
      });
  
      console.log("OCR Result:", result);
      console.log("Extracted Text:", result.data.text);
      console.log("Confidence:", result.data.confidence);
  
      // Check OCR confidence
      if (result.data.confidence < 50) {
        setSpeechError("Text detection confidence too low. Please try a clearer image.");
        setTimeout(() => setSpeechError(""), 3000);
        setLoading(false);
        closeCamera();
        return;
      }
  
      // Clean the extracted text
      let extractedText = result.data.text;
  
      // Step 1: Remove unwanted symbols, but keep letters, numbers, spaces, @, periods, and line breaks
      extractedText = extractedText.replace(/[^a-zA-Z0-9\s@.\n]/g, "").trim();
  
      // Step 2: Remove multiple spaces, but preserve line breaks
      extractedText = extractedText.replace(/[ \t]+/g, " ");
  
      // Step 3: Remove excessive newlines (e.g., more than 2 consecutive newlines)
      extractedText = extractedText.replace(/\n{3,}/g, "\n\n");
  
      console.log("Cleaned Text:", extractedText);
  
      if (extractedText) {
        setText(extractedText);
        await translateText(extractedText);
      } else {
        setSpeechError("No valid text detected in the image.");
        setTimeout(() => setSpeechError(""), 3000);
      }
    } catch (error) {
      console.error("Capture or Processing Error:", error);
      setSpeechError(`Error: ${error.message || "Failed to process image"}`);
      setTimeout(() => setSpeechError(""), 3000);
    } finally {
      setLoading(false);
      closeCamera();
    }
  };
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setSpeechError("");

    try {
      console.log("Processing photo upload...");
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => console.log("Tesseract Logger:", m),
      });

      console.log("OCR completed, extracted text:", result.data.text);
      const extractedText = result.data.text.trim();

      if (extractedText) {
        setText(extractedText);
        await translateText(extractedText);
        setIsUploadMenuOpen(false);
      } else {
        console.error("No text extracted from image.");
        setSpeechError("No text detected in the image.");
        setTimeout(() => setSpeechError(""), 3000);
      }
    } catch (error) {
      console.error("Photo Upload or Processing Error:", error);
      setSpeechError(`Error: ${error.message || "Failed to process photo"}`);
      setTimeout(() => setSpeechError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const docData = e.target.result;
      const cleanedText = docData.trim();

      if (cleanedText) {
        setText(cleanedText);
        translateText(cleanedText);
        setIsUploadMenuOpen(false);
      } else {
        setSpeechError("No text found in the document.");
        setTimeout(() => setSpeechError(""), 3000);
      }
    };

    reader.onerror = () => {
      setSpeechError("Error reading the document file.");
      setTimeout(() => setSpeechError(""), 3000);
    };

    reader.readAsText(file);
  };

  useEffect(() => {
    if (!text.trim()) {
      setTranslatedText("");
      return;
    }
    const timer = setTimeout(() => translateText(text), 500);
    return () => clearTimeout(timer);
  }, [text, from, to]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="flex flex-col mt-24 justify-center p-4">
      <div className="card p-4 bg-white rounded-2xl shadow-2xl mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className=" relative w-full sm:w-1/3" onClick={() => setIsFromOpen(!isFromOpen)}>
            <button
              onClick={() => setIsFromOpen(!isFromOpen)}
              className="w-full border p-3 rounded-lg flex justify-between items-center"
            >
              {languages.find((lang) => lang.code === from)?.name || "Select Language"}
              <svg
                className="w-4 h-4 ml-2  transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={{ transform: isFromOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isFromOpen && (
              <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1">
                <input
                  type="text"
                  value={searchFrom}
                  onChange={(e) => setSearchFrom(e.target.value)}
                  placeholder="Search languages..."
                  className="w-full p-2 border-b rounded-t-lg focus:outline-none"
                  autoFocus
                />
                <div className="max-h-40 overflow-y-auto">
                  {filteredFromLanguages.sort((a, b) => a.name.localeCompare(b.name)).map((lang) => (
                    <div
                      key={lang.code}
                      onClick={() => {
                        setFrom(lang.code);
                        setSearchFrom("");
                        setIsFromOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {lang.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={swapLanguages}
            className="p-3 rounded-full hover:bg-gray-200 transition self-center sm:self-auto text-gray-600"
          >
            <ArrowLeftRight />
          </button>

          <div className="relative w-full sm:w-1/3">
            <button
              onClick={() => setIsToOpen(!isToOpen)}
              className="w-full border p-3 rounded-lg flex justify-between items-center"
            >
              {languages.find((lang) => lang.code === to)?.name || "Select Language"}
              <svg
                className="w-4 h-4 ml-2 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={{ transform: isToOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isToOpen && (
              <div className="absolute z-20 w-full bg-white border rounded-lg shadow-lg mt-1" style={{ top: '100%' }}>
                <input
                  type="text"
                  value={searchTo}
                  onChange={(e) => setSearchTo(e.target.value)}
                  placeholder="Search languages..."
                  className="w-full p-2 border-b rounded-t-lg focus:outline-none"
                  autoFocus
                />
                <div className="max-h-40 overflow-y-auto">
                  {filteredToLanguages.sort((a, b) => a.name.localeCompare(b.name)).map((lang) => (
                    <div
                      key={lang.code}
                      onClick={() => {
                        setTo(lang.code);
                        setSearchTo("");
                        setIsToOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {lang.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6 bg-white rounded-2xl sm:mt-0 shadow-2xl w-full transition-all">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Languages className="text-purple-700" />
            <div>PolyglotPro</div>
          </h1>
        </div>
        {locationError && (
          <div className="text-red-500 text-center mb-4 p-3 preheated-lg flex justify-between items-center">
            <p>{locationError} {locationError.includes("unavailable") && "This may be due to a weak signal."}</p>
            <div className="flex gap-2">
              <button onClick={() => getUserLanguage()} className="text-blue-700 hover:text-blue-900">Try Again</button>
              <button onClick={() => setLocationError("")} className="text-red-700 hover:text-red-900">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {loginWarning && (
          <div className="text-red-500 text-center mb-4 p-3 rounded-lg flex justify-between items-center">
            <p>{loginWarning}</p>
            <button onClick={() => setLoginWarning("")} className="text-red-700 hover:text-red-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {speechError && (
          <div className="text-red-500 text-center mb-4 p-3 rounded-lg flex justify-between items-center">
            <p>{speechError}</p>
            <button onClick={() => setSpeechError("")} className="text-red-700 hover:text-red-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex gap-6 grid grid-cols-1 sm:grid-cols-2">
          <div className="p-4 border rounded-lg min-h-40">
            <div className="flex justify-between mb-2">
              <button onClick={toggleMicrophone} className="text-gray-500 hover:text-gray-700">
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <div className="flex gap-4">
                {text && (
                  <button onClick={() => setText("")} className="text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button onClick={toggleSpeakInput} className="text-gray-500 hover:text-gray-700">
                  <Volume2 className="w-6 h-6" />
                </button>
                <button onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)} className="text-gray-500 hover:text-gray-700">
                  <FaPaperclip className="w-6 h-6" />
                </button>
              </div>
            </div>
            {isUploadMenuOpen && (
              <div className="absolute z-10 left-[180px] md:bottom-[80px] md:left-[450px] bg-white border rounded-lg shadow-lg p-2">
                <button onClick={handleCameraScan} className="flex items-center gap-2 p-2 hover:bg-gray-100 w-full text-left">
                  <FaCamera className="w-4 h-4" /> Camera
                </button>
                <label className="flex items-center gap-2 p-2 hover:bg-gray-100 w-full text-left cursor-pointer">
                  <FaUpload className="w-4 h-4" /> Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={loading} />
                </label>
                <label className="flex items-center gap-2 p-2 hover:bg-gray-100 w-full text-left cursor-pointer">
                  <FaUpload className="w-4 h-4" /> Document
                  <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleDocumentUpload} className="hidden" />
                </label>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-32 rounded-lg resize-none focus:outline-none"
              placeholder="Enter text or use the microphone..."
              style={{ height: inputHeight, overflowWrap: "break-word", whiteSpace: "pre-wrap" }}
            />
            <div className="mt-2 text-sm text-right">
              {charCount}/{maxChars}
            </div>
          </div>
          <div className="card relative p-4 border rounded-lg min-h-40">
            <div className={`absolute top-4 right-2 flex gap-2 ${isToOpen ? 'hidden' : 'z-10'}`}>
              <button onClick={handleCopy} className="text-gray-500 hover:text-black">
                {copied ? (
                  <HiClipboardCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <HiClipboard className="w-5 h-5" />
                )}
              </button>
              <button onClick={toggleSpeakOutput} className="text-gray-500 hover:text-gray-700">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <div
              ref={outputRef}
              className="w-full mt-6"
              style={{ height: outputHeight, overflowWrap: "break-word", whiteSpace: "pre-wrap" }}
            >
              {loading ? (
                <span className="text-gray-500 flex gap-1">
                  Loading<span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </span>
              ) : translatedText.startsWith("Error:") ? (
                <p className="text-red-500">{translatedText}</p>
              ) : translatedText ? (
                <p>{translatedText}</p>
              ) : (
                <span className="text-gray-500">Translation will appear here...</span>
              )}
            </div>
          </div>
        </div>
      </div>
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-lg max-w-md w-full sm:min-h-[300px] sm:max-h-[50vh] min-h-[450px] max-h-[70vh] flex flex-col">
            <div className="relative w-full flex-1 overflow-hidden rounded-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain rounded-lg"
                onCanPlay={() => console.log("Video can play")}
                onError={(e) => console.error("Video error:", e)}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex justify-between items-center mt-4 gap-2">
  {/* Toggle Camera Button */}
  <button
    onClick={toggleCameraFacing}
    className="flex-1 px-2 py-2 text-black active:scale-150 transition-transform duration-150 rounded-lg flex items-center justify-center"
  >
    <FaSyncAlt className="inline-block mr-2" />
  </button>

  {/* Capture Button */}
  <button
    onClick={captureAndProcessImage}
    className={`w-16 h-16 rounded-full bg-white border border-gray-300 flex items-center justify-center disabled:opacity-50 hover:bg-gray-100 active:scale-105 transition-transform duration-150 ${
      loading ? "animate-spin-border" : ""
    }`}
    disabled={loading}
  >
    <div className="w-8 h-8 bg-black rounded-sm"></div>
  </button>

  {/* Cancel Button */}
  <button
    onClick={closeCamera}
    className="flex-1 group relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-800  hover:text-red-600 transition-all duration-200 ease-in-out active:scale-95"
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
      )}
      <div className="mt-12">
        <button
          onClick={handleHistoryClick}
          className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg bg-purple-800 text-white"
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





const HistorySidebar = ({ isOpen, setIsOpen, history, setHistory }) => {
  const sidebarRef = useRef(null); // Ref to the sidebar element
  const backendURL = import.meta.env.VITE_BACKEND_URL || "https://translator-5-6fr1.onrender.com";

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

  // Handle outside click to close the sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsOpen(false); // Close the sidebar if the click is outside
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
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-800">History</h2>
        <button
          className="text-gray-600 p-1 rounded hover:bg-gray-300"
          onClick={() => setIsOpen(false)}
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

              {/* Decorative Line */}
              <div className="w-16 h-1 bg-purple-300 rounded mb-3"></div>

              {/* Body: Structured text similar to the image */}
              <div className="text-gray-700 text-sm">
                <div className="flex justify-start mb-1">
                  <span className="text-purple-700 font-semibold">
                    {item.from.toUpperCase()}→
                  </span>
                  <span className="text-purple-700 font-semibold">
                    {item.to.toUpperCase()}
                  </span>
                </div>
                <p className="mb-1">
                  {item.input} → {item.translation}
                </p>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => deleteHistoryItem(item._id)}
                className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
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





export default Translator;