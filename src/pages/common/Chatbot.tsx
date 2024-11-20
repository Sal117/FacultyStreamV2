import React, { useState } from "react";
import "../../styles/Chatbot.css";
import { openaiService } from "../../services/openaiService";
import Sidebar from "../../components/Sidebar";
const Chatbot: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    []
  );

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { sender: "user", text: input };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    try {
      const response = await openaiService.getChatbotResponse(input);
      const aiMessage = { sender: "bot", text: response };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error getting chatbot response:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "bot",
          text: "Sorry, I encountered an issue processing your request.",
        },
      ]);
    }

    setInput(""); // Clear input
  };

  return (
    <div className="chatbot-wrapper">
      <div className="chatbot-container">
        <div className="chatbot-header">AI Chatbot</div>
        <div className="chatbot-messages">
          {messages.map((message, index) => (
            <div key={index} className={`chatbot-message ${message.sender}`}>
              <span>{message.text}</span>
            </div>
          ))}
        </div>
        <div className="chatbot-input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="chatbot-input"
          />
          <button onClick={handleSendMessage} className="chatbot-send-btn">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
