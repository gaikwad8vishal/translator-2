
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Mic, MicOff, ArrowLeft, Users } from "lucide-react";
import { languages } from "./constants";
import { useGeolocation } from "./languagebylocation";
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
  const [toA, setToA] = useState("hi");
  const [fromB, setFromB] = useState("hi");
  const [toB, setToB] = useState("en");
  const [detectedLanguageA, setDetectedLanguageA] = useState("en");
  const [detectedLanguageB, setDetectedLanguageB] = useState("hi");
  const chatContainerRefA = useRef(null);
  const chatContainerRefB = useRef(null);
  const textareaRefA = useRef(null);
  const textareaRefB = useRef(null);
  const { theme } = useTheme();

  const { getUserLanguage: getUserLanguageA, error: geoErrorA, setError: setGeoErrorA } = useGeolocation(setToA, setDetectedLanguageA);
  const { getUserLanguage: getUserLanguageB, error: geoErrorB, setError: setGeoErrorB } = useGeolocation(setToB, setDetectedLanguageB);
  const { isListening: isListeningA, startSpeechRecognition: startSpeechA, stopSpeechRecognition: stopSpeechA, error: speechErrorA, setError: setSpeechErrorA } = useSpeech(fromA, (transcript) => setInputA((prev) => prev + transcript));
  const { isListening: isListeningB, startSpeechRecognition: startSpeechB, stopSpeechRecognition: stopSpeechB, error: speechErrorB, setError: setSpeechErrorB } = useSpeech(fromB, (transcript) => setInputB((prev) => prev + transcript));

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

  // Call geolocation
  useEffect(() => {
    getUserLanguageA();
    getUserLanguageB();
  }, [getUserLanguageA, getUserLanguageB]);

  // Scroll chat containers
  useEffect(() => {
    if (chatContainerRefA.current) {
      chatContainerRefA.current.scrollTop = chatContainerRefA.current.scrollHeight;
    }
    if (chatContainerRefB.current) {
      chatContainerRefB.current.scrollTop = chatContainerRefB.current.scrollHeight;
    }
  }, [chatHistoryA, chatHistoryB]);

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
    }
  }, []);

  const handleLanguageChange = useCallback(
    async (speaker, msgId, newFrom, newTo, setChatHistory, otherSetChatHistory, fromLang, toLang) => {
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
            if (msg.type === "translated" && msg.originalId === msgId && msg.type === "user") {
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
      }
    },
    [chatHistoryA, chatHistoryB]
  );

  // ... (previous imports and code remain unchanged)

return (
  <div className="min-h-screen pb-16 transition-all duration-500 bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900" style={{ overflowY: "auto" }} aria-label="Two-way communication">
    <Header />
    <main className="p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
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
              className="h-6 w-6 text-purple-500 dark:text-purple-300"
            >
              <path d="m4 6 3-3 3 3"></path>
              <path d="M7 17V3"></path>
              <path d="m14 6 3-3 3 3"></path>
              <path d="M17 17V3"></path>
              <path d="M4 21h16"></path>
            </svg>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Two-Way Communication</h1>
          </div>
        </div>

        {(geoErrorA || speechErrorA || geoErrorB || speechErrorB) && (
          <div className="text-red-500 dark:text-red-400 text-sm p-6 max-w-6xl mx-auto">
            {geoErrorA || speechErrorA || geoErrorB || speechErrorB}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Speaker A Panel */}
          <div className="p-6 rounded-2xl backdrop-blur-sm border bg-white/40 dark:bg-gray-800/40 border-white/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Speaker A</h3>
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
              </div>
              <button
                className={`inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-16 h-16 rounded-full transition-all duration-300 hover:scale-105 ${
                  isListeningA ? "bg-red-600 hover:bg-red-700" : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                } text-white shadow-lg`}
                onClick={() => (isListeningA ? stopSpeechA() : startSpeechA())}
                aria-label={isListeningA ? "Stop microphone" : "Start microphone"}
              >
                {isListeningA ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </button>
            </div>
            <div ref={chatContainerRefA} className="space-y-4 h-96 overflow-y-auto">
              {chatHistoryA.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center">Start chatting...</p>
              ) : (
                chatHistoryA.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-start" : "justify-end"}`}>
                    <div className="max-w-[80%]">
                      <div
                        className={`px-3 py-2 rounded-lg text-sm ${
                          msg.type === "user" ? "bg-blue-600/80 text-white" : "bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex items-end gap-2">
              <textarea
                ref={textareaRefA}
                value={inputA}
                onChange={(e) => setInputA(e.target.value)}
                placeholder="Type your message..."
                className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] border-0 resize-none bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage("A", inputA, fromA, toB, setChatHistoryA, setChatHistoryB), setInputA(""))}
                aria-label="Speaker A input"
              />
              <button
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full p-3 transition-all duration-300 hover:scale-105 sm:hidden"
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
          </div>

          {/* Speaker B Panel */}
          <div className="p-6 rounded-2xl border backdrop-blur-sm border bg-white/40 dark:bg-gray-800/40 border-white/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Speaker B</h3>
                  <select
                    value={fromB}
                    onChange={(e) => setFromB(e.target.value)}
                    className="text-sm p-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    aria-label="Select Speaker B language"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                className={`inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-16 h-16 rounded-full transition-all duration-300 hover:scale-105 ${
                  isListeningB ? "bg-red-600 hover:bg-red-700" : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                } text-white shadow-lg`}
                onClick={() => (isListeningB ? stopSpeechB() : startSpeechB())}
                aria-label={isListeningB ? "Stop microphone" : "Start microphone"}
              >
                {isListeningB ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </button>
            </div>
            <div ref={chatContainerRefB} className="space-y-4 h-96 overflow-y-auto">
              {chatHistoryB.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center">Start chatting...</p>
              ) : (
                chatHistoryB.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-start" : "justify-end"}`}>
                    <div className="max-w-[80%]">
                      <div
                        className={`px-3 py-2 rounded-lg text-sm ${
                          msg.type === "user" ? "bg-purple-600/80 text-white" : "bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex items-end gap-2">
              <textarea
                ref={textareaRefB}
                value={inputB}
                onChange={(e) => setInputB(e.target.value)}
                placeholder="Type your message..."
                className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[60px] border-0 resize-none bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage("B", inputB, fromB, toA, setChatHistoryB, setChatHistoryA), setInputB(""))}
                aria-label="Speaker B input"
              />
              <button
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full p-3 transition-all duration-300 hover:scale-105 sm:hidden"
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
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default TwoWayCommunication;