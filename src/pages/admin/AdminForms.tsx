import React, { useState, useEffect } from "react";
import { formService } from "../../services/formService";
import NotificationBanner from "../../components/NotificationBanner";
import LoadingSpinner from "../../components/LoadingSpinner";
import Card from "../../components/Card";
import Button from "../../components/Button";
import FormReview from "../../components/FormReview";
import "../../styles/AdminForms.css";

interface Form {
  formID: string;
  formType: string;
  submittedAt: Date; // Date type
  submittedBy: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
}

const AdminForms: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      try {
        const fetchedForms = await formService.getAllPendingForms();
        const formattedForms = fetchedForms.map((form) => ({
          ...form,
          submittedAt: form.submittedAt.toDate(), // Convert Timestamp to Date
        }));
        setForms(formattedForms);
      } catch (err) {
        setError("Failed to load forms. Please try again.");
        console.error("Error fetching forms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  const handleDecision = async (
    formID: string,
    decision: "approved" | "rejected",
    comments?: string
  ) => {
    try {
      await formService.updateFormStatus(formID, decision, comments || "");
      setForms(forms.filter((form) => form.formID !== formID));
      setNotification(`Form ${decision} successfully!`);
    } catch (error) {
      setError(`Failed to ${decision} form. Please try again.`);
      console.error(`Error ${decision} form:`, error);
    }
  };

  return (
    <div className="admin-forms-container">
      <h1>Manage Submitted Forms</h1>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <NotificationBanner
          type="error"
          message={error}
          onClose={() => setError("")}
        />
      ) : notification ? (
        <NotificationBanner
          type="success"
          message={notification}
          onClose={() => setNotification(null)}
        />
      ) : forms.length > 0 ? (
        <div className="forms-list">
          {forms.map((form) => (
            <Card
              key={form.formID}
              title={form.formType}
              description={`Submitted by: ${
                form.submittedBy
              } on ${form.submittedAt.toLocaleDateString()}`}
              extra={
                <div className="form-actions">
                  <Button
                    text="Approve"
                    onClick={() =>
                      setSelectedForm({
                        ...form,
                      })
                    }
                  />
                  <Button text="Reject" onClick={() => setSelectedForm(form)} />
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <NotificationBanner
          type="info"
          message="No forms to review at the moment."
          onClose={() => setNotification(null)}
        />
      )}

      {selectedForm && (
        <FormReview
          formId={selectedForm.formID}
          formData={{
            formType: selectedForm.formType,
            submittedBy: selectedForm.submittedBy,
            submittedAt: selectedForm.submittedAt.toLocaleDateString(),
            status: selectedForm.status,
          }}
          onDecision={(decision) => {
            handleDecision(
              selectedForm.formID,
              decision,
              selectedForm.comments
            );
            setSelectedForm(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminForms;
