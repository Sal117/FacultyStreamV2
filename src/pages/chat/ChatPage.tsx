// src/pages/chat/ChatPage.tsx

import React, { useEffect, useState, useRef } from "react";
import { ChatMessage, ChatUser, Conversation } from "../../components/types";
import {
  subscribeToConversationMessages,
  getOrCreateConversation,
  getConversationById,
} from "../../services/chatService";
import ChatMessageComponent from "../../components/ChatMessage";
import ChatInput from "../../components/ChatInput";
import UserList from "../../components/UserList";
import "../../styles/ChatPage.css";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Unsubscribe } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [conversationId, setConversationId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const conversationIdFromUrl = queryParams.get("conversationId");

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        // Handle unauthenticated state, e.g., redirect to login
        navigate("/login"); // Uncomment if using react-router's useNavigate
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [navigate]);

  useEffect(() => {
    let unsubscribeMessages: Unsubscribe | null = null;

    const setupConversation = async () => {
      if (currentUserId) {
        try {
          let conversation: Conversation | null = null;

          if (conversationIdFromUrl) {
            // Fetch the conversation by ID
            conversation = await getConversationById(conversationIdFromUrl);
            if (conversation) {
              setConversationId(conversation.conversationId);

              // Get the other participant's ID
              const otherUserId = conversation.participants.find(
                (id) => id !== currentUserId
              );

              if (otherUserId) {
                // Fetch the other user's data
                const userDoc = await getDoc(doc(db, "users", otherUserId));
                const userData = userDoc.data();
                if (userData) {
                  setSelectedUser({
                    userId: otherUserId,
                    userName: userData.name || "Anonymous",
                    avatarUrl: userData.profilePicture || "",
                    role: userData.role || "student",
                    lastSeen: userData.lastSeen?.toDate() || new Date(),
                  });
                }
              }
            } else {
              // If conversation not found, handle accordingly
              console.error("Conversation not found");
            }
          } else if (selectedUser) {
            // Get or create conversation with selected user
            conversation = await getOrCreateConversation(
              currentUserId,
              selectedUser.userId
            );
            setConversationId(conversation.conversationId);
          }

          if (conversation) {
            // Subscribe to messages in this conversation
            unsubscribeMessages = subscribeToConversationMessages(
              conversation.conversationId,
              (newMessages) => {
                setMessages(newMessages);
                scrollToBottom();
              }
            );
          }
        } catch (error) {
          console.error("Error setting up conversation:", error);
        }
      }
    };

    setupConversation();

    // Clean up function
    return () => {
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, [selectedUser, currentUserId, conversationIdFromUrl]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectUser = (user: ChatUser) => {
    setSelectedUser(user);
    setMessages([]);
    setConversationId("");
    // Remove any conversationId from URL
    navigate("/chat");
  };

  return (
    <div className="chat-page">
      <UserList onSelectUser={handleSelectUser} currentUserId={currentUserId} />
      <div className="chat-container">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <h3>Chat with {selectedUser.userName}</h3>
            </div>
            <div className="messages-container">
              {messages.map((message) => (
                <ChatMessageComponent
                  key={message.messageId}
                  message={message}
                  isOwnMessage={message.senderId === currentUserId}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput conversationId={conversationId} />
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
