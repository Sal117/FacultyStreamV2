// src/pages/DocumentsAccess.tsx

import React, { useState, useEffect } from "react";
import {
  getDocuments,
  updateDocument,
  deleteDocument,
} from "../../services/databaseService";
import { auth } from "../../services/firebase";
import "../../styles/DocumentAccess.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Document {
  documentId: string;
  title: string;
  description: string;
  fileUrl: string;
  category: string;
  createdAt: string;
  createdBy: string;
}

const DocumentsAccess: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);

  // State for delete confirmation modal
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );

  useEffect(() => {
    const fetchDocumentsData = async () => {
      try {
        const fetchedDocuments = await getDocuments();
        setDocuments(fetchedDocuments);
      } catch (err) {
        console.error("Error fetching documents:", err);
        toast.error("Error fetching documents.");
      }
    };
    fetchDocumentsData();
  }, []);

  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    try {
      await deleteDocument(documentToDelete.documentId);
      setDocuments(
        documents.filter((d) => d.documentId !== documentToDelete.documentId)
      );
      toast.success("Document deleted successfully!");
    } catch (err) {
      console.error("Error deleting document:", err);
      toast.error("Error deleting document.");
    } finally {
      setIsDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  return (
    <div className="document-access-page">
      <ToastContainer />
      <div className="document-access-container">
        <h2>Document Access</h2>
        <div className="documents-list">
          <h3>Available Documents</h3>
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.documentId} className="document-item">
                <h4>{doc.title}</h4>
                <p>{doc.description}</p>

                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </div>
            ))
          ) : (
            <p>No documents available.</p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirm Delete</h2>
            <p>
              Are you sure you want to delete this document? This action cannot
              be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDeleteDocument}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsAccess;
