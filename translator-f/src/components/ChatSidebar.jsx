import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Mic, MicOff } from "lucide-react";
import { IoMdSend } from "react-icons/io";
import { languages } from "../components/constants";
import { useGeolocation } from "../components/languagebylocation";
import { useSpeech } from "../components/UseSpeech";



const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";



const ChatSidebar = ({ isOpen, setIsOpen }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("en");
  const [detectedLanguage, setDetectedLanguage] = useState("hi");
  const sidebarRef = useRef(null);
  const chatContainerRef = useRef(null);

  const { getUserLanguage, error: geoError, setError: setGeoError } = useGeolocation(setTo, setDetectedLanguage);
  const { isListening, startSpeechRecognition, stopSpeechRecognition, error: speechError, setError: setSpeechError } = useSpeech(from, (transcript) => setChatInput((prev) => prev + transcript));

  useEffect(() => {
    if (isOpen) {
      getUserLanguage();
    }
  }, [isOpen, getUserLanguage]);

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

    try {
      const response = await axios.post(
        `${backendURL}/translate/`,
        { text: chatInput, from, to },
        { headers: { "Content-Type": "application/json" } }
      );
      const translated = response.data.translatedText;
      if (translated.startsWith("Error:")) {
        setChatHistory((prev) => [
          ...prev,
          { type: "bot", text: `Error: ${translated.replace("Error: ", "")}`, id: Date.now() + 1, from, to, userMessageId },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { type: "bot", text: translated, id: Date.now() + 1, from, to, userMessageId },
        ]);
      }
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { type: "bot", text: `Error: ${error.message}`, id: Date.now() + 1, from, to, userMessageId },
      ]);
    }
  }, [chatInput, from, to]);

  const handleLanguageChange = useCallback(async (msgId, newFrom, newTo) => {
    const message = chatHistory.find((msg) => msg.id === msgId);
    if (!message) return;

    let originalText;
    let originalFrom;
    if (message.type === "user") {
      originalText = message.text;
      originalFrom = newFrom || message.from;
    } else {
      const userMessage = chatHistory.find((m) => m.id === message.userMessageId);
      if (!userMessage) return;
      originalText = userMessage.text;
      originalFrom = userMessage.from;
    }

    try {
      const response = await axios.post(
        `${backendURL}/translate/`,
        { text: originalText, from: newFrom || originalFrom, to: newTo || message.to },
        { headers: { "Content-Type": "application/json" } }
      );
      const translated = response.data.translatedText;

      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.id === msgId
            ? {
                ...msg,
                from: newFrom || msg.from,
                to: newTo || msg.to,
                text: msg.type === "bot" ? translated : msg.text,
                error: translated.startsWith("Error:") ? translated.replace("Error: ", "") : null,
              }
            : msg
        )
      );
    } catch (error) {
      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.id === msgId
            ? { ...msg, from: newFrom || msg.from, to: newTo || msg.to, text: `Error: ${error.message}`, error: error.message }
            : msg
        )
      );
    }
  }, [chatHistory]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-0 z-50 w-96 right-0 h-full bg-white shadow-lg transform transition-transform duration-300 p-4 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ maxHeight: "100vh", overflowY: "auto", overflowX: "hidden" }}
      aria-label="Chat section"
    >
      <div className="flex justify-between border rounded-md p-1 px-2 items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-800">Chat</h2>
        <button
          className="text-gray-600 p-1 rounded hover:bg-gray-300"
          onClick={() => setIsOpen(false)}
          aria-label="Close chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
            />
          </svg>
        </button>
      </div>

      {(geoError || speechError) && (
        <div className="text-red-500 text-sm mb-2">{geoError || speechError}</div>
      )}

      <div className="flex border rounded-md bg-slate-100 flex-col h-[calc(100%-4rem)]">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-2 space-y-4"
        >
          {chatHistory.length === 0 ? (
            <p className="text-gray-500">Start chatting...</p>
          ) : (
            chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="max-w-[80%]">
                  <div className="text-xs text-gray-600 mb-1">
                    {msg.type === "user" ? (
                      <div className="flex-1">
                        <select
                          id={`from-${msg.id}`}
                          value={msg.from}
                          onChange={(e) => handleLanguageChange(msg.id, e.target.value, null)}
                          className="w-full p-1 border rounded-lg focus:outline-none text-xs"
                        >
                          {languages.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <select
                          id={`to-${msg.id}`}
                          value={msg.to}
                          onChange={(e) => handleLanguageChange(msg.id, null, e.target.value)}
                          className="w-full p-1 border rounded-lg focus:outline-none text-xs"
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
                    className={`px-2 py-1 rounded-lg ${
                      msg.type === "user"
                        ? "bg-purple-100 text-purple-900"
                        : "bg-slate-200 text-gray-900"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-2 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg focus:outline-none"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              aria-label="Chat input"
            />
            <button
              onClick={() => (isListening ? stopSpeechRecognition() : startSpeechRecognition())}
              className={`p-2 rounded-lg text-white ${
                isListening ? "bg-red-600 hover:bg-red-700" : "bg-purple-800 hover:bg-purple-900"
              }`}
              aria-label={isListening ? "Stop microphone" : "Start microphone"}
            >
              {isListening ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              onClick={handleSendMessage}
              className="p-2 bg-purple-800 text-white rounded-lg hover:bg-purple-900"
              aria-label="Send message"
            >
              <IoMdSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;