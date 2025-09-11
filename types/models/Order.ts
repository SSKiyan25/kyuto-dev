export interface Order {
  // Existing fields
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

  // New date tracking fields
  datePending?: Date;
  dateReady?: Date;
  datePaid?: Date;
  dateCompleted?: Date;
  dateCancelled?: Date;
  dateRefunded?: Date;

  // Status history for comprehensive tracking
  statusHistory?: Array<{
    status: string;
    date: Date;
    previousStatus?: string;
    updatedBy?: string;
    remarks?: string;
  }>;
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
