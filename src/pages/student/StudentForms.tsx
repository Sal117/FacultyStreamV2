import React, { useState, useEffect } from "react";
import { formService } from "../../services/formService";
import NotificationBanner from "../../components/NotificationBanner";
import LoadingSpinner from "../../components/LoadingSpinner";
import Card from "../../components/Card";
import "../../styles/StudentForms.css";
import { Timestamp } from "firebase/firestore";
import { authService } from "../../services/authService";

interface Form {
  formID: string;
  formType: string;
  submittedAt: Date;
  submittedBy: string;
  responsibleParty?: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
}

const StudentForms: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchStudentForms = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch the currently authenticated user
        const user = await authService.getCurrentUser();
        if (!user) {
          setError("You are not logged in. Please log in to view your forms.");
          return;
        }

        // Fetch forms submitted by the logged-in user
        const fetchedForms = await formService.getSubmittedForms(user.uid);

        // Map the fetched data to the form structure
        const mappedForms: Form[] = fetchedForms.map((form) => ({
          formID: form.formID,
          formType: form.formType,
          submittedAt: (form.submittedAt as Timestamp).toDate(),
          submittedBy: form.submittedBy,
          responsibleParty: form.responsibleParty || "",
          status: form.status,
          comments: form.comments || "",
        }));

        setForms(mappedForms);
      } catch (err) {
        setError(
          "An error occurred while fetching your forms. Please try again later."
        );
        console.error("Error fetching forms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentForms();
  }, []);

  const getStatusClass = (status: string): string => {
    switch (status) {
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      case "pending":
        return "status-pending";
      default:
        return "";
    }
  };

  return (
    <div className="student-forms-container">
      <h1>Your Submitted Forms</h1>

      {loading && <LoadingSpinner />}

      {!loading && error && (
        <NotificationBanner
          type="error"
          message={error}
          onClose={() => setError("")}
        />
      )}

      {!loading && !error && forms.length > 0 && (
        <div className="forms-list">
          {forms.map((form) => (
            <Card
              key={form.formID}
              title={form.formType}
              description={`Submitted on ${form.submittedAt.toLocaleDateString()} | Status: `}
              extra={
                <>
                  <span className={`status ${getStatusClass(form.status)}`}>
                    {form.status}
                  </span>
                  {form.comments && (
                    <p className="comments">Comments: {form.comments}</p>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}

      {!loading && !error && forms.length === 0 && (
        <p className="no-forms">You have not submitted any forms yet.</p>
      )}
    </div>
  );
};

export default StudentForms;
