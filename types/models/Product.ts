export interface Product {
  accountID: string;
  organization: string;
  name: string;
  category: string;
  description: string;
  status: string;
  dateCreated: Date;
  lastModified: Date;
  isApproved: boolean;
  totalSales: number;
  views: number;
  isArchived: boolean;
}
