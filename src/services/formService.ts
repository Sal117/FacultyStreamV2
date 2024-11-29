// src/services/formService.ts

import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { firebaseApp } from "./firebase";
import { notificationService } from "./notificationService";
import { authService, CustomUser } from "./authService";
import {
  FormTemplate,
  SubmittedFormData,
  FormField,
  SubmittedForm,
  User,
} from "../components/types";

const db = getFirestore(firebaseApp);

// Type Definitions
interface NotificationPayload {
  message: string;
  type: "info" | "alert" | "update" | "success" | "error";
  timestamp: Timestamp;
  recipientId: string;
  relatedFormId?: string;
  relatedAppointmentId?: string;
}

class FormService {
  private db = db;

  // Helper: Ensure user is authenticated and get user data
  private async getAuthenticatedUser(): Promise<CustomUser> {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated.");
    }
    return user;
  }

  // Helper: Ensure user is an admin or authorized faculty
  private async ensureAdminOrFaculty(
    formData?: SubmittedForm
  ): Promise<CustomUser> {
    const user = await this.getAuthenticatedUser();
    if (user.role === "admin") {
      return user;
    }
    if (
      user.role === "faculty" &&
      formData &&
      formData.responsibleParties.includes(user.uid)
    ) {
      return user;
    }
    throw new Error(
      "User is not authorized. Admin or responsible faculty access required."
    );
  }

  // Helper: Ensure user is a faculty member
  private async ensureFaculty(): Promise<CustomUser> {
    const user = await this.getAuthenticatedUser();
    if (user.role !== "faculty") {
      throw new Error("User is not authorized. Faculty access required.");
    }
    return user;
  }

  // Helper: Ensure user is a student
  private async ensureStudent(): Promise<CustomUser> {
    const user = await this.getAuthenticatedUser();
    if (user.role !== "student") {
      throw new Error("User is not authorized. Student access required.");
    }
    return user;
  }

  // Helper: Notify user
  private async notifyUser(
    recipientId: string,
    message: string,
    type: "info" | "alert" | "update" | "success" | "error",
    relatedFormId?: string,
    relatedAppointmentId?: string
  ): Promise<void> {
    try {
      const notificationPayload: NotificationPayload = {
        message,
        type,
        timestamp: Timestamp.now(),
        recipientId,
        relatedFormId,
        relatedAppointmentId,
      };
      await notificationService.notify(notificationPayload);
    } catch (error) {
      console.error("Error sending notification:", error);
      // Optionally, you can choose to rethrow or handle silently
    }
  }

  // Validate a single field (client-side validation)
  validateField(field: FormField, value: any): string | null {
    if (!field.validation || !Array.isArray(field.validation)) {
      return null; // No validation rules defined
    }

    const validationRules: {
      [key: string]: (value: any) => string | null;
    } = {
      required: (value) => (!value ? "This field is required." : null),
      email: (value) =>
        /\S+@\S+\.\S+/.test(value) ? null : "Invalid email address.",
      minLength: (value) =>
        value && value.length >= 5
          ? null
          : "Minimum length should be 5 characters.",
      // Add more validation rules as needed
    };

    for (const rule of field.validation) {
      const validate = validationRules[rule];
      if (validate) {
        const error = validate(value);
        if (error) return error;
      }
    }

    return null;
  }

  // =====================
  // Form Template Methods
  // =====================

  // Admin: Fetch all form templates
  async getAllFormTemplates(): Promise<FormTemplate[]> {
    try {
      await this.ensureAdminOrFaculty();
      const templatesCollection = collection(this.db, "FormTemplates");
      const snapshot = await getDocs(templatesCollection);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FormTemplate[];
    } catch (error) {
      console.error("Error fetching all form templates:", error);
      throw new Error("Failed to fetch all form templates.");
    }
  }

  // Admin: Create a new form template
  async createFormTemplate(
    templateData: Omit<FormTemplate, "id">
  ): Promise<void> {
    try {
      await this.ensureAdminOrFaculty();
      const templatesCollection = collection(this.db, "FormTemplates");
      await addDoc(templatesCollection, {
        ...templateData,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error creating form template:", error);
      throw new Error("Failed to create form template.");
    }
  }

  // Admin: Update a form template
  async updateFormTemplate(
    templateId: string,
    updatedData: Partial<Omit<FormTemplate, "id">>
  ): Promise<void> {
    try {
      await this.ensureAdminOrFaculty();
      const templateRef = doc(this.db, "FormTemplates", templateId);
      await updateDoc(templateRef, {
        ...updatedData,
        updatedAt: Timestamp.now(), // Optional: track updates
      });
    } catch (error) {
      console.error("Error updating form template:", error);
      throw new Error("Failed to update form template.");
    }
  }

  // Admin: Delete a form template
  async deleteFormTemplate(templateId: string): Promise<void> {
    try {
      await this.ensureAdminOrFaculty();
      const templateRef = doc(this.db, "FormTemplates", templateId);
      await deleteDoc(templateRef);
    } catch (error) {
      console.error("Error deleting form template:", error);
      throw new Error("Failed to delete form template.");
    }
  }

  // Admin: Set responsible parties for a form template
  async setFormPermissions(
    templateId: string,
    responsibleParties: string[]
  ): Promise<void> {
    try {
      await this.ensureAdminOrFaculty();
      const templateRef = doc(this.db, "FormTemplates", templateId);
      await updateDoc(templateRef, { responsibleParties });
    } catch (error) {
      console.error("Error setting form permissions:", error);
      throw new Error("Failed to set form permissions.");
    }
  }

  // Admin & Student: Fetch a specific form template by ID
  async fetchFormTemplateById(
    templateId: string
  ): Promise<FormTemplate | null> {
    try {
      const user = await this.getAuthenticatedUser();
      const templateRef = doc(this.db, "FormTemplates", templateId);
      const snapshot = await getDoc(templateRef);

      if (!snapshot.exists()) {
        throw new Error("Form template does not exist.");
      }

      const template = {
        id: snapshot.id,
        ...snapshot.data(),
      } as FormTemplate;

      if (user.role === "admin") {
        return template;
      } else if (user.role === "student") {
        if (template.availableToStudents) {
          return template;
        } else {
          throw new Error(
            "You are not authorized to access this form template."
          );
        }
      } else if (user.role === "faculty") {
        // Define faculty access logic if needed
        return template;
      } else {
        throw new Error("Invalid user role.");
      }
    } catch (error) {
      console.error("Error fetching form template by ID:", error);
      throw new Error("Failed to fetch form template.");
    }
  }

  // =====================
  // Form Submission Methods
  // =====================

  // Student: Fetch available form templates for submission (based on availability)
  async getAvailableFormTemplatesForStudent(): Promise<FormTemplate[]> {
    try {
      // First ensure the user is authenticated and is a student
      const user = await this.ensureStudent();
      
      if (!user || !user.uid) {
        throw new Error("User authentication required");
      }

      // Get reference to form templates collection
      const templatesCollection = collection(this.db, "FormTemplates");
      
      // Simple query for available templates
      const q = query(
        templatesCollection,
        where("availableToStudents", "==", true)
      );

      // Execute query
      const snapshot = await getDocs(q);

      // Map documents to FormTemplate objects
      const templates = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as FormTemplate[];

      // If no templates found, return empty array
      if (templates.length === 0) {
        return [];
      }

      try {
        // Enhance templates with responsible party names
        const enhancedTemplates = await this.getFormTemplatesWithResponsiblePartyNames(
          templates
        );
        return enhancedTemplates;
      } catch (enhanceError) {
        // If enhancement fails, return basic templates
        console.error("Error enhancing templates with names:", enhanceError);
        return templates;
      }

    } catch (error) {
      console.error(
        "Error in getAvailableFormTemplatesForStudent:",
        error
      );

      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes("User authentication required")) {
          throw new Error("Please log in to view available forms");
        }
        if (error.message.includes("Student access required")) {
          throw new Error("Only students can view these forms");
        }
      }

      // For other errors, throw a generic message
      throw new Error("Failed to fetch available form templates. Please try again later.");
    }
  }

  // Faculty: Fetch forms assigned to the faculty member
  async getFormsByResponsibleParty(userId: string): Promise<SubmittedForm[]> {
    try {
      await this.ensureFaculty();
      const formsCollection = collection(this.db, "submittedForms");
      const q = query(
        formsCollection,
        where("responsibleParties", "array-contains", userId),
        where("status", "==", "pending") // Fetch only pending forms
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        formID: doc.id,
        ...doc.data(),
      })) as SubmittedForm[];
    } catch (error) {
      console.error("Error fetching forms by responsible party:", error);
      throw new Error("Failed to fetch assigned forms.");
    }
  }

  // Student: Submit a new form
  async submitForm(
    data: Omit<
      SubmittedFormData,
      "formID" | "status" | "submittedAt" | "responsibleParties"
    >
  ): Promise<void> {
    try {
      const user = await this.ensureStudent();
      if (user.uid !== data.submittedBy) {
        throw new Error("You can only submit forms on your behalf.");
      }

      // Fetch the form template to get the responsible parties
      const template = await this.fetchFormTemplateById(data.formTemplateId);
      if (
        !template ||
        !template.responsibleParties ||
        template.responsibleParties.length === 0
      ) {
        throw new Error("No responsible parties assigned for this form.");
      }

      // Assign the form to all responsible parties (assuming multiple)
      const responsibleParties = template.responsibleParties;

      const formsCollection = collection(this.db, "submittedForms");
      const docRef = await addDoc(formsCollection, {
        ...data,
        submittedAt: Timestamp.now(),
        status: "pending",
        comments: "",
        responsibleParties,
      });

      // Notify all responsible parties
      for (const partyId of responsibleParties) {
        await this.notifyUser(
          partyId,
          `A new form (${template.name}) has been submitted for your review.`,
          "info",
          docRef.id
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      throw new Error("Failed to submit form.");
    }
  }

  // Student: Resubmit a rejected form
  async resubmitForm(
    formID: string,
    updatedData: Partial<SubmittedFormData>
  ): Promise<void> {
    try {
      const user = await this.ensureStudent();
      const formRef = doc(this.db, "submittedForms", formID);
      const formSnapshot = await getDoc(formRef);
      const formData = formSnapshot.data() as SubmittedForm;

      if (!formSnapshot.exists()) {
        throw new Error("Form does not exist.");
      }

      if (formData.submittedBy !== user.uid) {
        throw new Error("You can only resubmit your own forms.");
      }

      if (formData.status !== "rejected") {
        throw new Error("Only rejected forms can be resubmitted.");
      }

      // Update the form data and status
      await updateDoc(formRef, {
        ...updatedData, // Updated student data
        status: "pending",
        comments: "", // Reset comments after resubmission
        facultyData: {},
        resubmittedAt: Timestamp.now(),
        resubmissionCount: (formData.resubmissionCount || 0) + 1,
      });

      // Notify all responsible parties
      for (const partyId of formData.responsibleParties) {
        await this.notifyUser(
          partyId,
          `A form (${formData.formType}) has been resubmitted by the student.`,
          "info",
          formID
        );
      }
    } catch (error) {
      console.error("Error resubmitting form:", error);
      throw new Error("Failed to resubmit form.");
    }
  }

  // Student: Fetch forms submitted by the user
  async getSubmittedFormsByUser(userId: string): Promise<SubmittedForm[]> {
    try {
      await this.ensureStudent();
      const formsQuery = query(
        collection(this.db, "submittedForms"),
        where("submittedBy", "==", userId)
      );
      const snapshot = await getDocs(formsQuery);
      return snapshot.docs.map((doc) => ({
        formID: doc.id,
        ...doc.data(),
      })) as SubmittedForm[];
    } catch (error) {
      console.error("Error fetching submitted forms by user:", error);
      throw new Error("Failed to fetch submitted forms.");
    }
  }

  // Student: Fetch a specific submitted form by ID
  async getSubmittedFormById(formID: string): Promise<SubmittedForm | null> {
    try {
      const user = await this.ensureStudent();
      const formRef = doc(this.db, "submittedForms", formID);
      const snapshot = await getDoc(formRef);
  
      if (!snapshot.exists()) {
        throw new Error("Form does not exist.");
      }
  
      const formData = snapshot.data() as SubmittedForm;
  
      if (formData.submittedBy !== user.uid) {
        throw new Error("You can only access your own forms.");
      }
  
      // Override formID with snapshot.id
      return {
        ...formData,
        formID: snapshot.id,
      };
    } catch (error) {
      console.error("Error fetching submitted form by ID:", error);
      throw new Error("Failed to fetch submitted form.");
    }
  }

  // Admin: Fetch all pending forms
  async getAllPendingForms(): Promise<SubmittedForm[]> {
    try {
      await this.ensureAdminOrFaculty();
      const formsQuery = query(
        collection(this.db, "submittedForms"),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(formsQuery);
      return snapshot.docs.map((doc) => ({
        formID: doc.id,
        ...doc.data(),
      })) as SubmittedForm[];
    } catch (error) {
      console.error("Error fetching pending forms:", error);
      throw new Error("Failed to fetch pending forms.");
    }
  }

  // Admin & Faculty: Approve or reject a submitted form
  async updateFormStatus(
    formID: string,
    status: "approved" | "rejected",
    comments: string = ""
  ): Promise<void> {
    try {
      const formRef = doc(this.db, "submittedForms", formID);
      const formSnapshot = await getDoc(formRef);
      const formData = formSnapshot.data() as SubmittedForm;

      if (!formSnapshot.exists()) {
        throw new Error("Form does not exist.");
      }

      // Ensure user is admin or authorized faculty
      await this.ensureAdminOrFaculty(formData);

      // Update the form status and add comments
      await updateDoc(formRef, {
        status,
        comments,
        updatedAt: Timestamp.now(),
      });

      // Notify the student
      await this.notifyUser(
        formData.submittedBy,
        `Your form (${formData.formType}) has been ${status}.`,
        status === "approved" ? "success" : "alert",
        formID
      );
    } catch (error) {
      console.error("Error updating form status:", error);
      throw new Error("Failed to update form status.");
    }
  }

  // Faculty: Fill in their part of the form
  async fillFacultySideOfForm(formID: string, facultyData: any): Promise<void> {
    try {
      const faculty = await this.ensureFaculty();
      const formRef = doc(this.db, "submittedForms", formID);
      const formSnapshot = await getDoc(formRef);
      const formData = formSnapshot.data() as SubmittedForm;

      if (!formSnapshot.exists()) {
        throw new Error("Form does not exist.");
      }

      if (!formData.responsibleParties.includes(faculty.uid)) {
        throw new Error("You are not authorized to fill this form.");
      }

      // Update facultyData and possibly change status if needed
      await updateDoc(formRef, {
        facultyData,
        updatedAt: Timestamp.now(),
      });

      // Notify the student about the feedback
      await this.notifyUser(
        formData.submittedBy,
        `Your form (${formData.formType}) has been reviewed by faculty.`,
        "update",
        formID
      );
    } catch (error) {
      console.error("Error filling faculty side of form:", error);
      throw new Error("Failed to fill faculty side of form.");
    }
  }

  // Faculty: Review and update form status (approved/rejected)
  async reviewAndUpdateForm(
    formID: string,
    status: "approved" | "rejected",
    comments: string,
    facultyData: any
  ): Promise<void> {
    try {
      // Fill faculty inputs
      await this.fillFacultySideOfForm(formID, facultyData);

      // Update form status
      await this.updateFormStatus(formID, status, comments);
    } catch (error) {
      console.error("Error reviewing and updating form:", error);
      throw new Error("Failed to review and update form.");
    }
  }

  // =====================
  // Notification Methods
  // =====================

  // Fetch notifications for a user
  async getUserNotifications(
    recipientId: string
  ): Promise<NotificationPayload[]> {
    try {
      const notificationsCollection = collection(this.db, "notifications");
      const q = query(
        notificationsCollection,
        where("recipientId", "==", recipientId),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data(); // Explicitly type the data
        return {
          message: data.message || "", // Ensure required fields are present
          type: data.type || "info", // Default value if type is missing
          timestamp: data.timestamp || Timestamp.now(),
          recipientId: data.recipientId || recipientId,
          relatedFormId: data.relatedFormId,
          relatedAppointmentId: data.relatedAppointmentId,
        } as NotificationPayload;
      });
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      throw new Error("Failed to fetch notifications.");
    }
  }

  // =====================
  // User Methods
  // =====================

  // Fetch user details by UID
  async getUserById(uid: string): Promise<User | null> {
    try {
      const userRef = doc(this.db, "users", uid);
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) {
        return null;
      }
      const data = snapshot.data();

      // Ensure all required fields are present
      const user: User = {
        userId: snapshot.id,
        name: data?.name || "Unnamed User",
        email: data?.email || "No Email",
        // Include other fields as defined in the User interface
        role: data?.role || "student", // If 'role' is part of the User interface
        isActive: data?.isActive !== undefined ? data.isActive : true, // If 'isActive' is part of the User interface
      };

      return user;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      throw new Error("Failed to fetch user details.");
    }
  }

  // Fetch multiple users by their UIDs
  async getUsersByIds(uids: string[]): Promise<User[]> {
    try {
      if (uids.length === 0) {
        return [];
      }

      // Firestore limits 'in' queries to 10 items. Handle accordingly.
      const chunks = [];
      for (let i = 0; i < uids.length; i += 10) {
        chunks.push(uids.slice(i, i + 10));
      }

      const users: User[] = [];

      for (const chunk of chunks) {
        const usersCollection = collection(this.db, "users");
        const q = query(usersCollection, where("uid", "in", chunk));
        const snapshot = await getDocs(q);
        users.push(
          ...snapshot.docs.map((doc) => ({
            userId: doc.id,
            name: doc.data()?.name || "Unnamed User",
            email: doc.data()?.email || "No Email",
            role: doc.data()?.role || "student",
            isActive:
              doc.data()?.isActive !== undefined
                ? doc.data()?.isActive
                : true,
          }))
        );
      }

      return users;
    } catch (error) {
      console.error("Error fetching users by IDs:", error);
      throw new Error("Failed to fetch user details.");
    }
  }

  // Enhance form templates with responsible parties' names
  async getFormTemplatesWithResponsiblePartyNames(
    templates: FormTemplate[]
  ): Promise<FormTemplate[]> {
    try {
      // Collect all unique UIDs from templates
      const allUIDs = Array.from(
        new Set(templates.flatMap((t) => t.responsibleParties))
      );
      const users = await this.getUsersByIds(allUIDs);
      // Map UIDs to names
      const uidToName = new Map(users.map((u) => [u.userId, u.name]));
      // Replace responsibleParties UIDs with names
      return templates.map((template) => ({
        ...template,
        responsiblePartyNames: template.responsibleParties.map(
          (uid) => uidToName.get(uid) || uid
        ),
      }));
    } catch (error) {
      console.error("Error enhancing form templates with names:", error);
      throw new Error("Failed to enhance form templates.");
    }
  }

  // =====================
  // Utility Methods
  // =====================

  // Additional utility methods can be added here as needed
}

const formService = new FormService();

export { formService };
