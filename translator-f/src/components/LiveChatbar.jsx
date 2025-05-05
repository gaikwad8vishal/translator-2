import React, { useState, useEffect, useRef, useCallback } from "react";
import { IoMdSend } from "react-icons/io";
import { Mic, MicOff, LogOut } from "lucide-react";
import axios from "axios";
import useSpeech from "../pages/Home";
import { useGeolocation } from "../components/languagebylocation";

// Use environment variable for WebSocket and Backend URL
const socketURL = import.meta.env.VITE_WEBSOCKET_URL || "wss://translator-2-2.onrender.com";
const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

// Available languages for translation
const languages = [
  { code: "as", name: "Assamese" },
  { code: "bn", name: "Bengali" },
  { code: "brx", name: "Bodo" },
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

const LiveChatSidebar = ({ isOpen, setIsOpen }) => {
  const [socket, setSocket] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [createRoomInput, setCreateRoomInput] = useState("");
  const [joinRoomInput, setJoinRoomInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [from, setFrom] = useState("en"); // User's input language
  const [to, setTo] = useState("mr"); // User's preferred display language
  const [detectedLanguage, setDetectedLanguage] = useState("hi"); // Detected language from geolocation
  const [isLanguageManuallySet, setIsLanguageManuallySet] = useState(false); // Track manual language selection
  const chatContainerRef = useRef(null);
  const sidebarRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = useRef(1000);
  const clientId = useRef(Date.now().toString());

  // Speech recognition and geolocation hooks
  const { isListening, startSpeechRecognition, stopSpeechRecognition, error: speechError, setError: setSpeechError } = useSpeech(
    from,
    (transcript) => setChatInput((prev) => prev + transcript)
  );
  const { getUserLanguage, error: geoError, setError: setGeoError } = useGeolocation(
    (lang) => {
      if (!isLanguageManuallySet) {
        setFrom(lang);
        setTo(lang);
        setDetectedLanguage(lang);
      }
    },
    setDetectedLanguage
  );

  // Translate a message
  const translateMessage = useCallback(
    async (text, clientId, from, to, roomId, timestamp, isMyMessage) => {
      try {
        const response = await axios.post(
          `${backendURL}/translate/`,
          { text, from, to },
          { headers: { "Content-Type": "application/json" } }
        );
        const translated = response.data.translatedText;

        setChatMessages((prev) => {
          const messageExists = prev.find((msg) => msg.id === timestamp && msg.clientId === clientId);
          if (messageExists) {
            // Update existing message
            return prev.map((msg) =>
              msg.id === timestamp && msg.clientId === clientId
                ? {
                    ...msg,
                    content: translated,
                    from,
                    to,
                    error: translated.startsWith("Error:") ? translated.replace("Error: ", "") : null,
                  }
                : msg
            );
          }
          // Add new message
          return [
            ...prev,
            {
              type: "message",
              content: translated,
              clientId,
              roomId,
              timestamp,
              from,
              to,
              id: timestamp,
              originalText: text,
              error: translated.startsWith("Error:") ? translated.replace("Error: ", "") : null,
            },
          ];
        });
      } catch (error) {
        setChatMessages((prev) => {
          const messageExists = prev.find((msg) => msg.id === timestamp && msg.clientId === clientId);
          if (messageExists) {
            // Update existing message with error
            return prev.map((msg) =>
              msg.id === timestamp && msg.clientId === clientId
                ? {
                    ...msg,
                    content: `Error: ${error.message}`,
                    from,
                    to,
                    error: error.message,
                  }
                : msg
            );
          }
          // Add new error message
          return [
            ...prev,
            {
              type: "message",
              content: `Error: ${error.message}`,
              clientId,
              roomId,
              timestamp,
              from,
              to,
              id: timestamp,
              error: error.message,
              originalText: text,
            },
          ];
        });
      }
    },
    []
  );

  // Call getUserLanguage when sidebar opens, but only if language hasn't been manually set
  useEffect(() => {
    if (isOpen && !isLanguageManuallySet) {
      getUserLanguage();
    }
  }, [isOpen, getUserLanguage, isLanguageManuallySet]);

  // Re-translate existing messages when 'to' language changes
  useEffect(() => {
    if (chatMessages.length > 0) {
      chatMessages.forEach((msg) => {
        if (msg.type === "message" && msg.clientId !== clientId.current) {
          // Update translation for others' messages
          translateMessage(msg.originalText, msg.clientId, msg.from, to, msg.roomId, msg.timestamp, false);
        }
      });
    }
  }, [to, translateMessage, clientId]); // Removed chatMessages from dependencies

  // Initialize and manage WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    console.log("Initiating WebSocket connection to:", socketURL);
    const newSocket = new WebSocket(socketURL);

    newSocket.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      reconnectInterval.current = 1000;
      console.log("WebSocket connected successfully");
    };

    newSocket.onclose = (event) => {
      setIsConnected(false);
      console.log("WebSocket disconnected, code:", event.code, "reason:", event.reason);
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = reconnectInterval.current;
        console.log(`Attempting to reconnect in ${delay}ms... (Attempt ${reconnectAttempts.current + 1})`);
        setTimeout(() => {
          reconnectAttempts.current += 1;
          reconnectInterval.current *= 2;
          connectWebSocket();
        }, delay);
      } else {
        handleError("Failed to reconnect to chat server after multiple attempts.", true);
      }
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data);
        handleSocketMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
        handleError("Failed to process server message");
      }
    };

    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    setSocket(newSocket);
  }, [socket]);

  // Connect WebSocket when sidebar is open
  useEffect(() => {
    if (isOpen && !socket) {
      console.log("Sidebar opened, initiating WebSocket connection");
      connectWebSocket();
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("Closing WebSocket on component unmount");
        socket.close(1000, "Component unmount");
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isOpen, connectWebSocket, socket]);

  // Scroll chat container to the bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Close sidebar when clicking outside
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

  // Handle WebSocket messages
  const handleSocketMessage = (data) => {
    switch (data.type) {
      case "userJoined":
        addSystemMessage(`A user joined`);
        break;
      case "userLeft":
        addSystemMessage(`A user left`);
        break;
      case "message":
        // Translate incoming messages to user's preferred 'to' language
        translateMessage(data.content, data.clientId, data.from || "en", to, data.roomId, data.timestamp, data.clientId === clientId.current);
        break;
      case "error":
        console.log("Server error:", data.message);
        handleError(data.message);
        break;
      case "roomCreated":
        setCurrentRoomId(data.roomId);
        addSystemMessage(`Created room ${data.roomId}`);
        console.log("Room created successfully:", data.roomId);
        break;
      case "roomJoined":
        setCurrentRoomId(data.roomId);
        addSystemMessage(`Joined room ${data.roomId}`);
        console.log("Room joined successfully:", data.roomId);
        break;
      default:
        console.log("Unknown WebSocket message type:", data);
    }
  };

  // Add system message to chat
  const addSystemMessage = (text) => {
    setChatMessages((prev) => [
      ...prev,
      { type: "system", text, timestamp: Date.now() },
    ]);
  };

  // Handle errors
  const handleError = (message, persistent = false) => {
    setError(message);
    if (!persistent) {
      setTimeout(() => setError(""), 5000);
    }
    console.error("Error:", message);
  };

  // Create a new chat room
  const createRoom = useCallback(() => {
    if (!socket || !isConnected) {
      handleError("Not connected to the server");
      return;
    }
    const roomId = createRoomInput.trim() || `room-${Date.now()}`;
    socket.send(JSON.stringify({ type: "createRoom", roomId }));
    setCreateRoomInput("");
    console.log("Sent createRoom request:", { roomId });
  }, [socket, isConnected, createRoomInput]);

  // Join an existing chat room
  const joinRoom = useCallback(() => {
    if (!socket || !isConnected) {
      handleError("Not connected to the server");
      return;
    }
    if (!joinRoomInput.trim()) {
      handleError("Room ID cannot be empty");
      return;
    }
    const roomId = joinRoomInput.trim();
    socket.send(JSON.stringify({ type: "joinRoom", roomId }));
    setJoinRoomInput("");
    console.log("Sent joinRoom request:", { roomId });
  }, [socket, isConnected, joinRoomInput]);

  // Leave the current chat room
  const leaveRoom = useCallback(() => {
    if (!socket || !isConnected || !currentRoomId) {
      handleError("Not connected or no room to leave");
      return;
    }
    socket.send(JSON.stringify({ type: "leaveRoom", roomId: currentRoomId }));
    setCurrentRoomId("");
    setChatMessages([]);
    addSystemMessage(`Left room ${currentRoomId}`);
    console.log("Sent leaveRoom request:", { roomId: currentRoomId });
  }, [socket, isConnected, currentRoomId]);

  // Send a chat message
  const handleSendMessage = useCallback(() => {
    if (!socket || !isConnected || !currentRoomId) {
      handleError("Not connected or no room selected");
      return;
    }
    if (!chatInput.trim()) return;

    const message = {
      type: "sendMessage",
      roomId: currentRoomId,
      content: chatInput,
      clientId: clientId.current,
      from: from, // Include sender's language
      timestamp: Date.now(),
    };
    socket.send(JSON.stringify(message));
    // Add the sender's message directly to chatMessages without translation
    setChatMessages((prev) => [
      ...prev,
      {
        type: "message",
        content: chatInput,
        clientId: clientId.current,
        roomId: currentRoomId,
        timestamp: message.timestamp,
        from,
        to: from, // Sender sees their own language
        id: message.timestamp,
        originalText: chatInput,
        error: null,
      },
    ]);
    setChatInput("");
    console.log("Sent message:", message);
  }, [socket, isConnected, currentRoomId, chatInput, from]);

  // Handle language change for a message
  const handleLanguageChange = useCallback(
    async (msgId, newFrom, newTo) => {
      const message = chatMessages.find((msg) => msg.id === msgId);
      if (!message || message.type !== "message") return;

      const originalText = message.originalText;
      const from = newFrom || message.from;
      const to = newTo || message.to;

      try {
        const response = await axios.post(
          `${backendURL}/translate/`,
          { text: originalText, from, to },
          { headers: { "Content-Type": "application/json" } }
        );
        const translated = response.data.translatedText;

        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? {
                  ...msg,
                  from,
                  to,
                  content: translated,
                  error: translated.startsWith("Error:") ? translated.replace("Error: ", "") : null,
                }
              : msg
          )
        );
      } catch (error) {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? { ...msg, from, to, content: `Error: ${error.message}`, error: error.message }
              : msg
          )
        );
      }
    },
    [chatMessages]
  );

  // Handle manual language selection
  const handleManualFromChange = (e) => {
    setFrom(e.target.value);
    setIsLanguageManuallySet(true);
  };

  const handleManualToChange = (e) => {
    setTo(e.target.value);
    setIsLanguageManuallySet(true);
  };

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-0 z-50 w-96  right-0 h-full bg-white shadow-lg transform transition-transform duration-300 p-4 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ maxHeight: "100vh", overflowY: "auto", overflowX: "hidden" }}
      aria-label="Live chat sidebar"
    >
      <div className="flex justify-between border rounded-md p-1 px-2 items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-800">Live Chat</h2>
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Error Display */}
      {(error || speechError || geoError) && (
        <div className="text-red-500 text-sm mb-2">{error || speechError || geoError}</div>
      )}

      

      <div className="flex border rounded-md pb-4 bg-slate-100 flex-col h-[calc(100%-8rem)]">
        {!currentRoomId ? (
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={createRoomInput}
                onChange={(e) => setCreateRoomInput(e.target.value)}
                placeholder="Enter Room ID (or leave blank)"
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-800"
                aria-label="Create room ID input"
                disabled={!isConnected}
              />
              <button
                onClick={createRoom}
                className={`px-4 py-2 rounded-lg text-white ${
                  !isConnected ? "bg-gray-400 cursor-not-allowed" : "bg-purple-800 hover:bg-purple-900"
                }`}
                aria-label="Create room"
                disabled={!isConnected}
              >
                Create
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinRoomInput}
                onChange={(e) => setJoinRoomInput(e.target.value)}
                placeholder="Enter Room ID to Join"
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-800"
                aria-label="Join room ID input"
                disabled={!isConnected}
              />
              <button
                onClick={joinRoom}
                className={`px-4 py-2 rounded-lg text-white ${
                  !isConnected ? "bg-gray-400 cursor-not-allowed" : "bg-purple-800 hover:bg-purple-900"
                }`}
                aria-label="Join room"
                disabled={!isConnected}
              >
                Join
              </button>
            </div>
            <div className="text-sm">
              {isConnected ? (
                <span className="text-green-500">Connected to server</span>
              ) : (
                <span className="text-yellow-500">
                  {reconnectAttempts.current > 0
                    ? `Reconnecting... (Attempt ${reconnectAttempts.current})`
                    : "Connecting to server..."}
                </span>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="p-2 bg-gray-100 rounded-t-md flex justify-between items-center">
              <p className="text-sm text-gray-600">Room ID: {currentRoomId}</p>
              <button
                onClick={leaveRoom}
                className="p-1 text-red-600 rounded hover:bg-red-100"
                aria-label="Leave room"
                title="Leave Room"
              >
                <LogOut size={20} />
              </button>
            </div>
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-2 space-y-4"
            >
              {chatMessages.length === 0 ? (
                <p className="text-gray-500 text-center">Start chatting...</p>
              ) : (
                chatMessages.map((msg) => {
                  const isMyMessage = msg.type === "message" && msg.clientId === clientId.current;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[80%]">
                        {msg.type === "system" ? (
                          <p className="text-xs text-gray-500 italic text-center">{msg.text}</p>
                        ) : (
                          <div>
                            <div className="text-xs text-gray-600 mb-1">
                              {isMyMessage ? (
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
                              ) : (
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
                              )}
                            </div>
                            <div
                              className={`px-2 py-1 rounded-lg ${
                                isMyMessage
                                  ? "bg-purple-100 text-purple-900"
                                  : "bg-slate-200 text-gray-900"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-2 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-800"
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
                  <IoMdSend size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveChatSidebar;