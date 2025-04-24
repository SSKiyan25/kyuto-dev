export interface Order {
  buyerID: string;
  organizationID: string;
  orderStatus: string;
  uniqRefNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  commissionStatus: string;
  commissionAmount: number;
  commissionRateID: string;
  remarks: string;
  totalPrice: number;
  isDiscounted: boolean;
  isRequestedForDiscount: boolean;
  discountCode: string;
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
  isPreOrder: boolean;
  isPackage: boolean;
  packageID: string;
  variationID: string;
  variationName: string;
  quantity: number;
  origPrice: number;
  discountedPrice: number;
  totalPrice: number;
  priceWithCommission: number;
  commissionRateID: string;
}

export type OrderWithOrgName = Partial<Order> & {
  id: string;
  organizationName: string;
};
