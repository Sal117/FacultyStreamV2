import React, { useState, useEffect } from "react";
import { formService } from "../../services/formService";
import { authService } from "../../services/authService";
import NotificationBanner from "../../components/NotificationBanner";
import LoadingSpinner from "../../components/LoadingSpinner";
import Card from "../../components/Card";
import Button from "../../components/Button";
import FormReview from "../../components/FormReview"; // Import FormReview component
import "../../styles/FacultyForms.css";

interface Form {
  formID: string;
  formType: string;
  submittedAt: Date;
  submittedBy: string;
  responsibleParty: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
}

const FacultyForms: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);

  useEffect(() => {
    const fetchFacultyForms = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch the current authenticated faculty user
        const user = await authService.getCurrentUser();
        if (!user || user.role !== "faculty") {
          setError("You are not authorized to view these forms.");
          return;
        }

        // Fetch forms assigned to the faculty member
        const fetchedForms = await formService.getFormsByResponsibleParty(
          user.uid
        );

        // Map the fetched data to the form structure
        const mappedForms: Form[] = fetchedForms.map((form) => ({
          formID: form.formID,
          formType: form.formType,
          submittedAt: form.submittedAt.toDate(),
          submittedBy: form.submittedBy,
          responsibleParty: form.responsibleParty || "",
          status: form.status,
          comments: form.comments || "",
        }));

        setForms(mappedForms);
      } catch (err) {
        setError("Failed to load forms. Please try again later.");
        console.error("Error fetching forms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyForms();
  }, []);

  const handleDecision = async (
    formID: string,
    decision: "approved" | "rejected",
    comments?: string
  ) => {
    try {
      setLoading(true);
      setError("");

      // Update form status through the form service
      await formService.updateFormStatus(formID, decision, comments || "");

      // Remove the processed form from the list
      setForms(forms.filter((form) => form.formID !== formID));

      // Show success notification
      setNotification(`Form ${decision} successfully!`);
    } catch (error) {
      setError(`Failed to ${decision} form. Please try again.`);
      console.error(`Error ${decision} form:`, error);
    } finally {
      setLoading(false);
    }
  };

  const renderFormsList = () => {
    if (forms.length === 0) {
      return (
        <NotificationBanner
          type="info"
          message="No forms assigned to you."
          onClose={() => setNotification(null)}
        />
      );
    }

    return (
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
                  onClick={() => setSelectedForm({ ...form })}
                />
                <Button
                  text="Reject"
                  onClick={() => setSelectedForm({ ...form })}
                />
              </div>
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="faculty-forms-container">
      <h1>Assigned Forms</h1>

      {loading && <LoadingSpinner />}

      {!loading && error && (
        <NotificationBanner
          type="error"
          message={error}
          onClose={() => setError("")}
        />
      )}

      {!loading && !error && renderFormsList()}

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

      {notification && (
        <NotificationBanner
          type="success"
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default FacultyForms;
