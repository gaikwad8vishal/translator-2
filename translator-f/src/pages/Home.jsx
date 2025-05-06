import { useState, useEffect, useCallback } from "react";
import { ArrowLeftRight, Languages, MessageSquare, Users, X } from "lucide-react";
import { FaHistory } from "react-icons/fa";
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

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

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
  const [isUploading, setIsUploading] = useState(false); // For photo/document uploads
  const [isTranslating, setIsTranslating] = useState(false); // For text translation

  const { translatedText, loading: translationLoading, error: translationError, setError: setTranslationError, history, setHistory, translateText } = useTranslation();

  const { isListening, startSpeechRecognition, stopSpeechRecognition, speakText, error: speechError, setError: setSpeechError, isSpeaking } = useSpeech(from, (transcript) => setText((prev) => prev + transcript));

  const { getUserLanguage, error: locationError, setError: setLocationError } = useGeolocation(setTo, setDetectedLanguage);

  // Load mammoth.js dynamically
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

  // Load pdf.js dynamically
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
        setIsTranslating(true); // Start translation loading
        translateText(text, from, to).finally(() => setIsTranslating(false)); // Stop translation loading
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
      setIsUploading(true); // Start upload loading
  
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
            "The .doc format is not supported. Please convert your file to .docx, .pdf, or .txt using a tool like Microsoft Word or an online converter."
          );
        } else if (
          file.name.endsWith(".jpg") ||
          file.name.endsWith(".jpeg") ||
          file.name.endsWith(".png") ||
          file.name.endsWith(".gif") ||
          file.name.endsWith(".bmp")
        ) {
          // Handle image files using Tesseract.js
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
        setIsUploading(false); // Stop upload loading
      }
    },
    [mammoth, translateText, setTranslationError, isPdfJsLoaded]
  );

  const handlePhotoUpload = useCallback(
    async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setTranslationError("");
      setIsUploading(true); // Start upload loading

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
        setIsUploading(false); // Stop upload loading
      }
    },
    [translateText, setTranslationError]
  );

  return (
    <div className="flex flex-col md:mt-4 mb-12 justify-center p-4">
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
            onDocumentUpload={handleDocumentUpload}
            onPhotoUpload={handlePhotoUpload}
            isUploading={isUploading} // Updated to use isUploading
          />
          <TextOutput
            text={translatedText}
            loading={translationLoading || isTranslating} // Use isTranslating for TextOutput
            onCopy={() => {}}
            onSpeak={() => speakText(translatedText, to)}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-slate-100 shadow-lg flex justify-around items-center py-3 md:flex md:gap-4 md:bottom-4 md:justify-center  md:bg-transparent md:shadow-none" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <button
          onClick={handleChatClick}
          className="p-3 rounded-full bg-transparent text-gray-600 md:shadow-lg"
          aria-label={isChatOpen ? "Close chat" : "Open chat"}
        >
          {isChatOpen ? <X size={24} className="md:size-6" /> : <MessageSquare size={24} className="md:size-6" />}
        </button>
        <button
          onClick={handleLiveChatClick}
          className="p-3 rounded-full bg-transparent text-gray-600 md:shadow-lg"
          aria-label={isLiveChatOpen ? "Close live chat" : "Open live chat"}
        >
          {isLiveChatOpen ? <X size={24} className="md:size-6" /> : <Users size={24} className="md:size-6" />}
        </button>
        <button
          onClick={handleHistoryClick}
          className="p-3 rounded-full bg-transparent text-gray-600 md:shadow-lg"
          aria-label={isHistoryOpen ? "Close history" : "View history"}
        >
          {isHistoryOpen ? <X size={24} className="md:size-6" /> : <FaHistory size={24} className="md:size-6" />}
        </button>
      </div>
      <HistorySidebar
        isOpen={isHistoryOpen}
        setIsOpen={setIsHistoryOpen}
        history={history}
        setHistory={setHistory}
      />
      <ChatSidebar
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
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