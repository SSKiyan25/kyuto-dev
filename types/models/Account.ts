export interface Account {
  id: string;
  email: string;
  username: string;
  role: string;
  firstname: string;
  lastname: string;
  department: string;
  studentId: string;
  avatarURL: string;
  phoneNumber: string;
  hasOrganization: boolean;
  organization?: string;
  organizationID: string;
  organizationRole: string;
  dateCreated: Date;
  lastModified: Date;
  isArchived: boolean;
}
