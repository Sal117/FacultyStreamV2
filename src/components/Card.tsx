import React from "react";
import "./Card.css";

interface CardProps {
  title: string;
  description: string;
  status?: string;
  link?: string; // Optional link to more details
  extra?: React.ReactNode; // Optional extra text or component
  onClick?: () => void; // Optional click handler for the whole card
}

const Card: React.FC<CardProps> = ({
  title,
  description,
  status,
  link,
  extra,
  onClick,
}) => {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <h3>{title}</h3>
      <p>{description}</p>
      {extra && <div className="extra-info">{extra}</div>}
      <span className={`status ${status?.toLowerCase()}`}>{status}</span>
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
    </div>
  );
};

export default Card;
