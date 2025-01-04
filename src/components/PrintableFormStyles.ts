// src/components/PrintableFormStyles.ts

const printableFormCSS = `
/* src/components/PrintableForm.css */

/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

/* General Styles */
.printable-form {
  font-family: 'Roboto', Arial, sans-serif;
  padding: 40px;
  background-color: #fff;
  color: #333;
  max-width: 800px;
  margin: auto;
  border: 1px solid #ddd;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
}

/* Header Styling */
.printable-header {
  background-color: #e72d20;;
  color: #fff;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 5px 5px 0 0;
}

.header-images {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.university-logo,
.icsdi-logo {
  width: 120px;
  height: auto;
}

.form-title {
  flex: 1;
  font-size: 28px;
  text-transform: uppercase;
  text-align: center;
  margin: 0 20px;
  color: #fff;
}

/* Main Content Styling */
.printable-main {
  margin-bottom: 30px;
}

.student-data,
.faculty-feedback {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.student-data h2,
.faculty-feedback h2 {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 15px;
}

/* Table Styling */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.data-table th,
.data-table td {
  padding: 12px 15px;
  border: 1px solid #ddd;
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  background-color: #e72d20;;
  color: #fff;
  font-weight: 500;
}

.data-table tr:nth-child(even) {
  background-color: #f2f2f2;
}

.data-table tr:hover {
  background-color: #eaeaea;
}

/* Footer Styling */
.printable-footer {
  background-color: #e72d20;;
  color: #fff;
  text-align: center;
  border-top: 1px solid #ddd;
  padding: 20px;
  font-size: 14px;
  border-radius: 0 0 5px 5px;
}

.footer-images {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

.faculty-stamp,
.icsdi-logo-footer {
  width: 120px;
  height: auto;
  margin: 0 10px;
}

/* Section Separator */
.section-separator {
  height: 2px;
  background-color: #e72d20;;
  margin: 20px 0;
}

/* Print Styles */
@media print {
  body {
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
  }

  .printable-form {
    border: none;
    box-shadow: none;
    margin: 0;
    width: auto;
    padding: 30px;
    background-color: #fff;
    color: #333;
  }

  .printable-header,
  .printable-footer {
    background-color: #e72d20 !important;
    color: #fff !important;
  }

  /* Hide Print Button */
  .print-button {
    display: none;
  }

  /* Page Breaks */
  .page-break {
    page-break-before: always;
  }
}

/* Responsive Styles */
@media (max-width: 600px) {
  .printable-form {
    padding: 20px;
  }

  .form-title {
    font-size: 24px;
  }

  .data-table th,
  .data-table td {
    padding: 8px 10px;
  }

  .header-images,
  .footer-images {
    flex-direction: column;
  }
    
  .status {
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: bold;
  text-align: center;
  color: #fff;
  background-color: #2ecc71; /* Approved color */
}

  .university-logo,
  .icsdi-logo,
  .faculty-stamp,
  .icsdi-logo-footer {
    width: 100px;
    margin: 10px 0;
  }
}
 `;

export default printableFormCSS;
