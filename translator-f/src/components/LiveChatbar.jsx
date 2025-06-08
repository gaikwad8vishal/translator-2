
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Mic, MicOff, ArrowLeft } from "lucide-react";
import { IoMdSend } from "react-icons/io";
import { languages } from "../components/constants";
import { useGeolocation } from "../components/languagebylocation";
import { useSpeech } from "../components/UseSpeech";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const wsURL = "ws://localhost:8080";

const LiveChatbar = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("User");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("hi");
  const [detectedLanguage, setDetectedLanguage] = useState("hi");
  const [ws, setWs] = useState(null);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const { getUserLanguage, error: geoError, setError: setGeoError } = useGeolocation(setTo, setDetectedLanguage);
  const { isListening, startSpeechRecognition, stopSpeechRecognition, error: speechError, setError: setSpeechError } = useSpeech(from, (transcript) => setChatInput((prev) => prev + transcript));

  // Check authentication status on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const storedUsername = localStorage.getItem("name") || "User";
      if (token && storedUsername !== "User") {
        setUsername(storedUsername);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUsername("User");
      }
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const websocket = new WebSocket(wsURL);
    setWs(websocket);

    websocket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    websocket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received WebSocket message:", message);

        switch (message.type) {
          case "roomCreated":
            setIsInRoom(true);
            setRoomId(message.roomId);
            break;
          case "roomJoined":
            setIsInRoom(true);
            setRoomId(message.roomId);
            break;
          case "message": {
            try {
              const response = await axios.post(
                `${backendURL}/translate/`,
                { text: message.content, from: "auto", to: detectedLanguage },
                { headers: { "Content-Type": "application/json" } }
              );
              const translated = response.data.translatedText;
              setChatHistory((prev) => [
                ...prev,
                {
                  type: "other",
                  text: translated,
                  id: Date.now(),
                  roomId: message.roomId,
                  timestamp: message.timestamp,
                  username: "Unknown",
                },
              ]);
            } catch (error) {
              setChatHistory((prev) => [
                ...prev,
                {
                  type: "error",
                  text: `Error translating message: ${error.message}`,
                  id: Date.now(),
                  roomId: message.roomId,
                  timestamp: message.timestamp,
                  username: "Unknown",
                },
              ]);
            }
            break;
          }
          case "userJoined":
            setChatHistory((prev) => [
              ...prev,
              {
                type: "system",
                textContent: `A user joined room ${message.roomId}`,
                id: Date.now(),
                roomId: message.roomId,
              },
            ]);
            break;
          case "userLeft":
            setChatHistory((prev) => [
              ...prev,
              {
                type: "system",
                textContent: `A user left room ${message.roomId}`,
                id: Date.now(),
                roomId: message.roomId,
              },
            ]);
            break;
          case "error":
            setChatHistory((prev) => [
              ...prev,
              {
                type: "error",
                text: message.textContent,
                id: Date.now(),
              },
            ]);
            break;
          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    websocket.onclose = () => {
      console.log("Disconnected from WebSocket server");
      setIsInRoom(false);
      setWs(null);
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      websocket.close();
    };
  }, []);

  // Get user language based on location
  useEffect(() => {
    getUserLanguage();
  }, [getUserLanguage]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Handle room creation
  const handleCreateRoom = () => {
    if (!roomId.trim()) {
      setChatHistory((prev) => [
        ...prev,
        { type: "error", text: "Room ID is required", id: Date.now() },
      ]);
      return;
    }
    if (!isAuthenticated) {
      setChatHistory((prev) => [
        ...prev,
        { type: "error", text: "Please log in to create a room", id: Date.now() },
      ]);
      navigate("/signin");
      return;
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "createRoom", roomId }));
    }
  };

  // Handle joining a room
  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      setChatHistory((prev) => [
        ...prev,
        { type: "error", text: "Room ID is required", id: Date.now() },
      ]);
      return;
    }
    if (!isAuthenticated) {
      setChatHistory((prev) => [
        ...prev,
        { type: "error", text: "Please log in to join a room", id: Date.now() },
      ]);
      navigate("/signin");
      return;
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "joinRoom", roomId }));
    }
  };

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || !isInRoom || !ws || ws.readyState !== WebSocket.OPEN) {
      setChatHistory((prev) => [
        ...prev,
        {
          type: "error",
          text: !chatInput.trim() ? "Message cannot be empty" : "Not connected to a room",
          id: Date.now(),
        },
      ]);
      return;
    }

    const messageId = Date.now();
    const timestamp = new Date().toISOString();
    setChatHistory((prev) => [
      ...prev,
      { type: "user", text: chatInput, id: messageId, roomId, timestamp, username, from, to: detectedLanguage },
    ]);

    ws.send(
      JSON.stringify({
        type: "sendMessage",
        roomId,
        content: chatInput,
        timestamp,
      })
    );
    setChatInput("");
  }, [chatInput, isInRoom, ws, roomId, username, from, detectedLanguage]);

  // Handle sign-in redirection
  const handleSignIn = () => {
    navigate("/signin");
  };

  return (
    <div className="min-h-screen transition-all duration-500 bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900" style={{ overflowY: "auto" }} aria-label="Group chat section">
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
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Group Chat</h1>
            </div>
          </div>

          {(geoError || speechError) && (
            <div className="text-red-500 dark:text-red-400 text-xs sm:text-sm p-4 sm:p-6 max-w-4xl mx-auto">
              {geoError || speechError}
            </div>
          )}

          <div className="flex flex-col h-[calc(100vh-200px)] sm:h-[calc(100vh-220px)]">
            {!isAuthenticated ? (
              <div className="flex flex-col gap-4 p-6 sm:p-8 rounded-2xl backdrop-blur-sm border bg-white/40 dark:bg-gray-800/40 border-white/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-200">
                <h3 className="font-semibold text-sm sm:text-base">Authentication Required</h3>
                <p className="text-xs sm:text-sm">Please log in to access the group chat.</p>
                <button
                  onClick={handleSignIn}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 sm:h-10 px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  aria-label="Sign In"
                >
                  Sign In
                </button>
              </div>
            ) : !isInRoom ? (
              <div className="flex flex-col gap-4 p-6 sm:p-8 rounded-2xl backdrop-blur-sm border bg-white/40 dark:bg-gray-800/40 border-white/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-200">
                <h3 className="font-semibold text-sm sm:text-base">Join or Create a Room</h3>
                <div className="text-xs sm:text-sm">Logged in as: {username}</div>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter Room ID"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs sm:text-sm bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  aria-label="Room ID input"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateRoom}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 sm:h-10 px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    aria-label="Create room"
                  >
                    Create Room
                  </button>
                  <button
                    onClick={handleJoinRoom}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 sm:h-10 px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    aria-label="Join room"
                  >
                    Join Room
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Room: {roomId} | Username: {username} | Your Language: {languages.find((lang) => lang.code === detectedLanguage)?.name || detectedLanguage}
                </div>
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
                        <h3 className="font-semibold mb-2 text-sm sm:text-base">Start Your Group Chat</h3>
                        <p className="text-xs sm:text-sm">Type a message to begin the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    chatHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.type === "user" ? "justify-start" : msg.type === "other" ? "justify-end" : "justify-center"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] sm:max-w-[80%] text-xs sm:text-sm ${
                            msg.type === "user"
                              ? "bg-purple-600/80 border-purple-500/50 text-white rounded-lg px-2 py-1 sm:px-3 sm:py-2"
                              : msg.type === "other"
                              ? "bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 rounded-lg px-2 py-1 sm:px-3 sm:py-2"
                              : "text-gray-600 dark:text-gray-400 italic"
                          }`}
                        >
                          {msg.username && (
                            <div className="font-semibold text-xs opacity-90">{msg.username}</div>
                          )}
                          {msg.text || msg.textContent}
                          {msg.timestamp && (
                            <div className="text-xs opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border bg-white/60 dark:bg-gray-800/60 border-white/50 dark:border-gray-700/50">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <div className="flex-1">
                        <label htmlFor="from-lang" className="text-xs text-gray-600 dark:text-gray-400">
                          From:
                        </label>
                        <select
                          id="from-lang"
                          value={from}
                          onChange={(e) => setFrom(e.target.value)}
                          className="w-full p-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs sm:text-sm bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
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
                        <label htmlFor="to-lang" className="text-xs text-gray-600 dark:text-gray-400">
                          To:
                        </label>
                        <select
                          id="to-lang"
                          value={to}
                          onChange={(e) => setTo(e.target.value)}
                          className="w-full p-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs sm:text-sm bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                          aria-label="Select target language"
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
                          className="flex w-full rounded-md px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 min-h-[50px] sm:min-h-[60px] border-0 resize-none bg-white/70 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                          onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
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
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 sm:h-10 px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                          aria-label="Send message"
                        >
                          <IoMdSend className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveChatbar;
