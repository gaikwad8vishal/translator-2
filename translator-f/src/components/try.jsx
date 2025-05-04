import React, { useState, useEffect, useRef } from 'react';

function Baboo() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const websocket = useRef(null);

  useEffect(() => {
    websocket.current = new WebSocket('ws://localhost:8080');

    websocket.current.onopen = () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    };

    websocket.current.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    };

    websocket.current.onmessage = event => {
      console.log('Received:', event.data);
      setMessages(prevMessages => [...prevMessages, `Received: ${event.data}`]);
    };

    websocket.current.onerror = error => {
      console.error('WebSocket error:', error);
    };

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
        websocket.current.close();
      }
    };
  }, []); // Empty dependency array ensures this runs only once after the initial render

  const handleSendMessage = () => {
    if (isConnected && newMessage.trim() !== '') {
      websocket.current.send(newMessage);
      setMessages(prevMessages => [...prevMessages, `Sent: ${newMessage}`]);
      setNewMessage('');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>WebSocket Chat</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', height: '300px', overflowY: 'auto' }}>
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={e => setNewMessage(e.target.value)}
        placeholder="Enter message"
      />
      <button onClick={handleSendMessage} disabled={!isConnected}>
        Send
      </button>
    </div>
  );
}

export default Baboo;