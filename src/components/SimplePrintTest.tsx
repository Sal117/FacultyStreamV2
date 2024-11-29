// src/components/SimplePrintTest.tsx

import React from "react";
import printableFormCSS from "./PrintableForm.css";

interface SimplePrintTestProps {
  contentId: string;
  buttonLabel?: string;
  buttonStyle?: React.CSSProperties;
}

const SimplePrintTest: React.FC<SimplePrintTestProps> = ({
  contentId,
  buttonLabel = "Print",
  buttonStyle,
}) => {
  const handlePrint = () => {
    const printContent = document.getElementById(contentId);

    if (printContent) {
      const clonedContent = printContent.cloneNode(true) as HTMLElement;
      const contentHTML = clonedContent.outerHTML;

      const printWindow = window.open("", "_blank", "height=800,width=800");

      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Preview</title>
              <style>
                ${printableFormCSS}
              </style>
            </head>
            <body>
              ${contentHTML}
            </body>
          </html>
        `);
        printWindow.document.close();

        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        };
      } else {
        console.error("Failed to open the print window.");
        alert(
          "Unable to open the print window. Please check your browser settings."
        );
      }
    } else {
      console.error(`Element with ID "${contentId}" not found!`);
      alert(`Unable to find the content to print. Please try again.`);
    }
  };

  return (
    <button
      onClick={handlePrint}
      style={{
        padding: "10px 20px",
        backgroundColor: "#3498db",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        ...buttonStyle,
      }}
      className="print-button"
    >
      {buttonLabel}
    </button>
  );
};

export default SimplePrintTest;
