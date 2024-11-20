import React, { useState, useEffect } from "react";
import "../../styles/HelpPage.css";

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

const HelpPage = () => {
  // Use the FAQ interface to type the initial state
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const response = await fetch("/path-to-faqs.json");
        const data = await response.json();
        setFaqs(data.faqs as FAQ[]); // Cast the data to FAQ[] when setting the state
      } catch (error) {
        console.error("Failed to load FAQs", error);
      }
    }

    fetchFaqs();
  }, []);

  return (
    <div>
      <h1>Help & FAQ</h1>
      <ul>
        {faqs.map((faq) => (
          <li key={faq.id}>
            <h2>{faq.question}</h2>
            <p>{faq.answer}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HelpPage;
