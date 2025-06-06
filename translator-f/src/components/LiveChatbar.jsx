import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Mic, MicOff, Sun, Moon, ArrowLeft, Users } from "lucide-react";
import { languages } from "../components/constants";
import { useGeolocation } from "../components/languagebylocation";
import { useSpeech } from "../components/UseSpeech";

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
  const [theme, setTheme] = useState("light");
  const chatContainerRefA = useRef(null);
  const chatContainerRefB = useRef(null);
  const textareaRefA = useRef(null);
  const textareaRefB = useRef(null);

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

  // Toggle theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

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
        error: translated.startsWith("Error:") ? translated.replace("Error: ", "") : null,
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
                error: translated.startsWith("Error:") ? translated.replace("Error: ", "") : null,
              };
            }
            if (msg.type === "translated" && msg.originalId === msgId && msg.type === "user") {
              return {
                ...msg,
                text: translated,
                from: sourceFrom,
                to: targetTo,
                error: translated.startsWith("Error:") ? translated.replace("Error: ", "") : null,
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
                error: translated.startsWith("Error:") ? translated.replace("Error: ", "") : null,
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

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        theme === "light"
          ? "bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100"
          : "bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900"
      }`}
      style={{ overflowY: "auto" }}
      aria-label="Two-way communication"
    >
      <header className="p-6 border-b backdrop-blur-sm border-white/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-10 w-10 hover:bg-gray-300 dark:hover:bg-gray-900 rounded-full text-gray-700 dark:hover:text-white"
              onClick={() => window.history.back()}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
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
                className="h-6 w-6 text-purple-500"
              >
                <path d="m4 6 3-3 3 3"></path>
                <path d="M7 17V3"></path>
                <path d="m14 6 3-3 3 3"></path>
                <path d="M17 17V3"></path>
                <path d="M4 21h16"></path>
              </svg>
              <h1 className={`text-xl font-bold ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                Two-Way Communication
              </h1>
            </div>
          </div>
          <button
            className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-10 w-10 rounded-full transition-all duration-300 hover:scale-110 bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {(geoErrorA || speechErrorA || geoErrorB || speechErrorB) && (
        <div className="text-red-500 text-sm p-6 max-w-6xl mx-auto">
          {geoErrorA || speechErrorA || geoErrorB || speechErrorB}
        </div>
      )}

      <main className="p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
          {/* Speaker A Panel */}
          <div className="p-6 rounded-2xl backdrop-blur-sm border bg-white/40 border-white/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Speaker A</h3>
                  <select
                    value={fromA}
                    onChange={(e) => setFromA(e.target.value)}
                    className={`text-sm p-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "light" ? "bg-white/70 text-gray-900" : "bg-gray-800/50 text-white border-gray-600"}`}
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
            <div
              ref={chatContainerRefA}
              className="space-y-4 h-96 overflow-y-auto"
            >
              {chatHistoryA.length === 0 ? (
                <p className="text-gray-500 text-center">Start chatting...</p>
              ) : (
                chatHistoryA.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === "user" ? "justify-start" : "justify-end"}`}
                  >
                    <div className="max-w-[80%]">
                      <div
                        className={`px-3 py-2 rounded-lg text-sm ${
                          msg.type === "user"
                            ? "bg-blue-600/80 text-white"
                            : theme === "light"
                            ? "bg-white/70 text-gray-900"
                            : "bg-white/10 text-gray-200"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <textarea
                ref={textareaRefA}
                value={inputA}
                onChange={(e) => setInputA(e.target.value)}
                placeholder="Type your message..."
                className={`w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] border-0 resize-none ${
                  theme === "light" ? "bg-white/70 text-gray-900 placeholder:text-gray-500" : "bg-gray-800/50 text-white placeholder:text-gray-400"
                }`}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage("A", inputA, fromA, toB, setChatHistoryA, setChatHistoryB), setInputA(""))}
                aria-label="Speaker A input"
              />
            </div>
          </div>

          {/* Speaker B Panel */}
          <div className="p-6 rounded-2xl backdrop-blur-sm border bg-white/40 border-white/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Speaker B</h3>
                  <select
                    value={fromB}
                    onChange={(e) => setFromB(e.target.value)}
                    className={`text-sm p-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${theme === "light" ? "bg-white/70 text-gray-900" : "bg-gray-800/50 text-white border-gray-600"}`}
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
            <div
              ref={chatContainerRefB}
              className="space-y-4 h-96 overflow-y-auto"
            >
              {chatHistoryB.length === 0 ? (
                <p className="text-gray-500 text-center">Start chatting...</p>
              ) : (
                chatHistoryB.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === "user" ? "justify-start" : "justify-end"}`}
                  >
                    <div className="max-w-[80%]">
                      <div
                        className={`px-3 py-2 rounded-lg text-sm ${
                          msg.type === "user"
                            ? "bg-purple-600/80 text-white"
                            : theme === "light"
                            ? "bg-white/70 text-gray-900"
                            : "bg-white/10 text-gray-200"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <textarea
                ref={textareaRefB}
                value={inputB}
                onChange={(e) => setInputB(e.target.value)}
                placeholder="Type your message..."
                className={`w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[60px] border-0 resize-none ${
                  theme === "light" ? "bg-white/70 text-gray-900 placeholder:text-gray-500" : "bg-gray-800/50 text-white placeholder:text-gray-400"
                }`}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage("B", inputB, fromB, toA, setChatHistoryB, setChatHistoryA), setInputB(""))}
                aria-label="Speaker B input"
              />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default TwoWayCommunication;