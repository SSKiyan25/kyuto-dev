export interface Package {
  accountID: string;
  organizationID: string;
  organizationName: string;
  name: string;
  status: string;
  price: number;
  isApproved: boolean;
  totalSales: number;
  dateCreated: Date;
  lastModified: Date;
  isArchived: boolean;
}

export interface PackageItem {
  packageID: string;
  productID: string;
  dateAdded: Date;
}
