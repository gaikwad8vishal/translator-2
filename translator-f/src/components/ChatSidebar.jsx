import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Mic, MicOff, ArrowLeft } from "lucide-react";
import { IoMdSend } from "react-icons/io";
import { languages } from "../components/constants";
import { useGeolocation } from "../components/languagebylocation";
import { useSpeech } from "../components/UseSpeech";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";


const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const ChatSidebar = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("hi");
  const [detectedLanguage, setDetectedLanguage] = useState("hi");
  const [isLoading, setIsLoading] = useState(false); // New state for loading
  const chatContainerRef = useRef(null);
  const { theme } = useTheme();

  const { getUserLanguage, error: geoError, setError: setGeoError } = useGeolocation(setTo, setDetectedLanguage);
  const { isListening, startSpeechRecognition, stopSpeechRecognition, error: speechError, setError: setSpeechError } = useSpeech(from, (transcript) => setChatInput((prev) => prev + (prev ? " " : "") + transcript));

  useEffect(() => {
    getUserLanguage();
  }, [getUserLanguage]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim()) return;

    const userMessageId = Date.now();
    const userMessage = { type: "user", text: chatInput, id: userMessageId, from, to };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsLoading(true); // Start loading

    try {
      const response = await axios.post(
        `${backendURL}/translate/`,
        { text: chatInput, from, to },
        { headers: { "Content-Type": "application/json" } }
      );
      const translated = response.data.translatedText;
      setChatHistory((prev) => [
        ...prev,
        {
          type: "bot",
          text: translated,
          id: Date.now() + 1,
          from,
          to,
          userMessageId,
          error: translated.startsWith("Error:") ? translated.replace("Error: ", "") : null,
        },
      ]);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { type: "bot", text: `Error: ${error.message}`, id: Date.now() + 1, from, to, userMessageId, error: error.message },
      ]);
    } finally {
      setIsLoading(false); // Stop loading
    }
  }, [chatInput, from, to]);

  const handleLanguageChange = useCallback(async (msgId, newFrom, newTo) => {
    const message = chatHistory.find((msg) => msg.id === msgId);
    if (!message) return;

    let originalText;
    let sourceFrom = newFrom || message.from;
    let targetTo = newTo || message.to;

    if (message.type === "user") {
      originalText = message.text;
    } else {
      const userMessage = chatHistory.find((m) => m.id === message.userMessageId);
      if (!userMessage) return;
      originalText = userMessage.text;
      sourceFrom = newFrom || userMessage.from;
    }

    setIsLoading(true); // Start loading

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
              text: translated,
              error: translated.startsWith("Error:") ? translated.replace("Error: ", "") : null,
            };
          }
          if (msg.type === "user" && message.type === "bot" && message.userMessageId === msg.id) {
            return { ...msg, from: sourceFrom };
          }
          return msg;
        });

        if (message.type === "user") {
          updatedHistory = updatedHistory.map((msg) => {
            if (msg.type === "bot" && msg.userMessageId === msgId) {
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
        }

        return updatedHistory;
      });
    } catch (error) {
      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.id === msgId
            ? { ...msg, text: `Error: ${error.message}`, error: error.message }
            : msg
        )
      );
    } finally {
      setIsLoading(false); // Stop loading
    }
  }, [chatHistory]);

  return (
    <div className="min-h-screen pb-24 transition-all duration-500 bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900" style={{ overflowY: "auto" }} aria-label="Chat section">
      <Header />
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
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
                className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 dark:text-purple-300"
              >
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Single Device Chat</h1>
            </div>
          </div>

          {(geoError || speechError) && (
            <div className="text-red-500 dark:text-red-400 text-xs sm:text-sm p-4 sm:p-6 max-w-4xl mx-auto">
              {geoError || speechError}
            </div>
          )}

          <div className="flex flex-col h-[calc(100vh-200px)] sm:h-[calc(100vh-220px)]">
            <div ref={chatContainerRef} className="flex-1 space-y-4 mb-4 sm:mb-6 overflow-y-auto">
              {chatHistory.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-6 sm:p-8 rounded-2xl backdrop-blur-sm border bg-white/40 dark:bg-gray-800/40 border-white/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-200">
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
                      className="h-12 w-12 mx-auto mb-4 text-purple-500 dark:text-purple-300"
                    >
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                    </svg>
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">Start Your Conversation</h3>
                    <p className="text-xs sm:text-sm">Type or speak a message to get instant translations!</p>
                  </div>
                </div>
              ) : (
                <>
                  {chatHistory.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-start" : "justify-end"}`}>
                      <div className="max-w-[70%] sm:max-w-[80%]">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {msg.type === "user" ? (
                            <div>
                              <select
                                id={`from-${msg.id}`}
                                value={msg.from}
                                onChange={(e) => handleLanguageChange(msg.id, e.target.value, "")}
                                className="w-full p-2 border rounded-lg focus:outline-none text-xs sm:text-sm bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                              >
                                {languages.map((lang) => (
                                  <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div>
                              <select
                                id={`to-${msg.id}`}
                                value={msg.to}
                                onChange={(e) => handleLanguageChange(msg.id, "", e.target.value)}
                                className="w-full p-2 border rounded-lg focus:outline-none text-gray-900 dark:text-gray-300 text-xs sm:text-sm bg-white/70 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600"
                              >
                                {languages.map((lang) => (
                                  <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        <div
                          className={`px-2 py-1 sm:p-2 rounded-lg text-xs sm:text-sm ${
                            msg.type === "user"
                              ? "bg-purple-600/80 text-white border-blue-500"
                              : "bg-white/70 dark:bg-gray-800 text-gray-900 dark:text-white"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-end">
                      <div className="max-w-[70%] sm:max-w-[80%]">
                        <div className="px-2 py-1 sm:p-2 rounded-lg text-xs sm:text-sm bg-white/70 dark:bg-gray-800 text-gray-900 dark:text-white">
                          <span className="inline-flex space-x-1">
                            <span className="animate-bounce" style={{ animationDelay: "0s" }}>.</span>
                            <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                            <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>.</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border bg-white/60 dark:bg-gray-800/50 border-white/50 dark:border-gray-700/50">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex-1">
                    <label htmlFor="from-lang" className="text-xs text-gray-600 dark:text-gray-300">
                      From:
                    </label>
                    <select
                      id="from-lang"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      aria-label="Select source language"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="to-lang" className="text-xs text-gray-600 dark:text-gray-300">
                      To:
                    </label>
                    <select
                      id="to-lang"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 text-xs sm:text-sm bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      aria-label="Select to language"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3 items-center">
                  <div className="flex-1">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex w-full rounded-md px-2 py-1 sm:p-2 text-xs sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[50px] sm:min-h-[60px] border-0 resize-none bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      aria-label="Chat input"
                    />
                  </div>
                  <div className="flex gap-1 sm:gap-2">
                    <button
                      onClick={() => (isListening ? stopSpeechRecognition() : startSpeechRecognition())}
                      className={`inline-flex items-center justify-center whitespace-nowrap text-xs sm:text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 w-8 sm:h-10 sm:w-10 rounded-full transition-all duration-200 ${
                        isListening
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-gray-800/20 dark:bg-gray-800/50 hover:bg-gray-800/30 dark:hover:bg-gray-800/70 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                      }`}
                      aria-label={isListening ? "Stop microphone" : "Start microphone"}
                    >
                      {isListening ? <Mic className="h-4 w-4 sm:h-5 sm:w-5" /> : <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </button>
                    <button
                      onClick={handleSendMessage}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 sm:h-10 px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      aria-label="Send message"
                    >
                      <IoMdSend className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatSidebar;