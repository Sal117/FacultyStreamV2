// src/components/Card.tsx

import React from "react";
import "./Card.css";

interface CardProps {
  title: string;
  description: React.ReactNode; // Changed from string to React.ReactNode
  status?: string;
  link?: string; // Optional link to more details
  extra?: React.ReactNode; // Optional extra text or component
  onClick?: () => void; // Optional click handler for the whole card
  content?: React.ReactNode; // Added content property
  footer?: React.ReactNode; // Added footer property
}

const Card: React.FC<CardProps> = ({
  title,
  description,
  status,
  link,
  extra,
  onClick,
  content,
  footer,
}) => {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <h3>{title}</h3>
      <div className="description">{description}</div>{" "}
      {/* Changed from <p> to <div> */}
      {extra && <div className="extra-info">{extra}</div>}
      {status && (
        <span className={`status ${status.toLowerCase()}`}>{status}</span>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="card-link"
        >
          More Info
        </a>
      )}
      {content && <div className="content">{content}</div>}
      {footer && <div className="footer">{footer}</div>}
    </div>
  );
};

export default Card;
