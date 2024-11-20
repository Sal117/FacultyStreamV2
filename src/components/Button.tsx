import React from "react";
import "./Button.css";

interface ButtonProps {
  text: string;
  onClick: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties; // Added style prop here
}

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  type = "button",
  disabled = false,
  style,
}) => {
  return (
    <button
      className="button"
      onClick={onClick}
      type={type}
      disabled={disabled}
      style={style} // Apply style prop here
    >
      {text}
    </button>
  );
};

export default Button;
