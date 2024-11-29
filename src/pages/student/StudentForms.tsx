// src/pages/student/StudentForms.tsx

import React, { useState, useEffect } from "react";
import { formService } from "../../services/formService";
import { notificationService } from "../../services/notificationService";
import { authService, CustomUser } from "../../services/authService";
import NotificationBanner from "../../components/NotificationBanner";
import LoadingSpinner from "../../components/LoadingSpinner";
import Card from "../../components/Card";
import Button from "../../components/Button";
import FormSelector from "../../components/FormSelector";
import FormSubmit from "../../components/FormSubmit";
import "../../styles/StudentForms.css";
import {
  FormTemplate,
  NotificationPayload,
  SubmittedForm,
  User,
} from "../../components/types";
import PrintableForm from "../../components/PrintableForm";
import SimplePrintTest from "../../components/SimplePrintTest";
import { Timestamp } from "firebase/firestore";

const StudentForms: React.FC = () => {
  const [forms, setForms] = useState<SubmittedForm[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [notification, setNotification] = useState<NotificationPayload | null>(
    null
  );
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(
    null
  );
  const [selectedFormForResubmission, setSelectedFormForResubmission] =
    useState<SubmittedForm | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [userCache, setUserCache] = useState<{ [key: string]: User }>({});

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      try {
        setLoading(true);
        setError("");

        const user: CustomUser | null = await authService.getCurrentUser();
        if (!user) {
          setError("You are not logged in. Please log in to view your forms.");
          return;
        }

        setUserId(user.uid);

        // Fetch available form templates for the student
        const availableTemplates =
          // As in form selector and formservice if not expected results add user.uid
          await formService.getAvailableFormTemplatesForStudent();
        if (availableTemplates.length === 0) {
          setError("No available forms at the moment.");
        }

        setFormTemplates(availableTemplates);

        // Fetch submitted forms by the student
        const fetchedForms = await formService.getSubmittedFormsByUser(
          user.uid
        );
        const mappedForms: SubmittedForm[] = fetchedForms.map((form) => ({
          ...form,
          formID: form.formID,
          submittedAt:
            form.submittedAt instanceof Timestamp
              ? form.submittedAt.toDate()
              : form.submittedAt,
        }));

        setForms(mappedForms);

        // Subscribe to user notifications
        unsubscribe = notificationService.subscribeToUserNotifications(
          user.uid,
          (newNotifications) => {
            if (newNotifications.length > 0) {
              const latestNotification =
                newNotifications[newNotifications.length - 1];
              setNotification({
                id: latestNotification.id,
                type: latestNotification.type,
                message: latestNotification.message,
                timestamp: latestNotification.timestamp.toDate(),
                recipientId: latestNotification.recipientId,
                relatedFormId: latestNotification.relatedFormId,
                relatedAppointmentId: latestNotification.relatedAppointmentId,
              });
            }
          }
        );
      } catch (err) {
        setError(
          "An error occurred while fetching your forms. Please try again later."
        );
        console.error("Error fetching forms:", err);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    return () => {
      if (unsubscribe) unsubscribe();
    };
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

  const handleResubmit = async (form: SubmittedForm) => {
    try {
      setLoading(true);
      setError("");

      // Fetch the submitted form data including previous inputs and comments
      const existingFormData = await formService.getSubmittedFormById(
        form.formID
      );

      if (existingFormData) {
        setSelectedFormForResubmission(existingFormData);
      } else {
        setError("Failed to fetch form data for resubmission.");
      }
    } catch (err) {
      setError("Failed to prepare form for resubmission. Please try again.");
      console.error("Error preparing resubmission:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSelect = (formTemplate: FormTemplate) => {
    setSelectedTemplate(formTemplate);
  };

  const handleFormSubmit = async () => {
    try {
      setLoading(true);
      const user: CustomUser | null = await authService.getCurrentUser();
      if (!user) {
        setError("You are not logged in. Please log in to submit forms.");
        return;
      }

      const fetchedForms = await formService.getSubmittedFormsByUser(user.uid);
      const mappedForms: SubmittedForm[] = fetchedForms.map((form) => ({
        ...form,
        formID: form.formID,
        submittedAt:
          form.submittedAt instanceof Timestamp
            ? form.submittedAt.toDate()
            : form.submittedAt,
      }));

      setForms(mappedForms);

      setNotification({
        id: `submit-${Date.now()}`,
        type: "success",
        message: "Form submitted successfully!",
        timestamp: new Date(),
        recipientId: user.uid,
      });
    } catch (err) {
      setError("Failed to refresh forms after submission. Please try again.");
      console.error("Error refreshing forms:", err);
    } finally {
      setLoading(false);
      setSelectedTemplate(null);
      setSelectedFormForResubmission(null);
    }
  };

  return (
    <div className="student-forms-container">
      <h1>Your Forms</h1>

      {loading && <LoadingSpinner />}

      {!loading && error && (
        <NotificationBanner
          notification={{
            id: "error",
            type: "error",
            message: error,
            timestamp: new Date(),
            recipientId: userId,
            relatedFormId: undefined,
            relatedAppointmentId: undefined,
          }}
          onClose={() => setError("")}
        />
      )}

      {!loading && notification && (
        <NotificationBanner
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}

      <section className="create-form-section">
        <h2>
          {selectedFormForResubmission
            ? "Resubmit Form"
            : "Create New Form Submission"}
        </h2>
        {!selectedTemplate && !selectedFormForResubmission ? (
          formTemplates.length > 0 ? (
            <FormSelector
              formTemplates={formTemplates}
              onSelectForm={handleFormSelect}
            />
          ) : (
            <NotificationBanner
              notification={{
                id: "no-available-forms",
                type: "info",
                message: "No available forms to submit at the moment.",
                timestamp: new Date(),
                recipientId: userId,
                relatedFormId: undefined,
                relatedAppointmentId: undefined,
              }}
              onClose={() => setNotification(null)}
            />
          )
        ) : selectedTemplate ? (
          <FormSubmit
            formTemplate={selectedTemplate}
            userId={userId}
            onSubmitSuccess={handleFormSubmit}
            formId={selectedTemplate.id}
          />
        ) : selectedFormForResubmission ? (
          <FormSubmit
            formTemplate={
              formTemplates.find(
                (t) => t.id === selectedFormForResubmission.formTemplateId
              )!
            }
            userId={userId}
            onSubmitSuccess={handleFormSubmit}
            formId={selectedFormForResubmission.formTemplateId}
            existingFormData={selectedFormForResubmission}
          />
        ) : null}
      </section>

      <hr className="divider" />

      <section className="submitted-forms-section">
        <h2>Your Submitted Forms</h2>
        {forms.length > 0 ? (
          <div className="forms-list">
            {forms.map((form) => {
              const template = formTemplates.find(
                (t) => t.id === form.formTemplateId
              );

              if (!template) {
                return null; // Skip if no template found
              }

              return (
                <div key={form.formID}>
                  <Card
                    title={form.formType}
                    description={`Submitted on ${
                      form.submittedAt instanceof Date
                        ? form.submittedAt.toLocaleDateString()
                        : "N/A"
                    }`}
                    extra={
                      <div className="form-actions">
                        <span
                          className={`status ${getStatusClass(form.status)}`}
                        >
                          {form.status.charAt(0).toUpperCase() +
                            form.status.slice(1)}
                        </span>
                        {form.status === "rejected" && (
                          <Button
                            text="Resubmit"
                            onClick={() => handleResubmit(form)}
                            variant="primary"
                            size="small"
                          />
                        )}
                        {form.status === "approved" && (
                          <>
                            {/* Print Button */}
                            <SimplePrintTest
                              contentId={`printable-form-${form.formID}`}
                              buttonLabel="Print"
                              buttonStyle={{
                                backgroundColor: "#2ecc71",
                                marginLeft: "10px",
                              }}
                            />

                            {/* PrintableForm */}
                            <div
                              id={`printable-form-${form.formID}`}
                              className="printable-form-container"
                              style={{
                                position: "absolute",
                                left: "-10000px",
                                top: "0px",
                              }}
                            >
                              <PrintableForm
                                formData={form}
                                formTemplate={template}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    }
                  />

                  {/* Render FormSubmit for Resubmission */}
                  {selectedFormForResubmission?.formID === form.formID && (
                    <FormSubmit
                      formTemplate={template}
                      userId={userId}
                      onSubmitSuccess={handleFormSubmit}
                      formId={form.formTemplateId}
                      existingFormData={selectedFormForResubmission}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          !loading && (
            <NotificationBanner
              notification={{
                id: "no-forms",
                type: "info",
                message: "You have not submitted any forms yet.",
                timestamp: new Date(),
                recipientId: userId,
                relatedFormId: undefined,
                relatedAppointmentId: undefined,
              }}
              onClose={() => setNotification(null)}
            />
          )
        )}
      </section>
    </div>
  );
};

export default StudentForms;
