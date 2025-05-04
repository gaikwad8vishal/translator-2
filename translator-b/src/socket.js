const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

// In-memory store for rooms
const rooms = new Map(); // Map<roomId, Set<ws>>

// Broadcast message to all users in a room
const broadcastToRoom = (roomId, message, excludeWs = null) => {
  const roomUsers = rooms.get(roomId);
  if (!roomUsers) return;
  roomUsers.forEach((ws) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
};

// Handle new WebSocket connections
wss.on("connection", (ws) => {
  console.log("New client connected");
  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log("Received message:", message);

      switch (message.type) {
        case "createRoom": {
          const { roomId } = message;
          if (!roomId || !roomId.trim()) {
            ws.send(JSON.stringify({ type: "error", message: "Room ID is required" }));
            return;
          }
          if (rooms.has(roomId)) {
            ws.send(JSON.stringify({ type: "error", message: "Room already exists" }));
            return;
          }
          rooms.set(roomId, new Set([ws]));
          console.log(`Room created: ${roomId}`);
          ws.send(JSON.stringify({ type: "roomCreated", roomId }));
          break;
        }

        case "joinRoom": {
          const { roomId } = message;
          if (!roomId || !roomId.trim()) {
            ws.send(JSON.stringify({ type: "error", message: "Room ID is required" }));
            return;
          }
          if (!rooms.has(roomId)) {
            ws.send(JSON.stringify({ type: "error", message: "Room does not exist" }));
            return;
          }
          const roomUsers = rooms.get(roomId);
          if (roomUsers.has(ws)) {
            ws.send(JSON.stringify({ type: "error", message: "User already in room" }));
            return;
          }
          roomUsers.add(ws);
          console.log(`A user joined room ${roomId}`);
          broadcastToRoom(roomId, { type: "userJoined", roomId }, ws);
          ws.send(JSON.stringify({ type: "roomJoined", roomId }));
          break;
        }

        case "sendMessage": {
          const { roomId, content, timestamp } = message;
          if (!roomId || !content || !timestamp || !rooms.has(roomId)) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid message data or room does not exist" }));
            return;
          }
          const roomUsers = rooms.get(roomId);
          if (!roomUsers.has(ws)) {
            ws.send(JSON.stringify({ type: "error", message: "User not in room" }));
            return;
          }
          const messageData = {
            type: "message",
            roomId,
            content,
            timestamp,
          };
          console.log(`Broadcasting message in room ${roomId}:`, messageData);
          
          // ✅ This now excludes the sender
          broadcastToRoom(roomId, messageData, ws);
          break;
        }
        

        default:
          ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    rooms.forEach((roomUsers, roomId) => {
      if (roomUsers.has(ws)) {
        roomUsers.delete(ws);
        broadcastToRoom(roomId, { type: "userLeft", roomId });
        if (roomUsers.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }
    });
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log("WebSocket server running on ws://localhost:8080");
