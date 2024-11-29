// src/pages/admin/AdminForms.tsx
import { Timestamp } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { formService } from "../../services/formService";
import NotificationBanner from "../../components/NotificationBanner";
import LoadingSpinner from "../../components/LoadingSpinner";
import Card from "../../components/Card";
import Button from "../../components/Button";
import FormReview from "../../components/FormReview";
import FormCreate from "../../components/FormCreate"; // Reuse FormCreate component for editing
import FormTemplateList from "../../components/FormTemplateList"; // Reuse FormTemplateList component
import "../../styles/AdminForms.css";
import {
  FormTemplate,
  SubmittedFormData,
  NotificationPayload,
  SubmittedForm,
  User,
} from "../../components/types";

const AdminForms: React.FC = () => {
  const [forms, setForms] = useState<SubmittedForm[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedForm, setSelectedForm] = useState<{
    form: SubmittedForm;
    template: FormTemplate;
  } | null>(null);
  const [notification, setNotification] = useState<NotificationPayload | null>(
    null
  );

  // State to trigger refresh of form templates after creation or update
  const [refreshFormTemplates, setRefreshFormTemplates] =
    useState<boolean>(false);

  // User cache to store user details and avoid redundant fetches
  const [userCache, setUserCache] = useState<{ [key: string]: User }>({});

  useEffect(() => {
    const fetchFormsAndTemplates = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch all pending forms
        const fetchedForms = await formService.getAllPendingForms();
        const formattedForms: SubmittedForm[] = fetchedForms.map((form) => ({
          ...form,
          submittedAt:
            form.submittedAt instanceof Date
              ? form.submittedAt
              : (form.submittedAt as Timestamp).toDate(),
        }));
        setForms(formattedForms);

        // Fetch all form templates
        const templates = await formService.getAllFormTemplates();
        setFormTemplates(templates);

        // Extract unique user IDs for 'submittedBy' and 'responsibleParties'
        const uniqueUserIds = new Set<string>();
        formattedForms.forEach((form) => {
          uniqueUserIds.add(form.submittedBy);
          form.responsibleParties.forEach((uid) => uniqueUserIds.add(uid));
        });
        templates.forEach((template) => {
          uniqueUserIds.add(template.createdBy);
          template.responsibleParties.forEach((uid) => uniqueUserIds.add(uid));
        });

        // Fetch user details and cache them
        const fetchedUsers: { [key: string]: User } = { ...userCache };
        for (const uid of uniqueUserIds) {
          if (!fetchedUsers[uid]) {
            const user = await formService.getUserById(uid);
            if (user) {
              fetchedUsers[uid] = user;
            }
          }
        }
        setUserCache(fetchedUsers);
      } catch (err) {
        setError("Failed to load forms or form templates. Please try again.");
        console.error("Error fetching forms or templates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFormsAndTemplates();
  }, [refreshFormTemplates]); // Re-fetch when refreshFormTemplates changes

  // Handle approving or rejecting a form
  const handleDecision = async (
    formID: string,
    decision: "approved" | "rejected",
    comments: string
  ) => {
    try {
      await formService.updateFormStatus(formID, decision, comments);

      // Find the form to get 'submittedBy'
      const form = forms.find((f) => f.formID === formID);
      if (!form) {
        setError("Form not found.");
        return;
      }

      // Remove the form from the state
      setForms((prevForms) =>
        prevForms.filter((form) => form.formID !== formID)
      );

      // Set the notification with recipientId as the form submitter
      setNotification({
        id: formID, // Using formID as a unique identifier
        type: "success",
        message: `Form ${decision} successfully!`,
        timestamp: new Date(),
        recipientId: form.submittedBy, // Assuming 'submittedBy' is the recipient
        relatedFormId: formID,
      });

      // Optionally, refresh userCache if needed
    } catch (err) {
      setError(`Failed to ${decision} form. Please try again.`);
      console.error(`Error ${decision} form:`, err);
    }
  };

  // Handle selecting a form to review
  const handleSelectForm = async (form: SubmittedForm) => {
    try {
      // Fetch the corresponding form template using formTemplateId
      const template = formTemplates.find((t) => t.id === form.formTemplateId);
      if (!template) {
        setError("Form template not found.");
        return;
      }
      setSelectedForm({ form, template });
    } catch (err) {
      setError("Failed to fetch form template.");
      console.error("Error fetching form template:", err);
    }
  };

  // Close the form review modal
  const handleCloseFormReview = () => {
    setSelectedForm(null);
  };

  // Refresh form templates after creation or update
  const handleFormCreated = () => {
    setRefreshFormTemplates((prev) => !prev);
  };

  return (
    <div className="admin-forms-container">
      <h1>Admin Management Forms</h1>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Display Error Notification */}
          {error && (
            <NotificationBanner
              notification={{
                id: "error", // Assign a unique ID or generate one as needed
                type: "error",
                message: error,
                timestamp: new Date(),
                recipientId: "admin", // Set to admin's userId or a default identifier
              }}
              onClose={() => setError("")}
            />
          )}

          {/* Display Success/Error Notifications */}
          {notification && (
            <NotificationBanner
              notification={notification}
              onClose={() => setNotification(null)}
            />
          )}

          {/* Section: Manage Submitted Forms */}
          <section className="submitted-forms-section">
            <h2>Pending Submitted Forms</h2>
            {forms.length > 0 ? (
              <div className="forms-list">
                {forms.map((form) => (
                  <Card
                    key={form.formID}
                    title={form.formType}
                    description={`Submitted by: ${
                      userCache[form.submittedBy]
                        ? userCache[form.submittedBy].name
                        : form.submittedBy
                    } on ${form.submittedAt.toLocaleDateString()}`}
                    extra={
                      <div className="form-actions">
                        <Button
                          text="Review"
                          onClick={() => handleSelectForm(form)}
                          variant="primary"
                          size="small"
                        />
                      </div>
                    }
                  />
                ))}
              </div>
            ) : (
              <NotificationBanner
                notification={{
                  id: "no-forms",
                  type: "info",
                  message: "No pending forms to review.",
                  timestamp: new Date(),
                  recipientId: "admin", // Set to admin's userId or a default identifier
                }}
                onClose={() => setNotification(null)}
              />
            )}
          </section>

          {/* Divider */}
          <hr className="divider" />

          {/* Section: Create New Form Template */}
          <section className="create-form-template-section">
            <h2>Create New Form Template</h2>
            <FormCreate onFormCreated={handleFormCreated} />
          </section>

          {/* Divider */}
          <hr className="divider" />

          {/* Section: Manage Existing Form Templates */}
          <section className="manage-form-templates-section">
            <h2>Manage Existing Form Templates</h2>
            <FormTemplateList refresh={refreshFormTemplates} />
          </section>
        </>
      )}

      {/* Modal: Review Form */}
      {selectedForm && (
        <FormReview
          formId={selectedForm.form.formID}
          formData={{
            ...selectedForm.form,
            formType: selectedForm.form.formType,
            submittedAt: selectedForm.form.submittedAt,
          }}
          formTemplate={selectedForm.template}
          onDecision={(decision: "approved" | "rejected", comments: string) => {
            handleDecision(selectedForm.form.formID, decision, comments);
            setSelectedForm(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminForms;
