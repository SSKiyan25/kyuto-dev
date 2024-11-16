export interface Organization {
  name: string;
  contactEmail: string;
  address: string;
  addressImages: string[];
  description?: string;
  phoneNumber?: string;
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
  organizationID: string;
  accountID: string;
  role: string;
  dateCreated: Date;
}

export interface OrganizationViews {
  organizationID: string;
  accountID: string;
  generatedAt: Date;
}
