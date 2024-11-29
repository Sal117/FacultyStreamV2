// src/components/Button.tsx

import React from "react";
import "./Button.css";

interface ButtonProps {
  text: string; // The button's display text
  onClick?: () => void; // Click handler
  type?: "button" | "submit" | "reset"; // Button type
  disabled?: boolean; // Disabled state
  className?: string; // Additional CSS classes
  style?: React.CSSProperties; // Optional inline styles
  variant?: "primary" | "secondary" | "danger" | "success" | "link"; // Button variants
  size?: "small" | "medium" | "large"; // Button sizes
}

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  type = "button", // Default to "button"
  disabled = false, // Default to not disabled
  className = "", // Default to empty string
  style,
  variant = "primary", // Default variant
  size = "medium", // Default size
}) => {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
      style={style}
      aria-disabled={disabled}
    >
      {text}
    </button>
  );
};

export default Button;
