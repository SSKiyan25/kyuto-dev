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
  featuredPhoto: string;
  photos: string[];
}
export interface Variation {
  productID: string;
  value: string;
  isAvailable: boolean;
  stocks: number;
  currentPrice: number;
}

export interface PriceHistory {
  variationID: string;
  price: number;
  discountPrice: number;
  dateCreated: Date;
  dateModified: Date;
}
