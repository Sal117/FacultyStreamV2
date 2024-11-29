// src/components/UserList.tsx

import React, { useEffect, useState } from "react";
import { ChatUser } from "./types";
import { getAllChatUsers } from "../services/chatService";
import "./UserList.css";
import defaultAvatar from "../assets/images/profile_placeholder.webp"; // Adjust the path as needed

interface UserListProps {
  onSelectUser: (user: ChatUser) => void;
  currentUserId: string;
}

const UserList: React.FC<UserListProps> = ({ onSelectUser, currentUserId }) => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await getAllChatUsers();
        // Exclude the current user from the list
        const filteredUsers = allUsers.filter(
          (user) => user.userId !== currentUserId
        );
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [currentUserId]);

  return (
    <div className="user-list">
      <h3>Users</h3>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <ul>
        {users
          .filter((user) =>
            user.userName.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((user) => (
            <li key={user.userId} onClick={() => onSelectUser(user)}>
              <img
                src={user.avatarUrl || defaultAvatar}
                alt={`${user.userName}'s avatar`}
                className="avatar"
              />
              <div className="user-info">
                <span className="user-name">{user.userName}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default UserList;
