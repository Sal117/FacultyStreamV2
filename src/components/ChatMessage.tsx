// src/components/ChatMessage.tsx

import React from "react";
import { ChatMessage } from "./types";
import "./ChatMessage.css";
import defaultAvatar from "../assets/images/profile_placeholder.webp";

interface ChatMessageProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  isOwnMessage,
}) => {
  return (
    <div className={`chat-message ${isOwnMessage ? "own-message" : ""}`}>
      {!isOwnMessage && (
        <div className="avatar">
          <img
            src={message.senderAvatarUrl || defaultAvatar}
            alt={`${message.senderName}'s avatar`}
          />
        </div>
      )}
      <div className="message-content">
        {!isOwnMessage && <div className="username">{message.senderName}</div>}
        <div className="text">{message.content}</div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="attachments">
            {message.attachments.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Attachment {index + 1}
              </a>
            ))}
          </div>
        )}
        <div className="timestamp">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="reactions">
            {Object.entries(message.reactions).map(([reaction, count]) => (
              <span key={reaction} className="reaction">
                {reaction} {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageComponent;
