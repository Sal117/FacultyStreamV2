import React from "react";
import "./LoadingSpinner.css"; // Make sure to create a corresponding CSS file

const LoadingSpinner = ({ overlay = false }) => {
  return (
    <div className={overlay ? "spinner-overlay" : "spinner-container"}>
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner;
// Provides a visual indication of loading or processing state, configurable as an overlay or inline.
