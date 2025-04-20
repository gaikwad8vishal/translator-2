
import axios from "axios";
import { ArrowLeftRight, Languages, Mic, MicOff, Volume2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { FaHistory } from "react-icons/fa";

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const languages = [
  { code: "auto", name: "Detect Language" },
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Albanian" },
  { code: "am", name: "Amharic" },
  { code: "ar", name: "Arabic" },
  { code: "as", name: "Assamese" },
  { code: "az", name: "Azerbaijani" },
  { code: "bn", name: "Bengali" },
  { code: "bs", name: "Bosnian" },
  { code: "ur", name: "Urdu" },
  { code: "bg", name: "Bulgarian" },
  { code: "zh", name: "Chinese" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "eu", name: "Basque" },
  { code: "nl", name: "Dutch" },
  { code: "en", name: "English" },
  { code: "et", name: "Estonian" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "gu", name: "Gujarati" },
  { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hu", name: "Hungarian" },
  { code: "is", name: "Icelandic" },
  { code: "id", name: "Indonesian" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "kn", name: "Kannada" },
  { code: "ko", name: "Korean" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "mai", name: "Maithili" },
  { code: "ml", name: "Malayalam" },
  { code: "ms", name: "Malay" },
  { code: "mr", name: "Marathi" },
  { code: "ne", name: "Nepali" },
  { code: "or", name: "Odia" },
  { code: "pa", name: "Punjabi" },
  { code: "sa", name: "Sanskrit" },
  { code: "si", name: "Sinhala" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "mtei", name: "Meitei" },
  { code: "tcy", name: "Tulu" },
  { code: "brx", name: "Bodo" },
  { code: "gbm", name: "Garhwali" },
  { code: "kfy", name: "Kumaoni" },
  { code: "ps", name: "Pashto" },
  { code: "bo", name: "Tibetan" },
  { code: "mn", name: "Mongolian" },
  { code: "lo", name: "Lao" },
  { code: "sw", name: "Swahili" },
  { code: "zu", name: "Zulu" },
  { code: "ha", name: "Hausa" },
  { code: "ga", name: "Irish" },
  { code: "cy", name: "Welsh" },
  { code: "hy", name: "Armenian" },
  { code: "ka", name: "Georgian" },
  { code: "ug", name: "Uyghur" },
  { code: "yi", name: "Yiddish" },
];

const Translator = () => {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [from, setFrom] = useState("en"); // Default to "en" for input language
  const [to, setTo] = useState("hi"); // Default output language => "hi"
  const textareaRef = useRef(null);
  const outputRef = useRef(null); // New ref for output div
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputHeight, setInputHeight] = useState("auto"); // Renamed for clarity
  const [outputHeight, setOutputHeight] = useState("auto"); // New state for output
  const [detectedLanguage, setDetectedLanguage] = useState("en");
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [loginWarning, setLoginWarning] = useState("");
  const [isListening, setIsListening] = useState(false); // Microphone state
  const [speechError, setSpeechError] = useState(""); // Speech recognition/synthesis errors
  const recognitionRef = useRef(null); // Reference to SpeechRecognition instance
  const [isSpeakingInput, setIsSpeakingInput] = useState(false); // Speech synthesis state
  const [isSpeakingOutput, setIsSpeakingOutput] = useState(false); // Speech synthesis state
  const [availableVoices, setAvailableVoices] = useState([]); // Store available voices

  // Calculate character count
  const getCharCount = (text) => text.length;
  const charCount = getCharCount(text);
  const maxChars = 5000;

  // Load available voices asynchronously
  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };
    updateVoices(); // Initial call
    window.speechSynthesis.onvoiceschanged = updateVoices; // Update when voices load
    return () => {
      window.speechSynthesis.onvoiceschanged = null; // Cleanup
    };
  }, []);

  // Adjust input textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
      setInputHeight(`${scrollHeight}px`);
    }
  }, [text]);

  // Adjust output div height
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.style.height = "auto";
      const scrollHeight = outputRef.current.scrollHeight;
      outputRef.current.style.height = `${scrollHeight}px`;
      setOutputHeight(`${scrollHeight}px`);
    }
  }, [translatedText, loading]);

  // Initialize SpeechRecognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const startSpeechRecognition = () => {
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in your browser.");
      setTimeout(() => setSpeechError(""), 3000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = from === "auto" ? "en-US" : `${from}-${from.toUpperCase()}`; // e.g., "en-US"
    recognition.interimResults = true; // Show interim results
    recognition.continuous = true; // Continue listening until stopped

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setText((prev) => prev + finalTranscript); // Append final transcript
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
      setIsListening(false); // Stop listening when recognition ends
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

  // Speech Synthesis for reading text aloud
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
      setSpeechError(`No voice available for ${lang} on this device. Try installing a ${lang} language pack or using a supported language like Hindi.`);
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
      console.warn("Geolocation not supported");
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
          console.error(`Geolocation error (attempt ${attempt}):`, error.message);
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
          setTimeout(() => setLocationError(""), 2000);
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
        console.error(`Error fetching location (attempt ${4 - retries}):`, error.message);
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
      setTranslatedText(translated);
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
      setLoading(false);
    } catch (error) {
      console.error("Translation error:", error.message);
      setTranslatedText(`Error: ${error.response?.data?.error || error.message}`);
      setLoading(false);
    }
  };

  const swapLanguages = () => {
    setFrom(to);
    setTo(from);
    setText(translatedText);
    setTranslatedText("");
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
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-2xl mt-72 sm:mt-0 shadow-2xl w-full transition-all">
        <h1 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
          <Languages className="text-purple-700" />
          <div className="text-purple-700">PolyglotPro</div>
        </h1>
        {locationError && (
          <div className="text-red-500 text-center mb-4 bg-red-100 p-3 rounded-lg flex justify-between items-center">
            <p>{locationError} {locationError.includes("unavailable") && "This may be due to a weak signal."}</p>
            <div className="flex gap-2">
              <button onClick={() => getUserLanguage()} className="text-blue-700 hover:text-blue-900 underline">Try Again</button>
              <button onClick={() => setLocationError("")} className="text-red-700 hover:text-red-900">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {loginWarning && (
          <div className="text-red-500 text-center mb-4 bg-red-100 p-3 rounded-lg flex justify-between items-center">
            <p>{loginWarning}</p>
            <button onClick={() => setLoginWarning("")} className="text-red-700 hover:text-red-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {speechError && (
          <div className="text-red-500 text-center mb-4 bg-red-100 p-3 rounded-lg flex justify-between items-center">
            <p>{speechError}</p>
            <button onClick={() => setSpeechError("")} className="text-red-700 hover:text-red-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <select value={from} onChange={(e) => setFrom(e.target.value)} className="border p-3 rounded-lg w-full sm:w-1/3 text-gray-700">
            {languages.sort((a, b) => a.name.localeCompare(b.name)).map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          <button onClick={swapLanguages} className="p-3 rounded-full hover:bg-gray-200 transition self-center sm:self-auto">
            <ArrowLeftRight className="text-gray-600" />
          </button>
          <select value={to} onChange={(e) => setTo(e.target.value)} className="border p-3 rounded-lg w-full sm:w-1/3 text-gray-700">
            {languages.sort((a, b) => a.name.localeCompare(b.name)).map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-6 grid grid-cols-1 sm:grid-cols-2">
          {/* Input Textarea (Left) */}
          <div className="relative p-4 border rounded-lg min-h-40">
            <div className="flex justify-between  mb-2">
            <button onClick={toggleMicrophone} className={`text-gray-500 hover:text-gray-700 ${isListening ? "text-red-500" : ""}`}>
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <div className="flex gap-4 ">
                {text && (
                  <button onClick={() => setText("")} className="text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button onClick={toggleSpeakInput} className={`text-gray-500 hover:text-gray-700 ${isSpeakingInput ? "text-blue-500" : ""}`}>
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>
              
            </div>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-32 rounded-lg resize-none focus:outline-none "
              placeholder="Enter text or use the microphone..."
              style={{ height: inputHeight, overflowWrap: "break-word", whiteSpace: "pre-wrap" }}
            />
            <div className="mt-2 text-sm text-gray-500 text-right">
              {charCount}/{maxChars}
            </div>
          </div>
          {/* Translated Text Div (Right) */}
          <div className="relative p-4 border rounded-lg min-h-40 bg-gray-100">
            {/* Top-right icons */}
            <div className="absolute top-4 right-2 flex gap-2 z-10">
              <button onClick={handleCopy} className="text-gray-500 hover:text-black">
                {copied ? (
                  <ClipboardCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <Clipboard className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={toggleSpeakOutput}
                className={`text-gray-500 hover:text-gray-700 ${isSpeakingOutput ? "text-blue-500" : ""}`}
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Output text */}
            <div
              ref={outputRef}
              className="w-full mt-6 text-gray-800"
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
      <div className="mt-12">
        <button
          onClick={handleHistoryClick}
          className="fixed bottom-4 right-4 bg-purple-800 text-white p-3 rounded-full shadow-lg"
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

// History Sidebar
const HistorySidebar = ({ isOpen, setIsOpen, history, setHistory }) => {
  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`${backendURL}/history/all`, { headers: { Authorization: `Bearer ${token}` } });
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await axios.delete(`${backendURL}/history/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error deleting history:", error);
    }
  };

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen]);

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 p-4 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      style={{ maxHeight: "100vh", overflowY: "auto" }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-800">History</h2>
        <button className="text-gray-600" onClick={() => setIsOpen(false)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
        </button>
      </div>
      {history.length === 0 ? (
        <p className="text-gray-500">No history available</p>
      ) : (
        <ul>
          {history.map((item) => (
            <li key={item._id} className="p-2 border-b text-sm text-gray-700 flex justify-between">
              <span>{item.input} ({item.from}) → {item.translation} ({item.to})</span>
              <button onClick={() => deleteHistoryItem(item._id)} className="text-gray-800 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
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
