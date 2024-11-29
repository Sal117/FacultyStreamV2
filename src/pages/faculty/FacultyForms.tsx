// src/pages/faculty/FacultyForms.tsx

import React, { useState, useEffect } from "react";
import { formService } from "../../services/formService";
import { authService } from "../../services/authService";
import NotificationBanner from "../../components/NotificationBanner";
import LoadingSpinner from "../../components/LoadingSpinner";
import Card from "../../components/Card";
import Button from "../../components/Button";
import FormReview from "../../components/FormReview";
import Modal from "../../components/Modal";
import "../../styles/FacultyForms.css";
import {
  FormTemplate,
  NotificationPayload,
  SubmittedForm,
  User,
} from "../../components/types";
import { Timestamp } from "firebase/firestore";

const FacultyForms: React.FC = () => {
  const [forms, setForms] = useState<SubmittedForm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [notification, setNotification] = useState<NotificationPayload | null>(
    null
  );
  const [selectedForm, setSelectedForm] = useState<{
    form: SubmittedForm;
    template: FormTemplate;
  } | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [userCache, setUserCache] = useState<{ [key: string]: User }>({});

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

        // Fetch forms assigned to the faculty member using their UID
        const fetchedForms = await formService.getFormsByResponsibleParty(
          user.uid
        );

        // Map the fetched data to the form structure
        const mappedForms: SubmittedForm[] = fetchedForms.map((form) => ({
          ...form,
          submittedAt:
            form.submittedAt instanceof Date
              ? form.submittedAt
              : (form.submittedAt as Timestamp).toDate(),
        }));

        setForms(mappedForms);

        // Extract unique UIDs from submittedBy and responsibleParties
        const uniqueUserIds = new Set<string>();
        mappedForms.forEach((form) => {
          uniqueUserIds.add(form.submittedBy);
          form.responsibleParties.forEach((uid) => uniqueUserIds.add(uid));
        });

        // Fetch user details for unique UIDs not already in userCache
        const newUsers: { [key: string]: User } = { ...userCache };
        for (const uid of uniqueUserIds) {
          if (!newUsers[uid]) {
            const fetchedUser = await formService.getUserById(uid);
            if (fetchedUser) {
              newUsers[uid] = fetchedUser;
            }
          }
        }
        setUserCache(newUsers);
      } catch (err) {
        setError("Failed to load forms. Please try again later.");
        console.error("Error fetching forms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyForms();
  }, []);

  // Handle reviewing a form (open FormReview modal)
  const handleReview = async (form: SubmittedForm) => {
    try {
      setLoading(true);
      setError("");

      // Fetch the form template details
      const template = await formService.fetchFormTemplateById(
        form.formTemplateId
      );
      if (!template) {
        setError("Form template not found.");
        return;
      }

      // Ensure responsible parties are cached
      const newUsers: { [key: string]: User } = { ...userCache };
      template.responsibleParties.forEach(async (uid) => {
        if (!newUsers[uid]) {
          const fetchedUser = await formService.getUserById(uid);
          if (fetchedUser) {
            newUsers[uid] = fetchedUser;
            setUserCache({ ...newUsers });
          }
        }
      });

      setSelectedForm({ form, template });
      setShowReviewModal(true);
    } catch (err) {
      setError("Failed to fetch form template.");
      console.error("Error fetching form template:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle closing the review modal
  const handleCloseReview = () => {
    setSelectedForm(null);
    setShowReviewModal(false);
  };

  // Handle the decision made in FormReview (approved or rejected)
  const handleDecision = (
    decision: "approved" | "rejected",
    comments: string
  ) => {
    if (!selectedForm) return;

    // Update the form's status in the state
    setForms((prevForms) =>
      prevForms.map((form) =>
        form.formID === selectedForm.form.formID
          ? { ...form, status: decision, comments, facultyData: {} }
          : form
      )
    );

    // Display a success notification
    setNotification({
      id: selectedForm.form.formID, // Using formID as a unique identifier
      type: "success",
      message: `Form has been ${decision} successfully.`,
      timestamp: new Date(), // Changed from Timestamp.now() to Date
      recipientId: selectedForm.form.submittedBy, // Assuming 'submittedBy' is the recipient
      relatedFormId: selectedForm.form.formID,
    });

    // Close the modal
    setShowReviewModal(false);
    setSelectedForm(null);
  };

  return (
    <div className="faculty-forms-container">
      <h1>Assigned Forms</h1>

      {loading && <LoadingSpinner />}

      {!loading && error && (
        <NotificationBanner
          notification={{
            id: "error",
            type: "error",
            message: error,
            timestamp: new Date(), // Changed to Date
            recipientId: "faculty", // Set appropriately
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

      {!loading && !error && (
        <>
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
                        onClick={() => handleReview(form)}
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
                message: "No forms assigned to you.",
                timestamp: new Date(), // Changed to Date
                recipientId: "faculty", // Set appropriately
                relatedFormId: undefined,
                relatedAppointmentId: undefined,
              }}
              onClose={() => setNotification(null)}
            />
          )}
        </>
      )}

      {/* Modal: Review Form */}
      {selectedForm && selectedForm.template && showReviewModal && (
        <Modal
          title={`Review Form: ${selectedForm.template.name}`}
          isOpen={showReviewModal}
          onClose={handleCloseReview}
          size="large"
        >
          <FormReview
            formId={selectedForm.form.formID}
            formData={{
              ...selectedForm.form,
              formType: selectedForm.form.formType,
              submittedAt: selectedForm.form.submittedAt,
            }}
            formTemplate={selectedForm.template}
            onDecision={handleDecision}
          />
        </Modal>
      )}
    </div>
  );
};

export default FacultyForms;
