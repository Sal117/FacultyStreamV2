// src/components/PrintableForm.tsx

import React, { forwardRef, useEffect } from "react";
import { SubmittedForm, FormTemplate } from "./types";
import "./PrintableForm.css";
import stampImage from "../assets/stamp.svg";
import logoImage from "../assets/images/UcsiLogoPrint.png";
import logo2 from "../assets/images/logo-icsdi.png"; // Import the second logo

export interface PrintableFormProps {
  formData: SubmittedForm;
  formTemplate: FormTemplate;
}

const PrintableForm = forwardRef<HTMLDivElement, PrintableFormProps>(
  ({ formData, formTemplate }, ref) => {
    // Log the received props when they change
    useEffect(() => {
      console.log("PrintableForm Props Received:");
      console.log("Form Data:", formData);
      console.log("Form Template:", formTemplate);
    }, [formData, formTemplate]);

    // Log render occurrence
    console.log("Rendering PrintableForm with formData and formTemplate");

    return (
      <div ref={ref} className="printable-form">
        <header className="printable-header">
          <div className="header-images">
            <img
              src={logoImage}
              alt="University Logo"
              className="university-logo"
            />
            <h1 className="form-title">{formTemplate.name}</h1>
            <img src={logo2} alt="ICSDI Logo" className="icsdi-logo" />
          </div>
        </header>

        <main className="printable-main">
          <section className="student-data">
            <h2>Student Information</h2>
            <table className="data-table">
              <tbody>
                {formTemplate.studentFields &&
                  Object.keys(formTemplate.studentFields).map((key) => (
                    <tr key={key}>
                      <th>{formTemplate.studentFields[key].label}</th>
                      <td>{formData[key] || "N/A"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
          <div className="section-separator"></div> {/* Separator */}
          {formData.status === "approved" && formData.facultyData && (
            <section className="faculty-feedback">
              <h2>Faculty Feedback</h2>
              <table className="data-table">
                <tbody>
                  {formTemplate.facultyFields &&
                    Object.keys(formTemplate.facultyFields).map((key) => (
                      <tr key={key}>
                        <th>{formTemplate.facultyFields[key].label}</th>
                        <td>{formData.facultyData[key] || "N/A"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>
          )}
        </main>

        <footer className="printable-footer">
          <p>UCSI University | Faculty of ICSDI</p>
          <div className="footer-images">
            <img
              src={stampImage}
              alt="Faculty Stamp"
              className="faculty-stamp"
            />
            <img src={logo2} alt="ICSDI Logo" className="icsdi-logo-footer" />
          </div>
        </footer>
      </div>
    );
  }
);

export default React.memo(PrintableForm);
