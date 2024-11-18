export interface Organization {
  name: string;
  contactEmail: string;
  address: string;
  addressImagesURL: string[];
  description: string;
  phoneNumber: string;
  iconURL: string;
  accounts: OrganizationAccount[];
  imagesURL: string[];
  isVerified: boolean;
  isPremium: boolean;
  premiumStartDate: Date;
  premiumEndDate: Date;
  isAutoRenew: boolean;
  dateCreated: Date;
  lastModified: Date;
  isArchived: boolean;
}

export interface OrganizationAccount {
  accountID: string;
  role: string;
}

export interface OrganizationViews {
  organizationID: string;
  accountID: string;
  generatedAt: Date;
}
