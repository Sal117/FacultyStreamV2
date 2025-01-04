import React from "react";
import html2pdf from "html2pdf.js"; // Import the library
import printableFormCSS from "./PrintableFormStyles"; // Import the updated CSS string

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
  // Handle print functionality
  const handlePrint = () => {
    const printContent = document.getElementById(contentId);

    if (printContent) {
      const clonedContent = printContent.cloneNode(true) as HTMLElement;

      const printableForm = clonedContent.querySelector(".printable-form");
      if (!printableForm) {
        alert("Unable to find the printable form. Please try again.");
        return;
      }

      const contentHTML = printableForm.outerHTML;
      const printWindow = window.open("", "_blank", "height=800,width=800");

      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Preview</title>
              <style>${printableFormCSS}</style>
            </head>
            <body>${contentHTML}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      } else {
        alert("Unable to open the print window. Please try again.");
      }
    } else {
      alert(`Content with ID "${contentId}" not found.`);
    }
  };

  // Handle download functionality
  const handleDownload = () => {
    const printContent = document.getElementById(contentId);

    if (printContent) {
      const options = {
        margin: 0.5,
        filename: "form.pdf", // Default file name
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 }, // Improve resolution
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };

      const clonedContent = printContent.cloneNode(true) as HTMLElement;
      const printableForm = clonedContent.querySelector(".printable-form");

      if (!printableForm) {
        alert("Unable to find the printable form. Please try again.");
        return;
      }

      html2pdf().set(options).from(printableForm).save(); // Download the form as a PDF
    } else {
      alert(`Content with ID "${contentId}" not found.`);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        marginTop: "10px",
      }}
    >
      <button
        onClick={handlePrint}
        style={{
          padding: "10px 20px",
          backgroundColor: "#3498db",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          width: "100%", // Ensure buttons are uniform in size
          ...buttonStyle,
        }}
        className="print-button"
      >
        {buttonLabel}
      </button>
      <button
        onClick={handleDownload}
        style={{
          padding: "10px 20px",
          backgroundColor: "#2ecc71",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          width: "100%", // Ensure buttons are uniform in size
          ...buttonStyle,
        }}
        className="download-button"
      >
        Download PDF
      </button>
    </div>
  );
};

export default SimplePrintTest;
