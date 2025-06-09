import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Mic, MicOff, Users } from "lucide-react";
import { languages } from "./constants";
import { useSpeech } from "./UseSpeech";
import Header from "./Header";
import { useTheme } from "../context/ThemeContext";

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

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
  const [showTextInputA, setShowTextInputA] = useState(false);
  const [showTextInputB, setShowTextInputB] = useState(false);
  const chatContainerRefA = useRef(null);
  const chatContainerRefB = useRef(null);
  const textareaRefA = useRef(null);
  const textareaRefB = useRef(null);
  const lastMicClickRefA = useRef(0);
  const lastMicClickRefB = useRef(0);
  const micClickInterval = 1000; // Minimum interval between mic clicks (ms)
  const { theme } = useTheme();

  const { isListening: isListeningA, startSpeechRecognition: startSpeechA, stopSpeechRecognition: stopSpeechA, error: speechErrorA, setError: setSpeechErrorA } = useSpeech(fromA, (transcript) => setInputA((prev) => prev + transcript));
  const { isListening: isListeningB, startSpeechRecognition: startSpeechB, stopSpeechRecognition: stopSpeechB, error: speechErrorB, setError: setSpeechErrorB } = useSpeech(fromB, (transcript) => setInputB((prev) => prev + transcript));




  const handleSendMessage = useCallback(async (speaker, text, fromLang, toLang, setChatHistory, otherSetChatHistory) => {
    if (!text.trim()) return;

    const messageId = Date.now();
    const userMessage = { type: "user", text, id: messageId, from: fromLang, to: toLang };
    setChatHistory((prev) => [...prev, userMessage]);

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
      setChatHistory((prev) => [...prev, translatedMessage]);
      otherSetChatHistory((prev) => [...prev, userMessage, translatedMessage]);
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
      setChatHistory((prev) => [...prev, errorMessage]);
      otherSetChatHistory((prev) => [...prev, userMessage, errorMessage]);
      setPersistentError(`Translation failed: ${error.message}`);
    }
  }, []);



  // Adjust textarea height
  useEffect(() => {
    if (textareaRefA.current) {
      textareaRefA.current.style.height = "auto";
      textareaRefA.current.style.height = `${textareaRefA.current.scrollHeight}px`;
    }
    if (textareaRefB.current) {
      textareaRefB.current.style.height = "auto";
      textareaRefB.current.style.height = `${textareaRefB.current.scrollHeight}px`;
    }
  }, [inputA, inputB]);

  // Scroll chat containers
  useEffect(() => {
    if (chatContainerRefA.current) {
      chatContainerRefA.current.scrollTop = chatContainerRefA.current.scrollHeight;
    }
    if (chatContainerRefB.current) {
      chatContainerRefB.current.scrollTop = chatContainerRefB.current.scrollHeight;
    }
  }, [chatHistoryA, chatHistoryB]);

  // Handle persistent errors for speech recognition
  useEffect(() => {
    if (speechErrorA && speechErrorA.includes("Network error")) {
      setPersistentError("Speech recognition is unavailable due to network issues. Please use text input.");
    } else if (speechErrorB && speechErrorB.includes("Network error")) {
      setPersistentError("Speech recognition is unavailable due to network issues. Please use text input.");
    } else {
      setPersistentError("");
    }
  }, [speechErrorA, speechErrorB]);

  // Automatically send message when speech recognition stops for Speaker A
  useEffect(() => {
    if (!isListeningA && inputA.trim()) {
      handleSendMessage("A", inputA, fromA, toB, setChatHistoryA, setChatHistoryB);
      setInputA(""); // Clear input after sending
    }
  }, [isListeningA, inputA, fromA, toB, handleSendMessage]);

  // Automatically send message when speech recognition stops for Speaker B
  useEffect(() => {
    if (!isListeningB && inputB.trim()) {
      handleSendMessage("B", inputB, fromB, toA, setChatHistoryB, setChatHistoryA);
      setInputB(""); // Clear input after sending
    }
  }, [isListeningB, inputB, fromB, toA, handleSendMessage]);

  // Debounced microphone click handler for Speaker A
  const handleMicClickA = useCallback(() => {
    const now = Date.now();
    if (now - lastMicClickRefA.current < micClickInterval) {
      console.log("Microphone click throttled for Speaker A");
      return;
    }
    lastMicClickRefA.current = now;
    if (isListeningA) {
      stopSpeechA();
    } else {
      startSpeechA();
    }
  }, [isListeningA, startSpeechA, stopSpeechA]);

  // Debounced microphone click handler for Speaker B
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

  
  const handleLanguageChange = useCallback(
    async (speaker, msgId, newFrom, newTo, setChatHistory, otherSetChatHistory) => {
      const history = speaker === "A" ? chatHistoryA : chatHistoryB;
      const message = history.find((msg) => msg.id === msgId);
      if (!message) return;

      let originalText;
      let sourceFrom = newFrom || message.from;
      let targetTo = newTo || message.to;

      if (message.type === "user") {
        originalText = message.text;
      } else {
        const original = history.find((m) => m.id === message.originalId);
        if (!original) return;
        originalText = original.text;
        sourceFrom = newFrom || original.from;
      }

      try {
        const response = await axios.post(
          `${backendURL}/translate/`,
          { text: originalText, from: sourceFrom, to: targetTo },
          { headers: { "Content-Type": "application/json" } }
        );
        const translated = response.data.translatedText;

        setChatHistory((prev) => {
          let updatedHistory = prev.map((msg) => {
            if (msg.id === msgId) {
              return {
                ...msg,
                from: sourceFrom,
                to: targetTo,
                text: msg.type === "user" ? msg.text : translated,
                error: translated.startsWith("Error:") ? translated.replace("Error:", "") : null,
              };
            }
            if (msg.type === "translated" && msg.originalId === msgId) {
              return {
                ...msg,
                text: translated,
                from: sourceFrom,
                to: targetTo,
                error: translated.startsWith("Error:") ? translated.replace("Error:", "") : null,
              };
            }
            return msg;
          });
          return updatedHistory;
        });

        otherSetChatHistory((prev) => {
          let updatedHistory = prev.map((msg) => {
            if (msg.id === msgId || (msg.type === "translated" && msg.originalId === msgId)) {
              return {
                ...msg,
                from: sourceFrom,
                to: targetTo,
                text: msg.type === "user" ? msg.text : translated,
                error: translated.startsWith("Error:") ? translated.replace("Error:", "") : null,
              };
            }
            return msg;
          });
          return updatedHistory;
        });
      } catch (error) {
        setChatHistory((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? {
                  ...msg,
                  text: `Error: ${error.message}`,
                  error: error.message,
                }
              : msg
          )
        );
        otherSetChatHistory((prev) =>
          prev.map((msg) =>
            msg.id === msgId || (msg.type === "translated" && msg.originalId === msgId)
              ? {
                  ...msg,
                  text: `Error: ${error.message}`,
                  error: error.message,
                }
              : msg
          )
        );
        setPersistentError(`Translation failed: ${error.message}`);
      }
    },
    [chatHistoryA, chatHistoryB]
  );

  const getLatestMessagePair = (history) => {
    if (history.length === 0) return null;
    const latestUserMessage = history.slice().reverse().find((msg) => msg.type === "user");
    if (!latestUserMessage) return null;
    const latestTranslatedMessage = history.find((msg) => msg.type === "translated" && msg.originalId === latestUserMessage.id);
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

        {/* Split-screen layout for face-to-face conversation */}
        <div className="flex-1 pb-24 flex flex-col justify-between">
          {/* Speaker A Panel (Top) */}
          <div className="flex-1 border flex flex-col justify-end p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-500" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Speaker A</h3>
              </div>
              <select
                value={fromA}
                onChange={(e) => setFromA(e.target.value)}
                className="text-sm p-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                aria-label="Select Speaker A language"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            {latestMessageA ? (
              <div className="mb-4">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{latestMessageA.user.text}</p>
                {latestMessageA.translated && (
                  <p className="text-md text-gray-600 dark:text-gray-300">{latestMessageA.translated.text}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center mb-4">Tap the microphone to speak...</p>
            )}
            <button
              className={`mx-auto flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
                isListeningA
                  ? "bg-red-600 animate-pulse"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              } text-white shadow-lg`}
              onClick={handleMicClickA}
              aria-label={isListeningA ? "Stop microphone" : "Start microphone"}
            >
              {isListeningA ? <Mic className="h-8 w-8" /> : <MicOff className="h-8 w-8" />}
            </button>
            <button
              className="mt-2 text-sm text-blue-500 dark:text-blue-300"
              onClick={() => setShowTextInputA(!showTextInputA)}
              aria-label={showTextInputA ? "Hide text input for Speaker A" : "Show text input for Speaker A"}
            >
              {showTextInputA ? "Hide Text Input" : "Show Text Input"}
            </button>
            {showTextInputA && (
              <div className="mt-2 flex justify-center gap-2">
                <textarea
                  ref={textareaRefA}
                  value={inputA}
                  onChange={(e) => setInputA(e.target.value)}
                  placeholder="Type your message..."
                  className="w-3/4 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] border-0 resize-none bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage("A", inputA, fromA, toB, setChatHistoryA, setChatHistoryB), setInputA(""))}
                  aria-label="Speaker A input"
                />
                <button
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full p-3 transition-all duration-300 hover:scale-105"
                  onClick={() => {
                    handleSendMessage("A", inputA, fromA, toB, setChatHistoryA, setChatHistoryB);
                    setInputA("");
                  }}
                  disabled={!inputA.trim()}
                  aria-label="Send message for Speaker A"
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
                    className="h-6 w-6"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            )}
            <div ref={chatContainerRefA} className="mt-4 max-h-40 overflow-y-auto space-y-2">
              {chatHistoryA.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.type === "user" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                      msg.type === "user"
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 dark:border-gray-700 my-2"></div>

          {/* Speaker B Panel (Bottom, Rotated) */}
          <div className="flex-1 border flex flex-col justify-start p-4 transform rotate-180">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-500 transform rotate-180" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white transform rotate-180">Speaker B</h3>
              </div>
              <select
                value={fromB}
                onChange={(e) => setFromB(e.target.value)}
                className="text-sm p-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 transform rotate-180"
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
              <div className="mb-4 transform rotate-180">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{latestMessageB.user.text}</p>
                {latestMessageB.translated && (
                  <p className="text-md text-gray-600 dark:text-gray-300">{latestMessageB.translated.text}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center mb-4 transform rotate-180">Tap the microphone to speak...</p>
            )}
            <button
              className={`mx-auto flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 transform rotate-180 ${
                isListeningB
                  ? "bg-red-600 animate-pulse"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              } text-white shadow-lg`}
              onClick={handleMicClickB}
              aria-label={isListeningB ? "Stop microphone" : "Start microphone"}
            >
              {isListeningB ? <Mic className="h-8 w-8 transform rotate-180" /> : <MicOff className="h-8 w-8 transform rotate-180" />}
            </button>
            <button
              className="mt-2 text-sm text-purple-500 dark:text-purple-300 transform rotate-180"
              onClick={() => setShowTextInputB(!showTextInputB)}
              aria-label={showTextInputB ? "Hide text input for Speaker B" : "Show text input for Speaker B"}
            >
              {showTextInputB ? "Hide Text Input" : "Show Text Input"}
            </button>
            {showTextInputB && (
              <div className="mt-2 flex justify-center gap-2 transform rotate-180">
                <textarea
                  ref={textareaRefB}
                  value={inputB}
                  onChange={(e) => setInputB(e.target.value)}
                  placeholder="Type your message..."
                  className="w-3/4 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[40px] border-0 resize-none bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage("B", inputB, fromB, toA, setChatHistoryB, setChatHistoryA), setInputB(""))}
                  aria-label="Speaker B input"
                />
                <button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full p-3 transition-all duration-300 hover:scale-105"
                  onClick={() => {
                    handleSendMessage("B", inputB, fromB, toA, setChatHistoryB, setChatHistoryA);
                    setInputB("");
                  }}
                  disabled={!inputB.trim()}
                  aria-label="Send message for Speaker B"
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
                    className="h-6 w-6"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            )}
            <div ref={chatContainerRefB} className="mt-4 max-h-40 overflow-y-auto space-y-2 transform rotate-180">
              {chatHistoryB.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.type === "user" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                      msg.type === "user"
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TwoWayCommunication;