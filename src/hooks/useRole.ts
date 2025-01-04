import React, { useContext } from "react";
import { RoleContext } from "../context/RoleContext";  // Importing RoleContext

export const useRole = () => {
  const context = useContext(RoleContext);  // Using the imported RoleContext

  if (context === undefined || context === null) {
    throw new Error('useRole must be used within a RoleProvider');
  }

  return context.role;  // Accessing 'role' property from the context
}
