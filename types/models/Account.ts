export interface Account {
  id: string;
  email: string;
  username: string;
  role: string;
  firstname: string;
  lastname: string;
  department: string;
  studentID: string;
  avatarURL: string;
  phoneNumber: string;
  faculty: string;
  course: string;
  hasOrganization: boolean;
  organization?: string;
  organizationID: string;
  organizationRole: string;
  dateCreated: Date;
  lastModified: Date;
  isArchived: boolean;
  isVerified: boolean;
  consentedToPrivacyAndTerms: boolean;
  disabled: boolean;
}
