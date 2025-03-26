export interface Organization {
  // Core Information
  id: string; // Firestore document ID
  name: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
  addressImagesURL: string[];

  // Representations
  logoImageURL: string;
  coverImageURL: string;
  description: string;
  imagesURL: string[];

  // Accounts (limited to 3 roles as separate fields)
  adminAccounts: string[];
  managerAccounts: string[];
  staffAccounts: string[];

  // Transactions Summary
  totalTransactionCount: number;
  paidTransactionCount: number;
  unpaidTransactionCount: number;

  dateCreated: Date;
  lastModified: Date;
  // Verifications & Statuses
  isVerified: boolean;
  isArchived: boolean;
}

export interface OrganizationViews {
  organizationID: string;
  accountID: string;
  generatedAt: Date;
}
