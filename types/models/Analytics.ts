export interface ProductAnalytics {
  productID: string;
  name: string;
  viewCount: number;
  orderCount: number;
  totalQuantitySold: number;
  totalRevenue: number;
  conversionRate: number;
}

export interface OrganizationAnalytics {
  totalOrders: number;
  totalRevenue: number;
  totalProductsViewed: number;
  popularProducts: ProductAnalytics[];
}
