import React, { useState } from "react";
import "./Footer.css";

const Footer: React.FC = () => {
  const [isPrivacyOpen, setPrivacyOpen] = useState(false);
  const [isTermsOpen, setTermsOpen] = useState(false);
  const [isContactOpen, setContactOpen] = useState(false);

  const togglePrivacy = () => setPrivacyOpen(!isPrivacyOpen);
  const toggleTerms = () => setTermsOpen(!isTermsOpen);
  const toggleContact = () => setContactOpen(!isContactOpen);

  return (
    <footer className="footer">
      <p>&copy; 2024 ICSDI, UCSI University</p>
      <div className="footer-links">
        <div className="footer-link" onClick={togglePrivacy}>
          <span>Privacy Policy</span>
          {isPrivacyOpen && (
            <div className="footer-content">
              <h4>Privacy Policy</h4>
              <p>
                UCSI University respects your privacy and is committed to
                protecting your personal information. We collect data such as
                names, email addresses, and roles to provide personalized
                services such as scheduling appointments, managing documents,
                and user authentication. We ensure your information is stored
                securely and used in compliance with data protection laws in
                Malaysia.
              </p>
              <p>
                For any queries regarding your data, contact us at
                support@ucsi.edu.my.
              </p>
            </div>
          )}
        </div>

        <div className="footer-link" onClick={toggleTerms}>
          <span>Terms of Service</span>
          {isTermsOpen && (
            <div className="footer-content">
              <h4>Terms of Service</h4>
              <p>
                By using FacultyStream, you agree to abide by the following
                terms and conditions. You are responsible for maintaining the
                confidentiality of your login details and ensuring that you
                comply with the acceptable use policy. Unauthorized access,
                misuse, and damage to the system are prohibited. UCSI University
                is not responsible for any data loss, misuse, or damage caused
                by unauthorized activities.
              </p>
            </div>
          )}
        </div>

        <div className="footer-link" onClick={toggleContact}>
          <span>Contact</span>
          {isContactOpen && (
            <div className="footer-content">
              <h4>Contact Information</h4>
              <p>For general inquiries or feedback regarding FacultyStream:</p>
              <p>Email: support@ucsi.edu.my</p>
              <p>Phone: +60 3-9101 8888</p>
              <p>UCSI University, Kuala Lumpur, Malaysia</p>
              <p>
                You can also visit us on our social media profiles:
                <a
                  href="https://www.facebook.com/ucsiuniversity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook
                </a>
                ,
                <a
                  href="https://www.twitter.com/ucsiuniversity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter
                </a>
                ,
                <a
                  href="https://www.linkedin.com/school/ucsiuniversity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
