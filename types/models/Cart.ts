export interface Cart {
  accountID: string;
  productID: string;
  variationID: string;
  isPackage: boolean;
  packageID: string;
  quantity: number;
  status: string;
  dateCreated: Date;
}
