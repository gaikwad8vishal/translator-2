
import { useState, useEffect, useCallback } from "react";
import { ArrowLeftRight, Languages, MessageSquare, Users, X } from "lucide-react";
import Tesseract from "tesseract.js";
import { LanguageSelector } from "../components/LanguageSelector";
import { useGeolocation } from "../components/languagebylocation";
import LiveChatSidebar from "../components/LiveChatbar";
import ErrorMessage from "../components/ErrorMessage";
import TextInput from "../components/TextInput";
import TextOutput from "../components/TextOutput";
import HistorySidebar from "../components/HistorySidebar";
import ChatSidebar from "../components/ChatSidebar";
import { useTranslation } from "../components/useTranslation";
import { useSpeech } from "../components/UseSpeech";

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
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState(false);
  const [mammoth, setMammoth] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const { translatedText, loading: translationLoading, error: translationError, setError: setTranslationError, history, setHistory, translateText } = useTranslation();
  const { isListening, startSpeechRecognition, stopSpeechRecognition, speakText, error: speechError, setError: setSpeechError, isSpeaking } = useSpeech(from, (transcript) => setText((prev) => prev + transcript));
  const { getUserLanguage, error: locationError, setError: setLocationError, loading: locationLoading } = useGeolocation(setTo, setDetectedLanguage);

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
    setIsChatOpen(false);
    setIsLiveChatOpen(false);
    setIsHistoryOpen((prev) => !prev);
  }, []);

  const handleChatClick = useCallback(() => {
    setIsHistoryOpen(false);
    setIsLiveChatOpen(false);
    setIsChatOpen((prev) => !prev);
  }, []);

  const handleLiveChatClick = useCallback(() => {
    setIsHistoryOpen(false);
    setIsChatOpen(false);
    setIsLiveChatOpen((prev) => !prev);
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
            const page = await pdf.getPage(i); // Fixed: Changed document.getPage to pdf.getPage
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
    <div className="min-h-screen transition-all duration-700 relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50/80 to-indigo-50/70">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl animate-pulse bg-purple-300/30"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] rounded-full blur-3xl animate-pulse delay-1000 bg-blue-300/30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl animate-pulse delay-500 bg-indigo-300/30"></div>
        <div className="absolute top-10 right-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse delay-700 bg-pink-300/25"></div>
        <div className="absolute bottom-40 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse delay-300 bg-cyan-300/25"></div>
      </div>
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-3 border shadow-lg border-purple-300/50">
              <div className="text-white text-xl font-bold">🌐</div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                PolyglotPro <span className="text-yellow-400 animate-pulse">✨</span>
              </h1>
              <p className="text-sm text-gray-600">Smart translation with AI power</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium h-10 rounded-xl px-6 py-2.5 border-2 backdrop-blur-sm text-gray-700 hover:text-purple-700 hover:bg-purple-50/80 border-purple-200/50 hover:border-purple-300/70 shadow-md hover:shadow-purple-200/30 transition-all duration-300 hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Portfolio
            </button>
            <button className="inline-flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 hover:scale-110 bg-gray-800/20 hover:bg-gray-800/30 text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
              </svg>
            </button>
            <button className="inline-flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 hover:scale-110 border-2 shadow-lg bg-white/80 hover:bg-white/90 border-purple-300/60 text-purple-600 hover:text-purple-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm h-10 rounded-xl px-6 py-2.5 border-2 backdrop-blur-sm text-gray-700 hover:text-purple-700 hover:bg-purple-50/80 border-purple-200/50 hover:border-purple-300/70 shadow-md hover:shadow-purple-200/30 transition-all duration-300 hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" x2="3" y1="12" y2="12"></line>
                </svg>
                Sign In
              </button>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm h-10 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-purple-400/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" x2="19" y1="8" y2="14"></line>
                  <line x1="22" x2="16" y1="11" y2="11"></line>
                </svg>
                Join Premium Free
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="relative z-10 px-6 pb-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-center">
            <div className="flex items-center gap-4 p-4 backdrop-blur-sm rounded-xl border animate-fade-in shadow-lg bg-white/40 border-white/50">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-purple-600">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span className="text-sm font-medium text-gray-800">Auto-detect location:</span>
              </div>
              {locationLoading ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800 animate-pulse flex items-center gap-2"> 
                    <svg className="h-5 w-5 animate-spin text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    detecting...
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-400">
                    <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                    <path d="m9 11 3 3L22 4"></path>
                  </svg>
                  <span className="text-sm text-gray-800">
                    {detectedLanguage === "hi" ? "🇮🇳 India - Hindi" : `Detected Language: ${languages.find(lang => lang.code === detectedLanguage)?.name || "Unknown"}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="w-full max-w-7xl mx-auto backdrop-blur-xl rounded-3xl border-2 shadow-2xl p-6 animate-fade-in bg-gradient-to-br from-white/80 via-purple-50/90 to-blue-50/80 border-purple-200/60">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-bold border-2 shadow-lg bg-gradient-to-r from-purple-100/80 to-blue-100/80 text-purple-700 border-purple-300/70">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-yellow-400">
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                  <path d="M20 3v4"></path>
                  <path d="M22 5h-4"></path>
                  <path d="M4 17v2"></path>
                  <path d="M5 18H3"></path>
                </svg>
                Smart Translation Engine
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-blue-400">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                  <path d="M2 12h20"></path>
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex">
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
                className="h-10 w-10 mx-6 rounded-full transition-all duration-500 hover:scale-110 hover:rotate-180 shadow-xl border-2 bg-gradient-to-r from-purple-200/90 to-blue-200/90 hover:from-purple-300 hover:to-blue-300 border-purple-300/70 text-purple-700 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground "
                aria-label="Swap languages"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
              </button>
              <div className="flex">
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
            <ErrorMessage error={translationError || speechError} onClose={() => { setTranslationError(""); setSpeechError(""); }} />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-purple-700">From</span>
                    <span className="text-sm font-medium text-gray-700">{languages.find(lang => lang.code === from)?.name || "Unknown"}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-purple-600">
                      <path d="m5 8 6 6"></path>
                      <path d="m4 14 6-6 2-3"></path>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-purple-700">To</span>
                    <span className="text-sm font-medium text-gray-700">{languages.find(lang => lang.code === to)?.name || "Unknown"}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-purple-600">
                      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
                      <path d="m14 7 3 3"></path>
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
                  onCopy={() => {}}
                  onSpeak={() => speakText(translatedText, to)}
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs flex items-center gap-4 text-gray-500">
                <span>{text.length}/15000 characters</span>
              </div>
              <div className="text-xs text-purple-600">
                ✨ Smart Engine • Advanced OCR • Context Analysis • Cultural Adaptation • Multi-variant Output
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl rounded-3xl border-2 p-8 animate-fade-in shadow-2xl bg-gradient-to-r from-white/60 via-purple-50/70 to-blue-50/60 border-purple-200/50">
            <h3 className="font-bold mb-6 flex items-center gap-3 text-xl text-gray-800">
              <span className="text-2xl">⭐</span>
              Quick Access Languages
              <span className="text-purple-400 text-sm">(Premium Feature)</span>
            </h3>
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all duration-500 hover:scale-110 hover:shadow-xl transform-gpu bg-white/60 hover:bg-white/80 border-white/40 text-gray-800">
                <span className="text-2xl">🇺🇸</span>
                <span className="font-bold text-lg">English</span>
              </button>
              <button className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all duration-500 hover:scale-110 hover:shadow-xl transform-gpu bg-gradient-to-r from-purple-200/80 to-blue-200/80 border-purple-400/60 text-purple-700 shadow-lg">
                <span className="text-2xl">🇪🇸</span>
                <span className="font-bold text-lg">Spanish</span>
              </button>
              <button className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all duration-500 hover:scale-110 hover:shadow-xl transform-gpu bg-white/60 hover:bg-white/80 border-white/40 text-gray-800">
                <span className="text-2xl">🇫🇷</span>
                <span className="font-bold text-lg">French</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex items-center gap-4 p-4 rounded-2xl backdrop-blur-xl border-2 shadow-2xl bg-white/90 border-purple-200/60">
          <button
            onClick={handleChatClick}
            className="inline-flex items-center justify-center rounded-2xl transition-all duration-500 hover:scale-125 w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl border-2 border-purple-400/50"
            aria-label={isChatOpen ? "Close chat" : "Open chat"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
            </svg>
          </button>
          <button
            onClick={handleLiveChatClick}
            className="inline-flex items-center justify-center rounded-2xl transition-all duration-500 hover:scale-125 w-14 h-14 text-purple-600 hover:text-purple-700 hover:bg-purple-100/60 border-2 border-purple-300/40"
            aria-label={isLiveChatOpen ? "Close live chat" : "Open live chat"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </button>
          <button
            onClick={handleHistoryClick}
            className="inline-flex items-center justify-center rounded-2xl transition-all duration-500 hover:scale-125 w-14 h-14 text-purple-600 hover:text-purple-700 hover:bg-purple-100/60 border-2 border-purple-300/40"
            aria-label={isHistoryOpen ? "Close history" : "View history"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
              <path d="M12 7v5l4 2"></path>
            </svg>
          </button>
        </div>
      </div>
      <footer className="relative z-10 text-center py-8">
        <div className="inline-flex items-center items-center gap-1 px-3 gap-3 py-4 px-8 rounded rounded-full py-2 backdrop-blur-2xl backdrop-blur-xl border-1 border-2 bg-white/30 bg-white/40 border-purple-100 border-purple-200/50 border-b-2 text-purple-500 text-purple-600">
          <span className="text-2xl">✨</span>
          <span className="text-sm font-bold">Advanced AI Translation • File Upload • Real-time OCR • Voice Recognition</span>
            <span class="text-2xl">🚀</span>
          <span className="text-2xl">🚖</span>
        </div>
      </footer>
      <HistorySidebar
        isOpen={isHistoryOpen}
        setIsOpen={setIsHistoryOpen}
        setIsOpen={setIsHistoryOpen}
        history={history}
        setHistory={setHistory}
        setHistory={setHistory}
      />
      <ChatSidebar
          isOpen={isChatOpen}
          setIsOpen={setIsChatOpen}
          isChatOpen
            setIsChatOpen
      />
      <LiveChatSidebar
            isOpen={isLiveChatOpen}
            setIsOpen={setIsLiveChatOpen}
            from={from}
            to={to}
      />
    </div>
  );
};

export default Translator;
