export interface Product {
  accountID: string;
  organizationID: string;
  organization: string;
  name: string;
  category: string;
  status: string;
  description: string;
  isApproved: boolean;
  totalSales: number;
  totalOrders: number;
  isDiscounted: boolean;
  discountType: string;
  discountTarget: string;
  discountPercentageValue: number;
  featuredPhotoURL: string;
  photosURL: string[];
  canPreOrder: boolean;
  dateCreated: Date;
  lastModified: Date;
  isArchived: boolean;
}
export interface Variation {
  productID: string;
  value: string;
  price: number;
  discountPrice: number;
  pendingOrders: number;
  fulfilledOrders: number;
  cancelledOrders: number;
  totalStocks: number;
  remainingStocks: number;
  lastStockUpdate: Date;
  dateAdded: Date;
  lastModified: Date;
  isArchived: boolean;
}

export interface StocksLogs {
  variationID: string;
  quantity: number;
  action: string;
  remarks: string;
  dateCreated: Date;
}

export interface ProductViews {
  productID: string;
  accountID: string;
  generatedAt: Date;
}
