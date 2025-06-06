import { useState, useEffect, useCallback } from "react";
import { ArrowLeftRight, Settings, Crown, UserCheck } from "lucide-react";
import Tesseract from "tesseract.js";
import { LanguageSelector } from "../components/LanguageSelector";
import { useGeolocation } from "../components/languagebylocation";
import ErrorMessage from "../components/ErrorMessage";
import TextInput from "../components/TextInput";
import TextOutput from "../components/TextOutput";
import HomeSetting from "../components/HomeSetting";
import { useTranslation } from "../components/useTranslation";
import { useSpeech } from "../components/UseSpeech";
import { useTheme } from "../context/ThemeContext";
import SignIn from "./Login";
import SignUp from "./Signup";
import { useNavigate } from "react-router-dom";



const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const languages = [
  { code: "as", name: "Assamese" },
  { code: "bn", name: "Bengali" },
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
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("hi");
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  const [loginWarning, setLoginWarning] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("hi");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState(false);
  const [mammoth, setMammoth] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("User");
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate(); // ✅ Get the navigate function

  const { translatedText, loading: translationLoading, error: translationError, setError: setTranslationError, history, setHistory, translateText } = useTranslation();
  const { isListening, startSpeechRecognition, stopSpeechRecognition, speakText, error: speechError, setError: setSpeechError } = useSpeech(from, (transcript) => setText((prev) => prev + transcript));
  const { getUserLanguage, error: locationError, setError: setLocationError, loading: locationLoading } = useGeolocation(setTo, setDetectedLanguage);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("name") || "User";
    if (token) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUsername("User");
    setLoginWarning("Logged out successfully.");
    setTimeout(() => setLoginWarning(""), 3000);
  }, []);

  useEffect(() => {
    const loadMammoth = async () => {
      try {
        const mammothModule = await import("https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js");
        setMammoth(mammothModule.default);
      } catch (error) {
        console.error("Failed to load mammoth.js:", error);
        setTranslationError("Failed to load document processing library. Please try again later.");
        setTimeout(() => setTranslationError(""), 5000);
      }
    };
    loadMammoth();
  }, [setTranslationError]);

  useEffect(() => {
    const loadPdfJs = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
        setIsPdfJsLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
          setIsPdfJsLoaded(true);
        } else {
          setTranslationError("Failed to load PDF.js library. Please try again later.");
          setTimeout(() => setTranslationError(""), 5000);
        }
      };
      script.onerror = () => {
        setTranslationError("Error loading PDF.js library. Please check your internet connection.");
        setTimeout(() => setTranslationError(""), 5000);
      };
      document.head.appendChild(script);
    };

    loadPdfJs();
  }, [setTranslationError]);

  useEffect(() => {
    getUserLanguage();
  }, [getUserLanguage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.trim()) {
        setIsTranslating(true);
        translateText(text, from, to).finally(() => setIsTranslating(false));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [text, from, to, translateText]);

  const handleSwapLanguages = useCallback(() => {
    setFrom(to);
    setTo(from);
    setText(translatedText);
    if (translatedText) {
      setIsTranslating(true);
      translateText(translatedText, to, from).finally(() => setIsTranslating(false));
    }
  }, [from, to, translatedText, translateText]);

  const handleHistoryClick = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoginWarning("Please log in to view your translation history.");
      setTimeout(() => setLoginWarning(""), 3000);
      return;
    }
    navigate("/history")
    setIsChatOpen(false);
    setIsLiveChatOpen(false);
    setIsSettingsOpen(false);
    setIsHistoryOpen((prev) => !prev);
  }, [navigate]);

  
  const handleChatClick = useCallback(() => {
    navigate("/single-device"); // ✅ Correct way to navigate
    setIsHistoryOpen(false);
    setIsLiveChatOpen(false);
    setIsSettingsOpen(false);
    setIsChatOpen((prev) => !prev);
  }, [navigate]);

  const handleLiveChatClick = useCallback(() => {
    navigate("/conversation")
    setIsHistoryOpen(false);
    setIsChatOpen(false);
    setIsSettingsOpen(false);
    setIsLiveChatOpen((prev) => !prev);
  }, [navigate]);

  const handleSettingsClick = useCallback(() => {
    setIsHistoryOpen(false);
    setIsChatOpen(false);
    setIsLiveChatOpen(false);
    setIsSettingsOpen((prev) => !prev);
  }, []);

  const handleSignInClick = useCallback(() => {
    setIsHistoryOpen(false);
    setIsChatOpen(false);
    setIsLiveChatOpen(false);
    setIsSettingsOpen(false);
    setIsSignInOpen(true);
  }, []);

  const handleSignUpClick = useCallback(() => {
    setIsHistoryOpen(false);
    setIsChatOpen(false);
    setIsLiveChatOpen(false);
    setIsSettingsOpen(false);
    setIsSignUpOpen(true);
  }, []);

  const handleSignInClose = useCallback(() => {
    setIsSignInOpen(false);
  }, []);

  const handleSignUpClose = useCallback(() => {
    setIsSignUpOpen(false);
  }, []);

  const handleDocumentUpload = useCallback(
    async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setTranslationError("");
      setIsUploading(true);

      try {
        let extractedText = "";

        if (file.name.endsWith(".txt")) {
          const reader = new FileReader();
          extractedText = await new Promise((resolve, reject) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error("Error reading the text file."));
            reader.readAsText(file);
          });
        } else if (file.name.endsWith(".pdf")) {
          if (!isPdfJsLoaded || !window.pdfjsLib) {
            throw new Error("PDF.js library is not loaded yet. Please wait a moment and try again.");
          }
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let textContent = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map((item) => item.str).join(" ") + "\n";
          }
          extractedText = textContent;
        } else if (file.name.endsWith(".docx")) {
          if (!mammoth) {
            throw new Error("Document processing library is not loaded yet. Please wait a moment and try again.");
          }
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedText = result.value;
        } else if (file.name.endsWith(".doc")) {
          throw new Error(
            "The .doc format is not supported. Please convert your file to .docx, .pdf, or .txt using a tool like Microsoft Word or an online converter"
          );
        } else if (
          file.name.endsWith(".jpg") ||
          file.name.endsWith(".jpeg") ||
          file.name.endsWith(".png") ||
          file.name.endsWith(".gif") ||
          file.name.endsWith(".bmp")
        ) {
          const { data: { text } } = await Tesseract.recognize(file, "eng+hin", {
            logger: (m) => console.log(m),
          });
          extractedText = text;
        } else {
          throw new Error(
            "Unsupported file format. Please upload a .pdf, .docx, .txt, or image file (.jpg, .jpeg, .png, .gif, .bmp)."
          );
        }

        const cleanedText = extractedText
          .replace(/\n{3,}/g, "\n\n")
          .replace(/[ \t]+/g, " ")
          .trim();

        if (cleanedText) {
          setText(cleanedText);
          await translateText(cleanedText, from, to);
        } else {
          setTranslationError("No readable text found in the document.");
          setTimeout(() => setTranslationError(""), 3000);
        }
      } catch (error) {
        setTranslationError(`Error: ${error.message || "Failed to process document"}`);
        setTimeout(() => setTranslationError(""), 5000);
      } finally {
        setIsUploading(false);
      }
    },
    [mammoth, translateText, setTranslationError, isPdfJsLoaded]
  );

  const handlePhotoUpload = useCallback(
    async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setTranslationError("");
      setIsUploading(true);

      try {
        const { data: { text } } = await Tesseract.recognize(file, "eng+hin", {
          logger: (m) => console.log(m),
        });

        const cleanedText = text
          .replace(/[^\w\s\u0900-\u097F\n]/g, "")
          .replace(/\n{3,}/g, "\n\n")
          .replace(/[ \t]+/g, " ")
          .trim();

        if (cleanedText) {
          setText(cleanedText);
          await translateText(cleanedText, from, to);
        } else {
          setTranslationError("No readable text found in the image.");
          setTimeout(() => setTranslationError(""), 3000);
        }
      } catch (error) {
        setTranslationError(`Error: ${error.message || "Failed to process image"}`);
        setTimeout(() => setTranslationError(""), 5000);
      } finally {
        setIsUploading(false);
      }
    },
    [translateText, setTranslationError]
  );

  return (
    <>
      <style>
        {`
          @media (max-width: 639px) {
            .background-circle {
              transform: scale(0.6);
            }
          }
          @media (min-width: 640px) and (max-width: 1023px) {
            .background-circle {
              transform: scale(0.8);
            }
          }
          body.no-scroll {
            overflow: hidden;
          }
        `}
      </style>
      <div className="min-h-screen pt-4 transition-all duration-700 relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50/80 to-indigo-50/70 dark:from-gray-900 dark:via-purple-900/80 dark:to-indigo-900/70">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl animate-pulse bg-purple-300/30 dark:bg-purple-900/30 background-circle"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] rounded-full blur-3xl animate-pulse delay-1000 bg-blue-300/40 dark:bg-blue-900/40 background-circle"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl animate-pulse delay-500 bg-indigo-100/30 dark:bg-indigo-900/30"></div>
          <div className="absolute top-10 right-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse delay-700 bg-pink-100/25 dark:bg-pink-900/25"></div>
          <div className="absolute bottom-40 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse delay-300 bg-cyan-100/40 dark:bg-cyan-900/40 background-circle"></div>
        </div>
        <header className="relative z-10 pb-4">
          <div className="max-w-7xl mx-auto md:flex rounded-xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between pr-4 sm:gap-3">
              <div className="flex gap-2">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-2 sm:p-2.5 lg:p-3 shadow-lg border-purple-300/50 dark:border-gray-700/50">
                  <div className="text-white text-lg sm:text-xl lg:text-xl font-bold">🌐</div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-indigo-400 flex items-center gap-2">
                    PolyglotPro <span className="text-yellow-900 dark:text-yellow-300 animate-pulse">✨</span>
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-sm font-medium text-gray-600 dark:text-gray-300">Smart translation with AI power</p>
                </div>
              </div>
              <button
                onClick={handleSettingsClick}
                className="inline-flex md:hidden items-center justify-center h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 transition-all duration-300 hover:scale-110 bg-white/80 dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:text-purple-700 dark:hover:text-purple-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
              <button
                onClick={toggleTheme}
                className="hidden sm:inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full transition-all duration-300 hover:scale-110 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-800/30 dark:hover:bg-gray-700/30"
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon h-5 w-5" data-lov-id="src/components/ThemeToggle.tsx:26:8" data-lov-name="Moon" data-component-path="src/components/ThemeToggle.tsx" data-component-line="26" data-component-file="ThemeToggle.tsx" data-component-name="Moon" data-component-content="%7B%22className%22%3A%22h-5%20w-5%22%7D">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-4 w-4 sm:h-5 sm:w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={handleSettingsClick}
                className={`hidden md:inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full transition-all duration-300 hover:scale-110 ${
                  isSettingsOpen ? "bg-purple-100/60 dark:bg-purple-900/60 border-purple-300/40 dark:border-purple-700/40" : "bg-white/80 dark:bg-gray-800/80"
                } text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-400`}
                aria-label={isSettingsOpen ? "Close settings" : "Open settings"}
              >
                <Settings className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                {isAuthenticated ? (
                  <div className="flex items-center gap-4">
                    <div className="relative flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 backdrop-blur-xl shadow-xl bg-gradient-to-r from-amber-100/90 via-yellow-50/95 to-orange-100/90 dark:from-amber-900/90 dark:via-yellow-800/95 dark:to-orange-900/90 border-amber-300/60 dark:border-amber-700/60 shadow-amber-200/30 dark:shadow-amber-900/30">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 dark:from-yellow-800/10 dark:to-orange-800/10 rounded-2xl"></div>
                      <Crown className="h-5 w-5 text-yellow-500 dark:text-yellow-300 drop-shadow-lg relative z-10" />
                      <span className="text-sm font-bold relative z-10 text-yellow-700 dark:text-yellow-200">Premium Member</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/60 text-gray-700 dark:text-gray-200">
                        <UserCheck className="h-4 w-4 text-green-500 dark:text-green-300" />
                        <span className="text-sm font-medium">{username}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 hover:scale-105 rounded-xl px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 border hover:border-red-300/50 dark:hover:border-red-700/50"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleSignInClick}
                      className="hidden md:inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm h-12 sm:h-10 rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 border-2 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-50/80 dark:hover:bg-purple-900/80 border-purple-200/50 dark:border-gray-700/50 hover:border-purple-300/70 dark:hover:border-purple-600/70 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="blue"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2"
                      >
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                        <polyline points="10 17 15 12 10 7"></polyline>
                        <line x1="15" x2="3" y1="12" y2="12"></line>
                      </svg>
                      Sign In
                    </button>
                    <button
                      onClick={handleSignUpClick}
                      className="hidden md:inline-flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm font-bold h-12 sm:h-10 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 dark:from-purple-500 dark:via-indigo-500 dark:to-blue-500 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-purple-400/30 dark:border-purple-600/30"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <line x1="19" x2="19" y1="8" y2="14"></line>
                        <line x1="22" x2="16" y1="11" y2="11"></line>
                      </svg>
                      Join Premium Free
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="relative z-10 px-4 sm:px-5 lg:px-6 lg:pb-8">
          <div className="max-w-8xl mx-auto space-y-6 sm:space-y-8 lg:space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 backdrop-blur-md rounded-2xl sm:rounded-xl border shadow-lg bg-white/40 dark:bg-gray-800/40 border-white/50 dark:border-gray-700/50">
                <div className="flex items-center gap-1 sm:gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600 dark:text-purple-300"
                  >
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">Auto-detect location:</span>
                </div>
                {locationLoading ? (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <svg
                      className="h-4 w-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 animate-spin text-purple-600 dark:text-purple-300"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">Detecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="green"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4"
                    >
                      <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                      <path d="m9 11 l3 3L22 4"></path>
                    </svg>
                    <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                      {detectedLanguage === "hi"
                        ? "🇮🇳 India - Hindi"
                        : `English -> ${languages.find((lang) => lang.code === detectedLanguage)?.name || "Unknown"}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full max-w-7xl mx-auto backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 shadow-2xl p-3 sm:p-5 lg:p-6 bg-gradient-to-br from-white/80 via-purple-50/80 to-blue-50/80 dark:from-gray-800/80 dark:via-gray-900/80 dark:to-gray-800/80 border-purple-200/60 dark:border-gray-700/60">
              <div className="mb-3 sm:mb-4 lg:mb-6 text-center">
                <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 lg:px-6 py-2 sm:p-3 lg:py-3 rounded-full text-xs sm:text-sm font-bold border-2 shadow-lg bg-gradient-to-r from-purple-100/80 to-blue-100/80 dark:from-purple-900/80 dark:to-blue-900/80 text-purple-700 dark:text-purple-200 border-purple-300/70 dark:border-purple-600/70">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5 text-yellow-400 dark:text-yellow-300"
                  >
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                    <path d="M20 3v4"></path>
                    <path d="M22 5h-4"></path>
                    <path d="M4 17v2"></path>
                    <path d="M5 18H3"></path>
                  </svg>
                  Smart Translation Engine
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5 text-blue-400 dark:text-blue-300"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                    <path d="M2 12h20"></path>
                  </svg>
                </div>
              </div>
              <div className="flex mb-4 flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                <div className="w-full sm:w-full lg:w-auto flex-1">
                  <LanguageSelector
                    selectedLang={from}
                    onSelect={setFrom}
                    isOpen={isFromOpen}
                    setIsOpen={setIsFromOpen}
                    search={searchFrom}
                    setSearch={setSearchFrom}
                  />
                </div>
                <button
                  onClick={handleSwapLanguages}
                  className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 mx-2 sm:mx-4 lg:mx-6 rounded-full transition-all duration-500 hover:scale-110 hover:rotate-180 shadow-lg border-2 bg-gradient-to-r from-purple-200/90 to-blue-200/90 dark:from-purple-800/90 dark:to-blue-800/90 hover:from-purple-300 dark:hover:from-purple-700 hover:to-blue-300 dark:hover:to-blue-700 border-purple-300/70 dark:border-purple-600/70 text-purple-700 dark:text-purple-200 inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3 sm:[&_svg]:size-4 lg:[&_svg]:size-4 hover:bg-accent hover:text-accent-foreground"
                  aria-label="Swap languages"
                >
                  <ArrowLeftRight className="h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6" />
                </button>
                <div className="w-full sm:w-full lg:w-auto flex-1">
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
              <ErrorMessage error={locationError} onClose={() => setLocationError("")} onRetry={getUserLanguage} />
              <ErrorMessage error={loginWarning} onClose={() => setLoginWarning("")} />
              <ErrorMessage
                error={translationError || speechError}
                onClose={() => {
                  setTranslationError("");
                  setSpeechError("");
                }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm lg:text-sm font-bold text-purple-700 dark:text-purple-200">From</span>
                      <span className="text-xs sm:text-sm lg:text-sm font-medium text-gray-700 dark:text-gray-200">
                        {languages.find((lang) => lang.code === from)?.name || "Unknown"}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 text-purple-600 dark:text-purple-300"
                      >
                        <path d="m5 8 6 6"></path>
                        <path d="m4 14 l6-6 2-3"></path>
                        <path d="M2 5h12"></path>
                        <path d="M7 2h1"></path>
                        <path d="m22 22-5-10-5 10"></path>
                        <path d="M14 18h6"></path>
                      </svg>
                    </div>
                  </div>
                  <TextInput
                    value={text}
                    onChange={setText}
                    onMicrophoneToggle={() => (isListening ? stopSpeechRecognition() : startSpeechRecognition())}
                    isListening={isListening}
                    onSpeak={() => speakText(text, from === "auto" ? "en" : from)}
                    onDocumentUpload={handleDocumentUpload}
                    onPhotoUpload={handlePhotoUpload}
                    isUploading={isUploading}
                  />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm lg:text-sm font-bold text-purple-700 dark:text-purple-200">To</span>
                      <span className="text-xs sm:text-sm lg:text-sm font-medium text-gray-700 dark:text-gray-200">
                        {languages.find((lang) => lang.code === to)?.name || "Unknown"}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 text-purple-600 dark:text-purple-300"
                      >
                        <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
                        <path d="m14 7 l2 3"></path>
                        <path d="M5 6v4"></path>
                        <path d="M19 14v4"></path>
                        <path d="M10 2v2"></path>
                        <path d="M7 8H3"></path>
                        <path d="M21 16h-4"></path>
                        <path d="M11 3H9"></path>
                      </svg>
                    </div>
                  </div>
                  <TextOutput
                    text={translatedText}
                    loading={translationLoading || isTranslating}
                    onCopy={() => navigator.clipboard.writeText(translatedText)}
                    onSpeak={() => speakText(translatedText, to)}
                  />
                </div>
              </div>
              <div className="mt-2 sm:mt-5 lg:mt-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 lg:gap-0">
                <div className="text-xs flex items-center gap-2 sm:gap-4 text-gray-500 dark:text-gray-400">
                  <span>{text.length}/15000 characters</span>
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-300 text-center sm:text-right">
                  ✨ Smart Engine • Advanced OCR • Context Analysis • Cultural Adaptation • Multi-variant Output
                </div>
              </div>
            </div>
            
          </div>
        </main>
        <div className="fixed bottom-4 sm:bottom-5 lg:bottom-6 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-3.5 lg:p-4 rounded-lg sm:rounded-2xl backdrop-blur-md border-2 shadow-lg items-center bg-white/90 dark:bg-gray-800/90 border-gray-200/60 dark:border-gray-700/60 lg:border-purple-200/60 dark:lg:border-purple-600/60">
            <button className="inline-flex items-center justify-center rounded-lg sm:rounded-2xl transition-all duration-500 hover:scale-125 w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-purple-500 dark:to-indigo-500 text-white shadow-lg border-2 border-purple-400/50 dark:border-purple-600/50" 
            aria-label="Home page">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
            </svg>

            </button>
            <button
              onClick={handleChatClick}
              className="inline-flex items-center justify-center rounded-lg sm:rounded-2xl transition-all duration-500 hover:scale-125 w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-100/60 dark:hover:bg-purple-900/60 border-2 border-gray-300/40 dark:border-gray-600/40 lg:border-purple-300/40 dark:lg:border-purple-600/40"
              aria-label={isChatOpen ? "Close chat" : "Open chat"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 sm:h-5.5 sm:w-5.5 lg:h-6 lg:w-6"
              >
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
              </svg>
            </button>
            <button
              onClick={handleLiveChatClick}
              className="inline-flex items-center justify-center rounded-lg sm:rounded-2xl transition-all duration-500 hover:scale-125 w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-100/60 dark:hover:bg-purple-900/60 border-2 border-gray-300/40 dark:border-gray-600/40 lg:border-purple-300/40 dark:lg:border-purple-600/40"
              aria-label={isLiveChatOpen ? "Close live chat" : "Open live chat"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-purple-500">
              <path d="m4 6 3-3 3 3"></path>
              <path d="M7 17V3"></path>
              <path d="m14 6 3-3 3 3"></path>
              <path d="M17 17V3"></path>
              <path d="M4 21h16"></path>
              </svg>
            </button>
            <button
              onClick={handleHistoryClick}
              className="inline-flex items-center justify-center rounded-lg sm:rounded-2xl transition-all duration-500 hover:scale-125 w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-100/60 dark:hover:bg-purple-900/60 border-2 border-gray-300/40 dark:border-gray-600/40 lg:border-purple-300/40 dark:lg:border-purple-600/40"
              aria-label={isHistoryOpen ? "Close history" : "View history"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 sm:h-5.5 sm:w-5.5 lg:h-6 lg:w-6"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
                <path d="M12 7v5l4"></path>
              </svg>
            </button>
          </div>
        </div>
        <footer className="relative z-10 text-center py-4 sm:p-6 lg:p-8 py-3">
          <div className="inline-flex flex-wrap items-center justify-center gap-1 sm:gap-3 px-2 sm:px-3 lg:px-8 py-3 sm:p-4 lg:py-4 rounded-lg sm:rounded-full backdrop-blur-md border-2 bg-white/40 dark:bg-gray-800/40 border-purple-200/50 dark:border-gray-700/50 shadow-lg text-purple-600 dark:text-purple-300">
            <span className="text-lg sm:text-xl lg:text-2xl">✨</span>
            <span className="text-xs sm:text-sm font-semibold sm:text-sm lg:text-sm font-bold">
              Advanced AI Translation • File Upload • Real-time OCR • Voice Recognition
            </span>
            <span className="text-lg sm:text-xl sm:text-2xl">🚀</span>
            <span className="text-lg sm:text-xl sm:text-2xl">🚖</span>
          </div>
        </footer>
        <HomeSetting isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        {isSignInOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/800 dark:bg-black/70 backdrop-blur-sm"
            onClick={handleSignInClose}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <SignIn onClose={handleSignInClose} />
            </div>
          </div>
        )}
        {isSignUpOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={handleSignUpClose}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <SignUp onClose={handleSignUpClose} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Translator;