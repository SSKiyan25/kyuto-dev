export interface Organization {
  // Core Information
  id: string; // Firestore document ID
  name: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
  addressImagesURL: { url: string; path: string }[];
  searchKeywords: string[];

  // Representations
  logoImageURL: string;
  logoImagePath: string;
  coverImageURL: string;
  coverImagePath: string;
  description: string;
  imagesURL: { url: string; path: string }[];

  // Accounts (limited to 3 roles as separate fields)
  adminAccounts: string[];
  managerAccounts: string[];
  staffAccounts: string[];

  // Financials
  totalPaid: number;
  totalDue: number;
  lastPaymentDate: Date;

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
