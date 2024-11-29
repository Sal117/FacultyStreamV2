import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/HelpPage.css";
import LoadingSpinner from "../../components/LoadingSpinner";

const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Expanded FAQs
  const faqData = [
    {
      category: "Admissions",
      questions: [
        {
          question: "How do I apply to UCSI University?",
          answer: "You can apply online via the university's official website.",
        },
        {
          question: "What are the admission requirements?",
          answer:
            "Requirements vary by program; generally, completion of high school is required.",
        },
      ],
    },
    {
      category: "Courses",
      questions: [
        {
          question: "What programs are offered at ICSDI?",
          answer:
            "ICSDI offers programs in Computer Science, Software Engineering, and Data Science.",
        },
        {
          question: "How can I find course materials?",
          answer:
            "Course materials can be accessed through the Course Networking platform.",
        },
      ],
    },
    {
      category: "System Features",
      questions: [
        {
          question: "How do I book an appointment with a faculty member?",
          answer:
            "Go to the Appointments page, check available slots for your faculty member, and book your preferred time.",
        },
        {
          question: "How do I update my profile details?",
          answer:
            "Navigate to the Profile page and click on 'Edit Profile' to update your information.",
        },
        {
          question: "What facilities can I book in ICSDI faculty?",
          answer:
            "You can book one meeting room in the ICSDI faculty and eight discussion rooms in Block B.",
        },
      ],
    },
    {
      category: "Technical Support",
      questions: [
        {
          question: "Who do I contact for IT issues?",
          answer:
            "You can contact the IT helpdesk at ithelpdesk@ucsiuniversity.edu.my.",
        },
        {
          question: "How do I reset my password?",
          answer:
            "Go to the Profile page, select the password change option, and follow the instructions to reset your password.",
        },
      ],
    },
    {
      category: "General",
      questions: [
        {
          question: "Who do I contact for general inquiries?",
          answer: "For general inquiries, you can email support@ucsi.edu.my.",
        },
        {
          question: "How can I access the student portal?",
          answer:
            "Visit the student portal at https://iisv2.ucsiuniversity.edu.my/ and log in with your student credentials.",
        },
      ],
    },
  ];

  const filteredFAQs = faqData.map((section) => ({
    ...section,
    questions: section.questions.filter(
      (q) =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  return (
    <div className="help-page">
      {/* Header Section */}
      <header className="help-header">
        <h1 className="title">How Can We Help You?</h1>
        <strong>
          {" "}
          <p className="subtitle">
            Welcome to the FacultyStream Help Center! Find answers to your
            questions or navigate directly to system features.
          </p>
        </strong>
        <input
          type="text"
          className="search-bar"
          placeholder="Search for answers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </header>

      {/* Quick Links Section */}
      <section className="quick-links">
        <strong>
          {" "}
          <h2>Quick Links</h2>
        </strong>
        <div className="links-container">
          <button onClick={() => navigate("/appointments")}>
            Book an Appointment
          </button>
          <button onClick={() => navigate("/facilities-booking")}>
            Book a Facility
          </button>
          <button onClick={() => navigate("/profile")}>Update Profile</button>
          <button onClick={() => navigate("/chatbot")}>
            Chat with AI Assistant
          </button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <strong>
          {" "}
          <h2>Frequently Asked Questions</h2>
        </strong>
        {filteredFAQs.map((section, index) => (
          <div key={index} className="faq-category">
            <h3>{section.category}</h3>
            {section.questions.length > 0 ? (
              section.questions.map((q, idx) => (
                <details key={idx}>
                  <summary>{q.question}</summary>
                  <p>{q.answer}</p>
                </details>
              ))
            ) : (
              <p>No results found for this category.</p>
            )}
          </div>
        ))}
      </section>

      {/* Contact Support Section */}
      <section className="contact-support">
        <h2>Contact Support</h2>
        <p>If you need further assistance, please contact us:</p>
        <ul>
          <li>
            Email: <a href="mailto:support@ucsi.edu.my">support@ucsi.edu.my</a>
          </li>
          <li>Phone: +60 3-9101 8888</li>
        </ul>
        <p>
          Alternatively, use our{" "}
          <button onClick={() => navigate("/chatbot")}>
            Chat with AI Assistant
          </button>
        </p>
      </section>
    </div>
  );
};

export default HelpPage;
