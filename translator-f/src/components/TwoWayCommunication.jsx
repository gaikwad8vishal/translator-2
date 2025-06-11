import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Mic, MicOff, Users, RotateCw } from "lucide-react";
import { languages } from "./constants";
import { useSpeech } from "./UseSpeech";
import Header from "./Header";
import { useTheme } from "../context/ThemeContext";

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const languageMap = {
  en: "en",
  hi: "hi",
  kn: "kn",
  mr: "mr",
  ta: "ta",
  te: "te",
};

const LoadingDots = () => {
  return (
    <div className="max-w-[70%] px-3 py-2 rounded-lg text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
      <div className="flex justify-center items-center space-x-2">
        <span className="sr-only">Loading...</span>
        <div className="dot h-2 w-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="dot h-2 w-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="dot h-2 w-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
};

const TwoWayCommunication = () => {
  const [chatHistoryA, setChatHistoryA] = useState([]);
  const [chatHistoryB, setChatHistoryB] = useState([]);
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [fromA, setFromA] = useState("en");
  const [toA, setToA] = useState("en");
  const [fromB, setFromB] = useState("hi");
  const [toB, setToB] = useState("hi");
  const [persistentError, setPersistentError] = useState("");
  const [isLoadingA, setIsLoadingA] = useState(false);
  const [isLoadingB, setIsLoadingB] = useState(false);
  const [isARotated, setIsARotated] = useState(true); // State for Speaker A rotation
  const chatContainerRefA = useRef(null);
  const chatContainerRefB = useRef(null);
  const lastMicClickRefA = useRef(0);
  const lastMicClickRefB = useRef(0);
  const micClickInterval = 2000;

  const isTypingA = useRef(false);
  const isTypingB = useRef(false);
  const inputBufferA = useRef("");
  const inputBufferB = useRef("");

  const handleTranscriptA = useCallback((transcript) => {
    if (!isTypingA.current && transcript.trim()) {
      inputBufferA.current = inputBufferA.current
        ? `${inputBufferA.current} ${transcript}`
        : transcript;
      setInputA(inputBufferA.current);
    }
  }, []);

  const handleTranscriptB = useCallback((transcript) => {
    if (!isTypingB.current && transcript.trim()) {
      inputBufferB.current = inputBufferB.current
        ? `${inputBufferB.current} ${transcript}`
        : transcript;
      setInputB(inputBufferB.current);
    }
  }, []);

  const {
    isListening: isListeningA,
    startSpeechRecognition: startSpeechA,
    stopSpeechRecognition: stopSpeechA,
    error: speechErrorA,
    setError: setSpeechErrorA,
    speakText: speakTextA,
  } = useSpeech(fromA, handleTranscriptA);

  const {
    isListening: isListeningB,
    startSpeechRecognition: startSpeechB,
    stopSpeechRecognition: stopSpeechB,
    error: speechErrorB,
    setError: setSpeechErrorB,
    speakText: speakTextB,
  } = useSpeech(fromB, handleTranscriptB);

  const handleSendMessage = useCallback(
    async (speaker, text, fromLang, toLang, setChatHistory, otherSetChatHistory) => {
      if (!text.trim()) return;

      const messageId = Date.now();
      const userMessage = { type: "user", text, id: messageId, from: fromLang, to: toLang };
      setChatHistory((prev) => [...prev, userMessage]);

      if (speaker === "A") {
        setIsLoadingB(true);
      } else {
        setIsLoadingA(true);
      }

      try {
        const response = await axios.post(
          `${backendURL}/translate/`,
          { text, from: fromLang, to: toLang },
          { headers: { "Content-Type": "application/json" } }
        );
        const translated = response.data.translatedText;
        const translatedMessage = {
          type: "translated",
          text: translated,
          id: Date.now() + 1,
          from: fromLang,
          to: toLang,
          originalId: messageId,
          error: translated.startsWith("Error:") ? translated.replace("Error:", "") : null,
        };

        otherSetChatHistory((prev) => [...prev, translatedMessage]);

        const targetLang = languageMap[toLang] || toLang;
        console.log(
          `Speaking for ${speaker === "A" ? "Speaker B" : "Speaker A"} in language: ${targetLang}, text: ${translatedMessage.text}`
        );

        if (speaker === "A" && !translatedMessage.error) {
          try {
            speakTextB(translatedMessage.text, targetLang);
          } catch (err) {
            setPersistentError(`Text-to-speech failed for Speaker B: ${err.message}`);
          }
        } else if (speaker === "B" && !translatedMessage.error) {
          try {
            speakTextA(translatedMessage.text, targetLang);
          } catch (err) {
            setPersistentError(`Text-to-speech failed for Speaker A: ${err.message}`);
          }
        }
      } catch (error) {
        const errorMessage = {
          type: "translated",
          text: `Error: ${error.message}`,
          id: Date.now() + 1,
          from: fromLang,
          to: toLang,
          originalId: messageId,
          error: error.message,
        };
        otherSetChatHistory((prev) => [...prev, userMessage, errorMessage]);
        setPersistentError(`Translation failed: ${error.message}`);
      } finally {
        if (speaker === "A") {
          setIsLoadingB(false);
        } else {
          setIsLoadingA(false);
        }
      }
    },
    [speakTextA, speakTextB]
  );

  useEffect(() => {
    if (chatContainerRefA.current) {
      chatContainerRefA.current.scrollTop = chatContainerRefA.current.scrollHeight;
    }
    if (chatContainerRefB.current) {
      chatContainerRefB.current.scrollTop = chatContainerRefB.current.scrollHeight;
    }
  }, [chatHistoryA, chatHistoryB]);

  useEffect(() => {
    if (speechErrorA && speechErrorA.includes("Network error")) {
      setPersistentError("Speech recognition is unavailable due to network issues.");
    } else if (speechErrorB && speechErrorB.includes("Network error")) {
      setPersistentError("Speech recognition is unavailable due to network issues.");
    } else {
      setPersistentError("");
    }
  }, [speechErrorA, speechErrorB]);

  useEffect(() => {
    if (!isListeningA && inputA.trim()) {
      const timeout = setTimeout(() => {
        handleSendMessage("A", inputA, fromA, toB, setChatHistoryA, setChatHistoryB);
        setInputA("");
        inputBufferA.current = "";
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isListeningA, inputA, fromA, toB, handleSendMessage]);

  useEffect(() => {
    if (!isListeningB && inputB.trim()) {
      const timeout = setTimeout(() => {
        handleSendMessage("B", inputB, fromB, toA, setChatHistoryB, setChatHistoryA);
        setInputB("");
        inputBufferB.current = "";
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isListeningB, inputB, fromB, toA, handleSendMessage]);

  const handleMicClickA = useCallback(() => {
    const now = Date.now();
    if (now - lastMicClickRefA.current < micClickInterval) {
      return;
    }
    lastMicClickRefA.current = now;
    if (isListeningA) {
      stopSpeechA();
    } else {
      startSpeechA();
    }
  }, [isListeningA, startSpeechA, stopSpeechA]);

  const handleMicClickB = useCallback(() => {
    const now = Date.now();
    if (now - lastMicClickRefB.current < micClickInterval) {
      console.log("Microphone click throttled for Speaker B");
      return;
    }
    lastMicClickRefB.current = now;
    if (isListeningB) {
      stopSpeechB();
    } else {
      startSpeechB();
    }
  }, [isListeningB, startSpeechB, stopSpeechB]);

  const toggleARotation = () => {
    setIsARotated((prev) => !prev);
  };

  const getLatestMessagePair = (history) => {
    if (history.length === 0) return null;
    const latestUserMessage = history.slice().reverse().find((msg) => msg.type === "user");
    if (!latestUserMessage) return null;
    const latestTranslatedMessage = history.find(
      (msg) => msg.type === "translated" && msg.originalId === latestUserMessage.id
    );
    return { user: latestUserMessage, translated: latestTranslatedMessage };
  };

  const latestMessageA = getLatestMessagePair(chatHistoryA);
  const latestMessageB = getLatestMessagePair(chatHistoryB);

  return (
    <div
      className="min-h-screen transition-all duration-500 bg-gray-100 dark:bg-gray-900"
      style={{ overflowY: "auto" }}
      aria-label="Two-way communication"
    >
      <Header />
      <main className="p-4 flex flex-col h-screen">
        {persistentError && (
          <div className="text-red-500 dark:text-red-400 text-sm p-4 bg-red-100 dark:bg-red-900/50 rounded-lg flex justify-between items-center mx-auto max-w-2xl">
            <span>{persistentError}</span>
            <button
              className="text-red-700 dark:text-red-300 hover:underline"
              onClick={() => setPersistentError("")}
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex-1 pb-24 flex flex-col justify-between">
          {/* Speaker A Panel (Top, Conditionally Rotated) */}
          <div className={`flex-1 border flex flex-col justify-end p-4 ${isARotated ? "transform rotate-180" : ""}`}>
            <div className={isARotated ? "transform rotate-180" : ""}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Users className={`h-6 w-6 text-blue-500 ${isARotated ? "transform rotate-180" : ""}`} />
                  <h3 className={`font-bold text-lg text-gray-900 dark:text-white ${isARotated ? "transform rotate-180" : ""}`}>Speaker A</h3>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={fromA}
                    onChange={(e) => setFromA(e.target.value)}
                    className={`text-sm ${isARotated ? "transform rotate-180" : ""} p-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600`}
                    aria-label="Select Speaker A language"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code} className={`${isARotated ? "transform rotate-180" : ""}`}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="flex items-center justify-center p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300"
                    onClick={toggleARotation}
                    aria-label={isARotated ? "Rotate Speaker A to normal" : "Rotate Speaker A 180 degrees"}
                  >
                    <RotateCw className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {latestMessageA ? (
                <div className="mb-4">
                  <p className={`text-lg ${isARotated ? "transform rotate-180" : ""} font-semibold text-gray-900 dark:text-white`}>{latestMessageA.user.text}</p>
                </div>
              ) : (
                <p className={`text-gray-500 ${isARotated ? "transform rotate-180" : ""} dark:text-gray-400 text-center mb-4`}>Tap the microphone to speak...</p>
              )}
              <button
                className={`mx-auto flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
                  isListeningA
                    ? "bg-red-600 animate-pulse"
                    : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                } text-white shadow-lg ${isARotated ? "transform rotate-180" : ""} `}
                onClick={handleMicClickA}
                aria-label={isListeningA ? "Stop microphone" : "Start microphone"}
              >
                {isListeningA ? <Mic className="h-8 w-8" /> : <MicOff className="h-8 w-8" />}
              </button>
              <div ref={chatContainerRefA} className={`mt-4  ${isARotated ? "transform rotate-180" : ""} max-h-40 overflow-y-auto space-y-2`}>
                {chatHistoryA.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === "user" ? (isARotated ? "justify-end" : "justify-start") : (isARotated ? "justify-start" : "justify-end")}`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-lg  text-sm ${
                        msg.type === "user"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoadingA && (
                  <div className={`flex ${isARotated ? "justify-start" : "justify-end"}`}>
                    <LoadingDots />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-600 dark:border-gray-300 my-2"></div>

          {/* Speaker B Panel (Bottom, Unrotated) */}
          <div className="flex-1 border flex flex-col justify-start p-4">
            <div className="flex justify-between items-center mb-4 gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-500" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-200">Speaker B</h3>
              </div>
              <select
                value={fromB}
                onChange={(e) => setFromB(e.target.value)}
                className="text-sm p-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                aria-label="Select Speaker B language"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            {latestMessageB ? (
              <div className="mb-4">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-200">{latestMessageB.user.text}</p>
                {latestMessageB.translated && (
                  <p className="text-md text-gray-600 dark:text-gray-300">{latestMessageB.translated.text}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center mb-4">Tap the microphone to speak...</p>
            )}
            <button
              className={`mx-auto flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
                isListeningB
                  ? "bg-red-600 animate-pulse"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              } text-gray-200 shadow-lg`}
              onClick={handleMicClickB}
              aria-label={isListeningB ? "Stop microphone" : "Start microphone"}
            >
              {isListeningB ? <Mic className="h-8 w-8" /> : <MicOff className="h-8 w-8" />}
            </button>
            <div ref={chatContainerRefB} className="mt-4 max-h-40 overflow-y-auto space-y-2">
              {chatHistoryB.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                      msg.type === "user"
                        ? "bg-green-500 text-gray-200"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoadingB && (
                <div className="flex justify-end">
                  <LoadingDots />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TwoWayCommunication;