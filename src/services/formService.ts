import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { firebaseApp } from "./firebase";
import { notificationService } from "./notificationService";
import { authService } from "./authService";

// Type definitions
type ValidationRule = (value: any) => string | null;

interface FormField {
  value: any;
  validation: ValidationRule[];
}

interface FormTemplate {
  id: string;
  name: string;
  fields: {
    [key: string]: {
      label: string;
      type: string;
      validation: string[];
      required?: boolean;
    };
  };
}

interface SubmittedForm {
  formID: string;
  formType: string;
  submittedBy: string;
  submittedAt: Timestamp;
  status: "pending" | "approved" | "rejected";
  responsibleParty?: string;
  comments?: string;
  [key: string]: any;
}

interface FormErrors {
  [key: string]: string | null;
}

class FormService {
  private db = getFirestore(firebaseApp);

  // Helper: Ensure user is authenticated
  private async ensureAuthenticated(): Promise<string> {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated.");
    }
    return user.uid;
  }

  // Helper: Notify user
  private async notifyUser(
    userId: string,
    message: string,
    type: "info" | "alert" | "update" | "success" | "error", // Ensure correct type
    relatedFormId?: string
  ): Promise<void> {
    try {
      await notificationService.notify({
        message,
        type, // Pass correctly typed value
        timestamp: Timestamp.now(),
        userId,
        relatedFormId,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      throw new Error("Failed to send notification.");
    }
  }

  // Validate a single field
  validateField(field: FormField): string | null {
    for (let rule of field.validation) {
      const error = rule(field.value);
      if (error) return error;
    }
    return null;
  }

  // Fetch submitted forms for a specific user
  async getSubmittedForms(userId: string): Promise<SubmittedForm[]> {
    try {
      const authenticatedUserId = await this.ensureAuthenticated();
      if (userId !== authenticatedUserId) {
        throw new Error("You can only fetch your own forms.");
      }
      const formsQuery = query(collection(this.db, "Forms"), where("submittedBy", "==", userId));
      const snapshot = await getDocs(formsQuery);
      return snapshot.docs.map((doc) => ({
        formID: doc.id,
        ...doc.data(),
      })) as SubmittedForm[];
    } catch (error) {
      console.error("Error fetching submitted forms:", error);
      throw new Error("Failed to fetch submitted forms.");
    }
  }

  // Fetch forms assigned to a responsible party
  async getFormsByResponsibleParty(responsiblePartyId: string): Promise<SubmittedForm[]> {
    try {
      const authenticatedUserId = await this.ensureAuthenticated();
      if (responsiblePartyId !== authenticatedUserId) {
        throw new Error("You can only fetch forms assigned to you.");
      }
      const formsQuery = query(
        collection(this.db, "Forms"),
        where("responsibleParty", "==", responsiblePartyId)
      );
      const snapshot = await getDocs(formsQuery);
      return snapshot.docs.map((doc) => ({
        formID: doc.id,
        ...doc.data(),
      })) as SubmittedForm[];
    } catch (error) {
      console.error("Error fetching forms by responsible party:", error);
      throw new Error("Failed to fetch forms.");
    }
  }

  // Save form submission to Firestore
  async submitForm(data: Omit<SubmittedForm, "formID">): Promise<void> {
    try {
      const authenticatedUserId = await this.ensureAuthenticated();
      if (authenticatedUserId !== data.submittedBy) {
        throw new Error("You can only submit forms on your behalf.");
      }
      const formsCollection = collection(this.db, "Forms");
      const docRef = await addDoc(formsCollection, {
        ...data,
        submittedAt: Timestamp.now(),
      });
      if (data.responsibleParty) {
        await this.notifyUser(
          data.responsibleParty,
          `A new form (${data.formType}) has been submitted for your review.`,
          "info",
          docRef.id
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      throw new Error("Failed to submit form.");
    }
  }
  async getAllPendingForms(): Promise<SubmittedForm[]> {
    try {
      const formsQuery = query(
        collection(this.db, "Forms"),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(formsQuery);
      return snapshot.docs.map((doc) => ({
        formID: doc.id,
        ...doc.data(),
      })) as SubmittedForm[];
    } catch (error) {
      console.error("Error fetching pending forms:", error);
      throw new Error("Failed to fetch pending forms");
    }
  }
  // Fetch a specific form template by ID
  async fetchFormTemplateById(templateId: string): Promise<FormTemplate | null> {
    try {
      const templateRef = doc(this.db, "FormTemplates", templateId);
      const snapshot = await getDoc(templateRef);
      return snapshot.exists()
        ? ({ id: snapshot.id, ...snapshot.data() } as FormTemplate)
        : null;
    } catch (error) {
      console.error("Error fetching form template:", error);
      throw new Error("Failed to fetch form template");
    }
  }

  // Approve or reject a submitted form
  async updateFormStatus(
    formID: string,
    status: "approved" | "rejected",
    comments: string = ""
  ): Promise<void> {
    try {
      const authenticatedUserId = await this.ensureAuthenticated();
      const formRef = doc(this.db, "Forms", formID);
      const formSnapshot = await getDoc(formRef);
      const formData = formSnapshot.data();

      if (formData?.responsibleParty !== authenticatedUserId) {
        throw new Error("You are not authorized to update this form.");
      }

      await updateDoc(formRef, {
        status,
        comments,
        updatedAt: Timestamp.now(),
      });

      if (formData?.submittedBy) {
        await this.notifyUser(
          formData.submittedBy,
          `Your form (${formData.formType}) has been ${status}.`,
          status === "approved" ? "success" : "alert",
          formID
        );
      }
    } catch (error) {
      console.error("Error updating form status:", error);
      throw new Error("Failed to update form status.");
    }
  }

  // Other methods remain unchanged...
}

const formService = new FormService();

export { formService };
