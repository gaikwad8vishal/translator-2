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
import { useSpeech } from "../components/useSpeech";



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
  const [isOpenCvLoaded, setIsOpenCvLoaded] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [openCvError, setOpenCvError] = useState("");
  const [mammoth, setMammoth] = useState(null);

  const { translatedText, loading, error: translationError, setError: setTranslationError, history, setHistory, translateText } = useTranslation();

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

  // Load OpenCV.js dynamically with retry logic
  useEffect(() => {
    const loadOpenCv = async (retries = 3, delay = 2000) => {
      if (window.cv && window.cv.getBuildInformation) {
        console.log("OpenCV.js already loaded");
        setIsOpenCvLoaded(true);
        return;
      }

      const tryLoad = async (attempt) => {
        console.log(`Attempting to load OpenCV.js (Attempt ${attempt}/${retries})`);
        return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/opencv.js@1.0.0/opencv.js";
          script.async = true;
          script.onload = () => {
            const checkInitialized = (checkAttempts = 10, checkDelay = 500) => {
              if (window.cv && window.cv.getBuildInformation) {
                console.log("OpenCV.js loaded and initialized successfully");
                setIsOpenCvLoaded(true);
                resolve();
              } else if (checkAttempts > 0) {
                setTimeout(() => checkInitialized(checkAttempts - 1, checkDelay), checkDelay);
              } else {
                console.error("OpenCV.js loaded but failed to initialize");
                reject(new Error("OpenCV.js failed to initialize"));
              }
            };
            checkInitialized();
          };
          script.onerror = () => {
            console.error(`Failed to load OpenCV.js script on attempt ${attempt}`);
            reject(new Error("Failed to load OpenCV.js script"));
          };
          document.head.appendChild(script);
        });
      };

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          await tryLoad(attempt);
          break;
        } catch (error) {
          if (attempt === retries) {
            console.error("All attempts to load OpenCV.js failed");
            setOpenCvError("Failed to load OpenCV.js. Please check your internet connection or try again later.");
            setTimeout(() => setOpenCvError(""), 10000);
          } else {
            console.log(`Retrying OpenCV.js load after ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    };

    loadOpenCv();

    return () => {
      const scripts = document.querySelectorAll('script[src*="opencv.js"]');
      scripts.forEach((script) => script.remove());
    };
  }, []);

  useEffect(() => {
    getUserLanguage();
  }, [getUserLanguage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.trim()) translateText(text, from, to);
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

  const processDocumentImage = useCallback((file, callback) => {
    console.log("Starting document image processing");
    if (!window.cv) {
      console.error("OpenCV.js not loaded");
      callback(new Error("OpenCV.js is not loaded yet."), null, null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      console.log("Image file read successfully");
      const img = new Image();
      img.src = e.target.result;
      setOriginalImage(img.src);
      img.onload = () => {
        console.log("Image loaded, starting OpenCV processing");
        let mat, gray, edges, contours, hierarchy, approx, warped, enhanced, srcPoints, dstPoints, M;
        try {
          mat = window.cv.imread(img);
          console.log("Image converted to OpenCV Mat");

          const maxSize = 1000;
          if (mat.cols > maxSize || mat.rows > maxSize) {
            const scale = Math.min(maxSize / mat.cols, maxSize / mat.rows);
            const resized = new window.cv.Mat();
            window.cv.resize(mat, resized, { width: Math.round(mat.cols * scale), height: Math.round(mat.rows * scale) });
            mat.delete();
            mat = resized;
            console.log("Image resized for performance");
          }

          gray = new window.cv.Mat();
          window.cv.cvtColor(mat, gray, window.cv.COLOR_RGBA2GRAY);
          console.log("Converted to grayscale");

          window.cv.GaussianBlur(gray, gray, { width: 5, height: 5 }, 0);
          console.log("Applied Gaussian blur");

          edges = new window.cv.Mat();
          window.cv.Canny(gray, edges, 50, 150);
          console.log("Edge detection applied");

          contours = new window.cv.MatVector();
          hierarchy = new window.cv.Mat();
          window.cv.findContours(edges, contours, hierarchy, window.cv.RETR_EXTERNAL, window.cv.CHAIN_APPROX_SIMPLE);
          console.log(`Found ${contours.size()} contours`);

          let maxArea = 0;
          let documentContour = null;
          for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = window.cv.contourArea(contour);
            if (area > maxArea && area > (mat.cols * mat.rows * 0.1)) {
              maxArea = area;
              documentContour = contour;
            }
          }

          if (!documentContour) {
            console.error("No valid document contour found");
            throw new Error("No document detected in the image. Ensure the document has clear edges.");
          }
          console.log("Largest contour selected, area:", maxArea);

          const perimeter = window.cv.arcLength(documentContour, true);
          approx = new window.cv.Mat();
          window.cv.approxPolyDP(documentContour, approx, 0.02 * perimeter, true);
          console.log("Contour approximated, vertices:", approx.rows);

          if (approx.rows !== 4) {
            console.error("Contour is not a quadrilateral");
            throw new Error("Could not detect a quadrilateral document. Try a clearer image.");
          }

          const points = [];
          for (let i = 0; i < 4; i++) {
            points.push([approx.data32F[i * 2], approx.data32F[i * 2 + 1]]);
          }
          console.log("Quadrilateral points:", points);

          const width = Math.max(
            Math.sqrt((points[0][0] - points[1][0]) ** 2 + (points[0][1] - points[1][1]) ** 2),
            Math.sqrt((points[2][0] - points[3][0]) ** 2 + (points[2][1] - points[3][1]) ** 2)
          );
          const height = Math.max(
            Math.sqrt((points[0][0] - points[3][0]) ** 2 + (points[0][1] - points[3][1]) ** 2),
            Math.sqrt((points[1][0] - points[2][0]) ** 2 + (points[1][1] - points[2][1]) ** 2)
          );
          console.log("Calculated document dimensions:", { width, height });

          srcPoints = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
            points[0][0], points[0][1],
            points[1][0], points[1][1],
            points[2][0], points[2][1],
            points[3][0], points[3][1],
          ]);
          dstPoints = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
            0, 0,
            width, 0,
            width, height,
            0, height,
          ]);

          M = window.cv.getPerspectiveTransform(srcPoints, dstPoints);
          warped = new window.cv.Mat();
          window.cv.warpPerspective(mat, warped, M, { width: Math.round(width), height: Math.round(height) });
          console.log("Perspective transform applied");

          enhanced = new window.cv.Mat();
          window.cv.convertScaleAbs(warped, enhanced, 1.5, 0);
          console.log("Image enhanced");

          const canvas = document.createElement("canvas");
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          window.cv.imshow(canvas, enhanced);
          const processedImageSrc = canvas.toDataURL();
          setProcessedImage(processedImageSrc);
          console.log("Processed image converted to canvas");

          callback(null, canvas, processedImageSrc);
        } catch (error) {
          console.error("Error in processDocumentImage:", error.message);
          callback(error, null, null);
        } finally {
          [mat, gray, edges, contours, hierarchy, approx, warped, enhanced, srcPoints, dstPoints, M]
            .forEach((resource) => {
              if (resource && typeof resource.delete === "function") {
                resource.delete();
              }
            });
          console.log("OpenCV resources cleaned up");
        }
      };
      img.onerror = () => {
        console.error("Failed to load image");
        callback(new Error("Failed to load image."), null, null);
      };
    };
    reader.onerror = () => {
      console.error("Error reading file");
      callback(new Error("Error reading image file."), null, null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePhotoUpload = useCallback(
    async (event, setIsUploadMenuOpen) => {
      const file = event.target.files[0];
      if (!file) {
        console.warn("No file selected");
        return;
      }

      console.log("Photo upload initiated, file:", file.name);
      setTranslationError("");
      setOriginalImage(null);
      setProcessedImage(null);

      if (!isOpenCvLoaded) {
        console.error("OpenCV.js not loaded yet");
        setTranslationError("OpenCV.js is not loaded yet. Please wait a moment and try again.");
        setTimeout(() => setTranslationError(""), 5000);
        return;
      }

      try {
        await new Promise((resolve, reject) => {
          processDocumentImage(file, async (error, canvas, processedImageSrc) => {
            if (error) {
              console.error("Document processing failed:", error.message);
              setTranslationError(error.message);
              setTimeout(() => setTranslationError(""), 5000);
              reject(error);
              return;
            }

            console.log("Document processed successfully, starting Tesseract OCR");
            try {
              const result = await Tesseract.recognize(canvas, "eng", {
                logger: (m) => console.log("Tesseract progress:", m),
              });
              console.log("Tesseract OCR completed:", result.data.text);

              const extractedText = result.data.text
                .replace(/\n{3,}/g, "\n\n")
                .replace(/[ \t]+/g, " ")
                .trim();

              if (extractedText) {
                console.log("Extracted text:", extractedText);
                setText(extractedText);
                console.log("Triggering translation for extracted text");
                await translateText(extractedText, from, to);
                setIsUploadMenuOpen(false);
                resolve();
              } else {
                console.warn("No text detected in the scanned document");
                setTranslationError("No text detected in the scanned document. Try a clearer image with visible text.");
                setTimeout(() => setTranslationError(""), 5000);
                reject(new Error("No text detected."));
              }
            } catch (tesseractError) {
              console.error("Tesseract error:", tesseractError.message);
              setTranslationError(`Error: ${tesseractError.message || "Failed to process text from scanned document"}`);
              setTimeout(() => setTranslationError(""), 5000);
              reject(tesseractError);
            }
          });
        });
      } catch (error) {
        console.error("Photo upload error:", error.message);
      }
    },
    [from, to, translateText, setTranslationError, isOpenCvLoaded, processDocumentImage]
  );

  const handleDocumentUpload = useCallback(
    async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setTranslationError("");
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
        } else {
          throw new Error(
            "Unsupported file format. Please upload a .pdf, .docx, or .txt file."
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
      }
    },
    [mammoth, translateText, setTranslationError, isPdfJsLoaded]
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
        <ErrorMessage error={openCvError || translationError || speechError} onClose={() => { setOpenCvError(""); setTranslationError(""); setSpeechError(""); }} />
        <div className="flex gap-6 grid grid-cols-1 sm:grid-cols-2">
          <TextInput
            value={text}
            onChange={setText}
            onMicrophoneToggle={() => (isListening ? stopSpeechRecognition() : startSpeechRecognition())}
            isListening={isListening}
            onSpeak={() => speakText(text, from === "auto" ? "en" : from)}
            onPhotoUpload={handlePhotoUpload}
            onDocumentUpload={handleDocumentUpload}
            originalImage={originalImage}
            processedImage={processedImage}
          />
          <TextOutput
            text={translatedText}
            loading={loading}
            onCopy={() => {}}
            onSpeak={() => speakText(translatedText, to)}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-slate-100 shadow-lg flex justify-around items-center py-3 md:flex md:gap-4 md:bottom-4 md:justify-center border md:bg-transparent md:shadow-none" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
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