import type { FieldValue } from "firebase/firestore";

export interface CommissionRate {
  rate: number; // The commission rate as a percentage (e.g., 10 for 10%)
  remarks: string; // Any additional notes or comments about the commission rate
  status: "active" | "inactive"; // The status of the commission rate
  dateCreated: Date | FieldValue; // The date when the commission rate was created
  lastModified: Date | FieldValue; // The date when the commission rate was last modified
  isArchived: boolean | FieldValue; // Indicates if the commission rate is archived
}

export interface CommissionRateWithId extends CommissionRate {
  id: string; // Firestore document ID
}
