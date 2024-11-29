import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { firebaseApp } from "./firebase"; // Ensure this path is correct

const storage = getStorage(firebaseApp);

export const storageService = {
  /**
   * Upload a file with progress tracking
   * @param {string} path - The path in the storage where the file will be uploaded
   * @param {File} file - The file to upload
   * @param {function} [onProgress] - Optional callback to track upload progress
   * @returns {Promise<string>} - The download URL of the uploaded file
   */
  async uploadFile(
    path: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Create a promise to monitor upload completion
      const uploadPromise = new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            if (onProgress) {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress); // Trigger progress callback
            }
          },
          (error) => {
            console.error("File upload error:", error);
            reject(error); // Reject the promise on error
          },
          async () => {
            try {
              // Resolve the promise with the download URL
              const downloadURL = await getDownloadURL(storageRef);
              resolve(downloadURL);
            } catch (error) {
              console.error("Error getting download URL:", error);
              reject(error);
            }
          }
        );
      });

      return await uploadPromise;
    } catch (error) {
      console.error("File upload error:", error);
      throw new Error("Failed to upload file. Please try again.");
    }
  },

  /**
   * Delete a file from Firebase Storage
   * @param {string} path - The path of the file to delete
   * @returns {Promise<void>}
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      console.log(`File deleted successfully: ${path}`);
    } catch (error) {
      console.error("File deletion error:", error);
      throw new Error("Failed to delete file. Please try again.");
    }
  },
};
