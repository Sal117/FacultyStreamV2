import React, { useState, useEffect } from "react";
import { databaseService } from "../../services/databaseService";
import { storageService } from "../../services/storageService";
import { auth } from "../../services/firebase";
import "../../styles/DocumentManagement.css";

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

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const fetchedDocuments = await databaseService.getDocuments();
        setDocuments(fetchedDocuments);
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };
    fetchDocuments();
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
      const filePath = `faculty_documents/${
        auth.currentUser.uid
      }/${documentTitle}_${Date.now()}`;
      const fileUrl = await storageService.uploadFile(
        filePath,
        selectedFile,
        (progress: number) => setUploadProgress(progress)
      );

      const newDocument: Document = {
        documentId: databaseService.generateDocumentId(),
        title: documentTitle,
        description: documentDescription,
        fileUrl: fileUrl,
        category: "Faculty",
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid,
      };

      await databaseService.saveDocument(newDocument);
      setDocuments([...documents, newDocument]);
      setUploading(false);
      resetForm();
    } catch (error) {
      console.error("Error uploading document:", error);
      setUploading(false);
    }
  };

  const resetForm = () => {
    setDocumentTitle("");
    setDocumentDescription("");
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
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
        <button onClick={handleUpload} disabled={uploading}>
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
            </div>
          ))
        ) : (
          <p>No documents to manage.</p>
        )}
      </div>
    </div>
  );
};

export default DocumentManagement;
