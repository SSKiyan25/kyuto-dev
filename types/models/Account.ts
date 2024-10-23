export interface Account {
  id: string;
  email: string;
  username: string;
  avatar: string;
  organization?: string;
  firstname: string;
  lastname: string;
  department?: string;
  studentId?: string;
  phoneNumber: string;
  dateCreated: Date;
  role: string;
  isVerified: boolean;
}
