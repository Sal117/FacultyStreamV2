// src/pages/DocumentManagement.tsx

import React, { useState, useEffect } from "react";
import {
  getDocuments,
  saveDocument,
  updateDocument,
  deleteDocument,
} from "../../services/databaseService";
import { storageService } from "../../services/storageService";
import { auth } from "../../services/firebase";
import "../../styles/DocumentManagement.css";

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

const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [documentDescription, setDocumentDescription] = useState<string>("");
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (
      !selectedFile ||
      !documentTitle.trim() ||
      !documentDescription.trim() ||
      !auth.currentUser
    ) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setUploading(true);
    try {
      const filePath = `faculty_documents/${
        auth.currentUser.uid
      }/${documentTitle}_${Date.now()}`;
      const fileUrl = await storageService.uploadFile(
        filePath,
        selectedFile,
        (progress: number) => setUploadProgress(progress)
      );

      const newDocument = {
        title: documentTitle,
        description: documentDescription,
        fileUrl: fileUrl,
        category: "Faculty",
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid,
      };

      const documentId = await saveDocument(newDocument);

      const savedDocument: Document = {
        documentId: documentId,
        ...newDocument,
      };

      setDocuments([...documents, savedDocument]);
      setUploading(false);
      resetForm();
      toast.success("Document uploaded successfully!");
    } catch (err) {
      console.error("Error uploading document:", err);
      setUploading(false);
      toast.error("Error uploading document.");
    }
  };

  const resetForm = () => {
    setDocumentTitle("");
    setDocumentDescription("");
    setSelectedFile(null);
    setUploadProgress(0);
  };

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
    <div className="document-management-page">
      <ToastContainer />
      <div className="document-management">
        <h1>Faculty Document Management</h1>
        <div className="upload-section">
          <h3>Upload New Document</h3>
          <input
            type="text"
            placeholder="Document Title"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
          />
          <textarea
            placeholder="Document Description"
            value={documentDescription}
            onChange={(e) => setDocumentDescription(e.target.value)}
          />
          <input type="file" onChange={handleFileChange} />
          {uploading && (
            <progress value={uploadProgress} max="100">
              {uploadProgress}%
            </progress>
          )}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`btn ${uploading ? "btn-disabled" : "btn-primary"}`}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        <div className="documents-list">
          <h3>Managed Documents</h3>
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.documentId} className="document-item">
                <h4>{doc.title}</h4>
                <p>{doc.description}</p>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                  View/Download
                </a>
                <div className="document-actions">
                  <button
                    onClick={() => handleDeleteClick(doc)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No documents to manage.</p>
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

export default DocumentManagement;
