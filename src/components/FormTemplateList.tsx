// src/components/FormTemplateList.tsx

import React, { useState, useEffect } from "react";
import "./FormTemplateList.css";
import { formService } from "../services/formService";
import { FormTemplate, User } from "./types";
import Button from "./Button"; // Assuming a Button component exists
import Modal from "./Modal"; // Assuming a Modal component exists for editing
import FormCreate from "./FormCreate"; // To reuse the FormCreate component for editing

interface FormTemplateListProps {
  refresh: boolean; // To trigger re-fetching of form templates
}

const FormTemplateList: React.FC<FormTemplateListProps> = ({ refresh }) => {
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(
    null
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(
    null
  ); // formID
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [userCache, setUserCache] = useState<{ [key: string]: User }>({});

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError(null);
      try {
        const templates = await formService.getAllFormTemplates();
        setFormTemplates(templates);

        // Extract unique user IDs for 'createdBy' and 'responsibleParties'
        const uniqueUserIds = new Set<string>();
        templates.forEach((template) => {
          uniqueUserIds.add(template.createdBy);
          template.responsibleParties.forEach((uid) => uniqueUserIds.add(uid));
        });

        // Fetch user details and cache them
        const fetchedUsers: { [key: string]: User } = {};
        for (const uid of uniqueUserIds) {
          const user = await formService.getUserById(uid);
          if (user) {
            fetchedUsers[uid] = user;
          }
        }
        setUserCache(fetchedUsers);
      } catch (err) {
        console.error("Error fetching form templates:", err);
        setError("Failed to load form templates. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [refresh]);

  // Handler to open edit modal
  const handleEdit = (template: FormTemplate) => {
    setEditingTemplate(template);
    setShowEditModal(true);
  };

  // Handler to close edit modal
  const handleCloseEdit = () => {
    setEditingTemplate(null);
    setShowEditModal(false);
  };

  // Handler to update form template in the list after editing
  const handleUpdateTemplate = (updatedTemplate: FormTemplate) => {
    setFormTemplates((prevTemplates) =>
      prevTemplates.map((template) =>
        template.id === updatedTemplate.id ? updatedTemplate : template
      )
    );

    // Update userCache if 'createdBy' or 'responsibleParties' changed
    const updatedUserIds = new Set<string>();
    updatedUserIds.add(updatedTemplate.createdBy);
    updatedTemplate.responsibleParties.forEach((uid) =>
      updatedUserIds.add(uid)
    );

    const newUsers: { [key: string]: User } = { ...userCache };
    updatedTemplate.responsibleParties.forEach(async (uid) => {
      if (!newUsers[uid]) {
        const user = await formService.getUserById(uid);
        if (user) {
          newUsers[uid] = user;
          setUserCache({ ...newUsers });
        }
      }
    });

    if (!newUsers[updatedTemplate.createdBy]) {
      formService
        .getUserById(updatedTemplate.createdBy)
        .then((user) => {
          if (user) {
            newUsers[updatedTemplate.createdBy] = user;
            setUserCache({ ...newUsers });
          }
        })
        .catch((err) => {
          console.error("Error fetching user for createdBy:", err);
        });
    }

    setUserCache(newUsers);
    handleCloseEdit();
  };

  // Handler to confirm deletion
  const handleDelete = (formID: string) => {
    setDeleteConfirmation(formID);
  };

  // Handler to execute deletion
  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      await formService.deleteFormTemplate(deleteConfirmation);
      setFormTemplates((prevTemplates) =>
        prevTemplates.filter((template) => template.id !== deleteConfirmation)
      );
      setDeleteConfirmation(null);
    } catch (err) {
      console.error("Error deleting form template:", err);
      setError("Failed to delete form template. Please try again.");
    }
  };

  // Handler to cancel deletion
  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  return (
    <div className="form-template-list">
      <h2>Existing Form Templates</h2>

      {loading && <p>Loading form templates...</p>}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && formTemplates.length === 0 && (
        <p>No form templates available.</p>
      )}

      {!loading && !error && formTemplates.length > 0 && (
        <table className="form-template-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Created By</th>
              <th>Created At</th>
              <th>Responsible Parties</th>
              <th>Available to Students</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {formTemplates.map((template) => (
              <tr key={template.id}>
                <td data-label="Name">{template.name}</td>
                <td data-label="Description">{template.description}</td>
                <td data-label="Created By">
                  {userCache[template.createdBy]
                    ? userCache[template.createdBy].name
                    : "Unknown User"}
                </td>
                <td data-label="Created At">
                  {template.createdAt instanceof Date &&
                  !isNaN(template.createdAt.getTime())
                    ? template.createdAt.toLocaleDateString()
                    : "N/A"}
                </td>
                <td data-label="Responsible Parties">
                  {template.responsibleParties &&
                  template.responsibleParties.length > 0
                    ? template.responsibleParties
                        .map((uid) =>
                          userCache[uid] ? userCache[uid].name : uid
                        )
                        .join(", ")
                    : "None"}
                </td>
                <td data-label="Available to Students">
                  {template.availableToStudents ? "Yes" : "No"}
                </td>
                <td data-label="Actions">
                  <Button
                    text="Edit"
                    onClick={() => handleEdit(template)}
                    className="edit-btn"
                  />
                  <Button
                    text="Delete"
                    onClick={() => handleDelete(template.id)}
                    className="delete-btn"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Modal */}
      {editingTemplate && showEditModal && (
        <Modal
          title="Edit Form Template"
          isOpen={showEditModal}
          onClose={handleCloseEdit}
          size="large" // Assuming Modal supports size prop
        >
          <FormCreate
            onFormCreated={() => {
              // After editing, refresh the list
              handleUpdateTemplate(editingTemplate);
            }}
            initialData={editingTemplate}
            isEditMode={true}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <Modal
          title="Confirm Deletion"
          isOpen={!!deleteConfirmation}
          onClose={cancelDelete}
        >
          <h3>Confirm Deletion</h3>
          <p>Are you sure you want to delete this form template?</p>
          <div className="form-actions">
            <Button
              text="Yes, Delete"
              onClick={confirmDelete}
              className="delete-btn"
            />
            <Button
              text="Cancel"
              onClick={cancelDelete}
              className="cancel-btn"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FormTemplateList;
