import React from "react";
import "./LoadingSpinner.css";

const LoadingSpinner = ({ overlay = false }) => {
  return (
    <div className={overlay ? "spinner-overlay" : "spinner-container"}>
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner;
