// src/components/ChatInput.tsx

import React, { useState } from "react";
import { sendMessage } from "../services/chatService";
import "./ChatInput.css";

interface ChatInputProps {
  conversationId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ conversationId }) => {
  const [messageContent, setMessageContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;

    setIsSending(true);
    try {
      await sendMessage(conversationId, messageContent);
      setMessageContent("");
    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally, display an error notification to the user
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-input">
      <textarea
        placeholder="Type your message..."
        value={messageContent}
        onChange={(e) => setMessageContent(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isSending || !conversationId}
      />
      <button
        onClick={handleSendMessage}
        disabled={isSending || !messageContent.trim() || !conversationId}
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
