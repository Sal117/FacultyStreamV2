import React, { useState, ChangeEvent } from "react";
import { storageService } from "../services/storageService";
import FormInput from "./FormInput";
import LoadingSpinner from "./LoadingSpinner";

interface DocumentUploadProps {}

const DocumentUpload: React.FC<DocumentUploadProps> = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    setFile(selectedFile);
    setUploadStatus("");
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("Please select a file to upload.");
      return;
    }

    setUploadStatus("Uploading...");
    try {
      const downloadUrl = await storageService.uploadFile(
        `documents/${file.name}`,
        file,
        (progress: number) => {
          setUploadProgress(progress);
        }
      );
      setUploadStatus("Upload successful");
      console.log("File available at:", downloadUrl);
    } catch (error) {
      setUploadStatus("Upload failed. Please try again.");
      console.error("Upload failed:", error);
    }
  };

  return (
    <div>
      <h2>Upload Document</h2>
      <FormInput
        type="file"
        onChange={handleFileChange}
        name="documentUpload"
        label="Document Upload"
        required={true}
        errorMessage={file ? "" : "No file selected"}
        isValid={!!file}
        value={""}
        placeholder={""}
      />
      {uploadProgress > 0 && (
        <div>
          <LoadingSpinner />
          <p>Upload progress: {Math.round(uploadProgress)}%</p>
        </div>
      )}
      <button onClick={handleUpload} disabled={!file}>
        Upload
      </button>
      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
};

export default DocumentUpload;
// Handles document upload functionality with feedback and progress tracking.
