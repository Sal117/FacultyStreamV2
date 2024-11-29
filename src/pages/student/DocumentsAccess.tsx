// src/pages/DocumentsAccess.tsx

import React, { useState, useEffect } from "react";
import {
  getDocuments,
  saveDocument,
  updateDocument,
  deleteDocument,
} from "../../services/databaseService";
import { storageService } from "../../services/storageService";
import { auth } from "../../services/firebase";
import "../../styles/DocumentAccess.css";

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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [documentDescription, setDocumentDescription] = useState<string>("");

  useEffect(() => {
    const fetchDocumentsData = async () => {
      try {
        const fetchedDocuments = await getDocuments();
        setDocuments(fetchedDocuments);
      } catch (err) {
        console.error("Error fetching documents:", err);
        // Optionally, set an error state here to inform the user
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
      alert(
        "Please fill out all fields, select a file, and ensure you're logged in before uploading."
      );
      return;
    }

    setUploading(true);
    try {
      const filePath = `documents/${documentTitle}_${Date.now()}`;
      const fileUrl = await storageService.uploadFile(
        filePath,
        selectedFile,
        (progress: number) => setUploadProgress(progress)
      );

      const newDocument = {
        title: documentTitle,
        description: documentDescription,
        fileUrl: fileUrl,
        category: "General",
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
    } catch (err) {
      console.error("Error uploading document:", err);
      setUploading(false);
      // Optionally, set an error state here to inform the user
    }
  };

  const resetForm = () => {
    setDocumentTitle("");
    setDocumentDescription("");
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="document-access-page">
      <div className="document-access-container">
        <h2>Document Access</h2>
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
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
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
                {/* Optionally, add buttons to update or delete documents */}
                <div className="document-actions">
                  <button
                    onClick={() => {
                      // Implement update functionality if needed
                    }}
                    className="update-doc-btn"
                  >
                    Update
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await deleteDocument(doc.documentId);
                        setDocuments(
                          documents.filter(
                            (d) => d.documentId !== doc.documentId
                          )
                        );
                      } catch (err) {
                        console.error("Error deleting document:", err);
                        // Optionally, set an error state here to inform the user
                      }
                    }}
                    className="delete-doc-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No documents available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsAccess;
