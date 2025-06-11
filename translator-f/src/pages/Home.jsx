
import { useState, useEffect, useCallback } from "react";
import { ArrowLeftRight } from "lucide-react";
import Tesseract from "tesseract.js";
import { LanguageSelector } from "../components/LanguageSelector";
import { useGeolocation } from "../components/languagebylocation";
import ErrorMessage from "../components/ErrorMessage";
import TextInput from "../components/TextInput";
import TextOutput from "../components/TextOutput";
import { useTranslation } from "../components/useTranslation";
import { useSpeech } from "../components/UseSpeech";
import Header from "../components/Header";



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
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState(false);
  const [mammoth, setMammoth] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  

  const { translatedText, loading: translationLoading, error: translationError, setError: setTranslationError, translateText } = useTranslation();
  const { isListening, startSpeechRecognition, stopSpeechRecognition, speakText, error: speechError, setError: setSpeechError } = useSpeech(from, (transcript) => setText((prev) => prev + transcript));
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
          setTimeout(() => setTranslationError(""), 201);
        }
      };
      script.onerror = () => {
        setTranslationError("Error loading PDF.js library. Please check your internet connection.");
        setTimeout(() => setTranslationError(""), 201);
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
      } else {
        console.error("Text is empty, triggering translateText('')");
        setIsTranslating(true);
        translateText("", from, to).finally(() => setIsTranslating(false));
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
          throw new Error("PDF.js library is not installed yet. Please wait a moment and try again.");
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
          throw new Error("Document processing library is not installed yet. Please try again in a moment.");
        }

        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (file.name.endsWith(".doc")) {
        throw new Error(
          "The .doc format is not supported. Please convert your file to .docx, .pdf, or .txt using a tool like Microsoft Word or an online converter."
        );
      } else if (
        file.name.endsWith(".jpg") ||
        file.name.endsWith(".jpeg") ||
        file.name.endsWith(".png") ||
        file.name.endsWith(".gif") ||
        file.name.endsWith(".bmp")
      ) {
        const {
          data: { text },
        } = await Tesseract.recognize(file, "eng+hin", {
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
        setTimeout(() => setTranslationError(""), 3010);
      }
    } catch (error) {
      setTranslationError(`Error: ${error.message || "Failed to process document"}`);
      setTimeout(() => setTranslationError(""), 5010);
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
              setTimeout(() => setTranslationError(""), 3010);
            }
          } catch (error) {
            setTranslationError(`Error: ${error.message || "Failed to process image"}`);
            setTimeout(() => setTranslationError(""), 5010);
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
          
          <div className="min-h-screen pb-24 transition-all duration-700 relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50/80 to-indigo-50/70 dark:from-gray-900 dark:via-purple-900/80 dark:to-indigo-900/70">
            <div className="absolute inset-0">
              <div className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl animate-pulse bg-purple-300/30 dark:bg-purple-900/30 background-circle"></div>
              <div className="absolute bottom-20 right-10 w-[500px] h-[500px] rounded-full blur-3xl animate-pulse delay-1000 bg-blue-300/40 dark:bg-blue-900/40 background-circle"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl animate-pulse delay-500 bg-indigo-100/30 dark:bg-indigo-900/30"></div>
              <div className="absolute top-10 right-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse delay-700 bg-pink-100/25 dark:bg-pink-900/25"></div>
              <div className="absolute bottom-40 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse delay-300 bg-cyan-100/40 dark:bg-cyan-900/40 background-circle"></div>
            </div>
            <Header/>
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
                    <div className="lg:w-auto flex-1">
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
                    <div className="lg:w-auto flex-1">
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
                    <div className="text-xs p-1 md:hidden flex items-center gap-2 sm:gap-4 text-gray-500 dark:text-gray-400">
                      <span>{text.length}/5000 characters</span>
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
                            <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 0 0 0 0 1.72l1.28 1.28 a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
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
                    <div className="text-xs hidden md:inline-flex flex items-center gap-2 sm:gap-4 text-gray-500 dark:text-gray-400">
                      <span>{text.length}/5000 characters</span>
                    </div>
                    <div className="text-xs pt-3 md:pt-1 text-purple-600 dark:text-purple-300 text-center sm:text-right">
                      ✨ Smart Engine • Advanced OCR • Context Analysis • Cultural Adaptation • Multi-variant Output
                    </div>
                  </div>
                </div>
              </div>
            </main>
            <footer className="relative z-10 text-center py-4 sm:p-6 lg:p-8 py-3">
              <div className="inline-flex flex-wrap items-center justify-center gap-1 sm:gap-3 px-2 sm:px-3 lg:px-8 py-3 sm:p-4 lg:py-4 rounded-lg sm:rounded-full backdrop-blur-md border-2 bg-white/40 dark:bg-gray-800/40 border-purple-200/50 dark:border-gray-700/50 shadow-lg text-purple-600 dark:text-purple-300">
                <span className="text-lg sm:text-xl lg:text-2xl">✨</span>
                <span className="text-xs sm:text-sm font-semibold sm:text-sm lg:text-sm font-bold">
                  Advanced AI Translation • File Upload • Real-time OCR • Voice Recognition
                </span>
                <span className="text-lg sm:text-xl sm:text-2xl">🚀</span>
              </div>
            </footer>
            <ErrorMessage
              error={locationError || loginWarning || translationError || speechError}
              onClose={() => {
                setLocationError("");
                setLoginWarning("");
                setTranslationError("");
                setSpeechError("");
              }}
              onRetry={locationError ? getUserLanguage : null}
            />
          </div>
        </>
      );
    };

    export default Translator;
