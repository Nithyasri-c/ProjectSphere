


import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ChatPanel.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function to construct full file URL
const getFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  // File path from backend already starts with /uploads
  // Vite proxy will handle routing to backend
  return fileUrl.startsWith('http') ? fileUrl : fileUrl;
};

const ChatPanel = ({ batchId, teamMemberId, isOpen, onClose, onChatLoaded }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [guideInfo, setGuideInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  useEffect(() => {
    if (isOpen && batchId && teamMemberId) {
      fetchMessages();
      if (user.role === 'student') {
        fetchGuideInfo();
      }
      
      // Smart auto-refresh - only updates if message count changed
      const interval = setInterval(() => {
        checkForNewMessages();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, batchId, teamMemberId]);

  const checkForNewMessages = async () => {
    try {
      let response;
      if (user.role === 'guide') {
        response = await axios.get(`${API_URL}/chat/${batchId}/${teamMemberId}`);
      } else {
        response = await axios.get(`${API_URL}/chat/student/${batchId}/${teamMemberId}`);
      }
      
      if (response && response.data.data) {
        const newMessages = response.data.data.messages || [];
        // Only update if message count changed (prevent flickering)
        if (newMessages.length !== lastMessageCount) {
          setLastMessageCount(newMessages.length);
          setMessages(newMessages);
          setChatData(response.data.data);
          if (onChatLoaded) {
            onChatLoaded(response.data.data);
          }
        }
      }
    } catch (error) {
      console.error('Error checking messages:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      let response;
      if (user.role === 'guide') {
        response = await axios.get(`${API_URL}/chat/${batchId}/${teamMemberId}`);
      } else {
        response = await axios.get(`${API_URL}/chat/student/${batchId}/${teamMemberId}`);
      }
      
      if (response && response.data.data) {
        const msgs = response.data.data.messages || [];
        setLastMessageCount(msgs.length);
        setMessages(msgs);
        setChatData(response.data.data);
        if (onChatLoaded) {
          onChatLoaded(response.data.data);
        }
      } else {
        setMessages([]);
        setChatData(null);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const fetchGuideInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/chat/guide-info/${batchId}`);
      setGuideInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching guide info:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    try {
      let fileUrl = null;
      let fileName = null;

      // Handle file upload
      if (selectedFile) {
        fileName = selectedFile.name;
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        try {
          const uploadResponse = await axios.post(`${API_URL}/chat/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          fileUrl = uploadResponse.data.fileUrl;
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          alert('File upload failed. Please try again.');
          return;
        }
      }

      const response = await axios.post(`${API_URL}/chat/send`, {
        batchId,
        teamMemberId,
        text: newMessage,
        fileUrl,
        fileName
      });

      if (response.data.success) {
        const msgs = response.data.data.messages || [];
        setLastMessageCount(msgs.length);
        setMessages(msgs);
        setChatData(response.data.data);
        if (onChatLoaded) {
          onChatLoaded(response.data.data);
        }
        setNewMessage('');
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Chat</h3>
          {guideInfo && user.role === 'student' && (
            <span style={{ fontSize: '12px', opacity: 0.9 }}>Guide: {guideInfo.name}</span>
          )}
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="messages-container">
        {messages.length === 0 && !loading && (
          <div className="no-messages">No messages yet. Start a conversation!</div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.senderType}`}>
            <div className="message-header">
              <strong>{msg.senderName}</strong>
              <span className="timestamp">
                {new Date(msg.timestamp).toLocaleString()}
              </span>
            </div>
            {msg.text && <p className="message-text">{msg.text}</p>}
            {msg.fileName && msg.fileUrl && (
              <div className="file-actions">
                <button 
                  onClick={() => {
                    const fileUrl = getFileUrl(msg.fileUrl);
                    // Open file in new tab without refreshing current page
                    window.open(fileUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="file-link file-view"
                  title="View document"
                >
                  👁️ View
                </button>
                <a 
                  href={getFileUrl(msg.fileUrl)}
                  className="file-link file-download" 
                  download={msg.fileName}
                  title="Download document"
                >
                  ⬇️ Download
                </a>
                <span className="file-name">📎 {msg.fileName}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <form className="message-form" onSubmit={handleSendMessage}>
        <div className="input-group">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="message-input"
          />
          <label className="file-input-label">
            📎
            <input
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>
          <button type="submit" className="send-btn">Send</button>
        </div>
        {selectedFile && (
          <div className="selected-file">
            📁 {selectedFile.name}
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="remove-file"
            >
              ✕
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatPanel;
