// src/components/FormSelector.tsx

import React, { useEffect, useState } from "react";
import "./FormSelector.css";
import { FormTemplate, User } from "./types";
import { formService } from "../services/formService";

interface FormSelectorProps {
  onSelectForm: (formTemplate: FormTemplate) => void;
  formTemplates?: FormTemplate[]; // Allow passing pre-fetched templates
}

const FormSelector: React.FC<FormSelectorProps> = ({
  onSelectForm,
  formTemplates: preFetchedTemplates,
}) => {
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>(
    preFetchedTemplates || []
  );
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(
    preFetchedTemplates ? false : true
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userCache, setUserCache] = useState<{ [key: string]: User }>({});

  useEffect(() => {
    let isMounted = true;

    if (preFetchedTemplates && preFetchedTemplates.length > 0) {
      // Fetch user details for responsible parties in pre-fetched templates
      fetchResponsiblePartyNames(preFetchedTemplates);
      return;
    }

    const fetchFormTemplates = async () => {
      try {
        setLoading(true);
        const templates =
          await formService.getAvailableFormTemplatesForStudent();
        if (!isMounted) return;

        // Fetch user details for responsible parties
        await fetchResponsiblePartyNames(templates);

        setFormTemplates(templates);
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching form templates:", error);
        setErrorMessage("Failed to load forms. Please try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFormTemplates();

    return () => {
      isMounted = false;
    };
  }, [preFetchedTemplates]);

  const fetchResponsiblePartyNames = async (templates: FormTemplate[]) => {
    const uniqueUserIds = new Set<string>();
    templates.forEach((template) => {
      template.responsibleParties.forEach((uid) => uniqueUserIds.add(uid));
    });

    const fetchedUsers: { [key: string]: User } = { ...userCache };
    for (const uid of uniqueUserIds) {
      if (!fetchedUsers[uid]) {
        try {
          const user = await formService.getUserById(uid);
          if (user) {
            fetchedUsers[uid] = user;
          }
        } catch (error) {
          console.error(`Error fetching user with ID ${uid}:`, error);
        }
      }
    }

    setUserCache(fetchedUsers);

    // Update templates with responsible party names
    const updatedTemplates = templates.map((template) => ({
      ...template,
      responsiblePartyNames: template.responsibleParties.map(
        (uid) => fetchedUsers[uid]?.name || uid
      ),
    }));

    setFormTemplates(updatedTemplates);
  };

  const handleFormSelection = (formTemplate: FormTemplate) => {
    setSelectedFormId(formTemplate.id);
    onSelectForm(formTemplate);
  };

  if (loading) {
    return <div className="form-selector">Loading forms...</div>;
  }

  if (errorMessage) {
    return <div className="form-selector error">{errorMessage}</div>;
  }

  return (
    <div className="form-selector">
      <h2>Select a Form</h2>
      {formTemplates.length === 0 ? (
        <p className="no-forms">No forms available.</p>
      ) : (
        <ul className="form-list">
          {formTemplates.map((form) => (
            <li
              key={form.id}
              className={`form-item ${
                selectedFormId === form.id ? "selected" : ""
              }`}
              onClick={() => handleFormSelection(form)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleFormSelection(form);
              }}
              tabIndex={0}
              role="button"
              aria-selected={selectedFormId === form.id}
            >
              <strong>{form.name}</strong>
              <p>{form.description}</p>
              <p>
                <em>
                  Responsible Parties:{" "}
                  {form.responsiblePartyNames
                    ? form.responsiblePartyNames.join(", ")
                    : "N/A"}
                </em>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FormSelector;
