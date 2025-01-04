// src/pages/admin/AdminForms.tsx

import { Timestamp } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { formService } from "../../services/formService";
import NotificationBanner from "../../components/NotificationBanner";
import LoadingSpinner from "../../components/LoadingSpinner";
import Card from "../../components/Card";
import Button from "../../components/Button";
import FormReview from "../../components/FormReview";
import FormCreate from "../../components/FormCreate";
import FormTemplateList from "../../components/FormTemplateList";
import "../../styles/AdminForms.css";
import {
  FormTemplate,
  SubmittedFormData,
  NotificationPayload,
  SubmittedForm,
  User,
} from "../../components/types";
import { toast } from "react-toastify";

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

  // Trigger refresh of form templates after creation, update, or deletion
  const [refreshFormTemplates, setRefreshFormTemplates] =
    useState<boolean>(false);

  // Cache user details to avoid redundant fetches
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

        // Extract unique user IDs
        const uniqueUserIds = new Set<string>();
        formattedForms.forEach((form) => {
          uniqueUserIds.add(form.submittedBy);
          form.responsibleParties.forEach((uid) => uniqueUserIds.add(uid));
        });
        templates.forEach((template) => {
          uniqueUserIds.add(template.createdBy);
          template.responsibleParties.forEach((uid) => uniqueUserIds.add(uid));
        });

        // Fetch user details for unique IDs
        const fetchedUsers: { [key: string]: User } = { ...userCache };
        for (const uid of uniqueUserIds) {
          if (!fetchedUsers[uid]) {
            try {
              const user = await formService.getUserById(uid);
              if (user) {
                fetchedUsers[uid] = user;
              } else {
                // Optionally notify if user not found
                toast.warn(`User with ID ${uid} not found.`, {
                  position: "top-right",
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                });
              }
            } catch (userErr) {
              console.error(`Error fetching user with ID ${uid}:`, userErr);
              // Show error toast for individual user fetch failure
              toast.error(`Failed to load user data for ID ${uid}.`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
            }
          }
        }
        setUserCache(fetchedUsers);
      } catch (err) {
        setError("Failed to load forms or form templates. Please try again.");
        console.error("Error fetching forms/templates:", err);
        // Show error toast
        toast.error(
          "Failed to load forms or form templates. Please try again.",
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFormsAndTemplates();
  }, [refreshFormTemplates]);

  const handleDecision = async (
    formID: string,
    decision: "approved" | "rejected",
    comments: string
  ) => {
    const toastId = toast.loading(`Processing ${decision} form...`);
    try {
      await formService.updateFormStatus(formID, decision, comments);

      // Find the form
      const form = forms.find((f) => f.formID === formID);
      if (!form) {
        setError("Form not found.");
        toast.update(toastId, {
          render: "Form not found.",
          type: "error",
          isLoading: false,
          autoClose: 5000,
          closeButton: true,
        });
        return;
      }

      // Remove the form from state
      setForms((prevForms) =>
        prevForms.filter((form) => form.formID !== formID)
      );

      // Notify user and show success toast
      setNotification({
        id: formID,
        type: "success",
        message: `Form ${decision} successfully!`,
        timestamp: new Date(),
        recipientId: form.submittedBy,
        relatedFormId: formID,
      });

      toast.update(toastId, {
        render: `Form ${decision} successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
      });
    } catch (err) {
      setError(`Failed to ${decision} form. Please try again.`);
      console.error(`Error ${decision} form:`, err);
      toast.update(toastId, {
        render: `Failed to ${decision} form. Please try again.`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
      });
    }
  };

  const handleSelectForm = async (form: SubmittedForm) => {
    try {
      const template = formTemplates.find((t) => t.id === form.formTemplateId);
      if (!template) {
        setError("Form template not found.");
        // Show error toast
        toast.error("Form template not found.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }
      setSelectedForm({ form, template });
    } catch (err) {
      setError("Failed to fetch form template.");
      console.error("Error fetching form template:", err);
      // Show error toast
      toast.error("Failed to fetch form template.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleCloseFormReview = () => {
    setSelectedForm(null);
  };

  const handleFormCreated = () => {
    setRefreshFormTemplates((prev) => !prev);
    toast.success("Form template created successfully!", {
      position: "top-right",
      autoClose: 5000,
      pauseOnHover: true,
    });
  };

  const handleFormTemplateUpdated = () => {
    setRefreshFormTemplates((prev) => !prev);
    toast.success("Form template updated successfully!", {
      position: "top-right",
      autoClose: 5000,
      pauseOnHover: true,
    });
  };

  const handleFormTemplateDeleted = () => {
    setRefreshFormTemplates((prev) => !prev);
    toast.success("Form template deleted successfully!", {
      position: "top-right",
      autoClose: 5000,
      pauseOnHover: true,
    });
  };

  return (
    <div className="admin-forms-container">
      <h1>Admin Management Forms</h1>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {error && (
            <NotificationBanner
              notification={{
                id: "error",
                type: "error",
                message: error,
                timestamp: new Date(),
                recipientId: "admin",
              }}
              onClose={() => setError("")}
            />
          )}

          {notification && (
            <NotificationBanner
              notification={notification}
              onClose={() => setNotification(null)}
            />
          )}

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
                  recipientId: "admin",
                }}
                onClose={() => setNotification(null)}
              />
            )}
          </section>

          <hr className="divider" />

          <section className="create-form-template-section">
            <h2>Create New Form Template</h2>
            <FormCreate onFormCreated={handleFormCreated} />
          </section>

          <hr className="divider" />

          <section className="manage-form-templates-section">
            <h2>Manage Existing Form Templates</h2>
            {/* Pass the update and delete callbacks to FormTemplateList */}
            <FormTemplateList
              refresh={refreshFormTemplates}
              onTemplateUpdated={handleFormTemplateUpdated}
              onTemplateDeleted={handleFormTemplateDeleted}
            />
          </section>
        </>
      )}

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
