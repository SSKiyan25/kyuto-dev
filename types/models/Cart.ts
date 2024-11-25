export interface Cart {
  accountID: string;
  productID: string;
  variationID: string;
  isPreOrder: boolean;
  isPackage: boolean;
  packageID: string;
  quantity: number;
  status: string;
  dateCreated: Date;
}
