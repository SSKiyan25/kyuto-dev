export interface Order {
  buyerID: string;
  organizationID: string;
  organizationName: string;
  orderStatus: string;
  uniqRefNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  isPreOrder: boolean;
  remarks: string;
  totalPrice: number;
  isDiscounted: boolean;
  discountValue: number;
  isPackage: boolean;
  receivedDate: Date;
  dateOrdered: Date;
  lastModified: Date;
  isArchived: boolean;
}

export interface OrderItem {
  orderID: string;
  productID: string;
  variationID: string;
  variationName: string;
  quantity: number;
  price: number;
  discountPrice: number;
  totalPrice: number;
  dateAdded: Date;
}
