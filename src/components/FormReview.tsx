import React, { useState } from "react";
import "./FormReview.css";
import { formService } from "../services/formService";

interface FormReviewProps {
  formId: string;
  formData: { [key: string]: any };
  onDecision: (decision: "approved" | "rejected") => void;
}

const FormReview: React.FC<FormReviewProps> = ({
  formId,
  formData,
  onDecision,
}) => {
  const [comments, setComments] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDecision = async (decision: "approved" | "rejected") => {
    try {
      setLoading(true);
      setErrorMessage(null);

      // Call the service to update form status
      await formService.updateFormStatus(formId, decision, comments);

      // Notify the parent component of the decision
      onDecision(decision);
    } catch (error) {
      console.error(`Failed to ${decision} form:`, error);
      setErrorMessage(
        `An error occurred while trying to ${decision} the form. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-review">
      <h2>Form Review</h2>
      <div className="form-details">
        {Object.keys(formData).map((key) => (
          <div key={key} className="form-field">
            <strong>{key}:</strong> {formData[key]}
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="error-message">
          <p>{errorMessage}</p>
        </div>
      )}

      <textarea
        className="comments"
        placeholder="Add comments (optional)..."
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />

      <div className="actions">
        <button
          className="approve-btn"
          onClick={() => handleDecision("approved")}
          disabled={loading}
        >
          {loading ? "Approving..." : "Approve"}
        </button>
        <button
          className="reject-btn"
          onClick={() => handleDecision("rejected")}
          disabled={loading}
        >
          {loading ? "Rejecting..." : "Reject"}
        </button>
      </div>
    </div>
  );
};

export default FormReview;
