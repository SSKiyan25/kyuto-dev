export interface Transaction {
  // Core Identifiers
  id: string; // Firestore document ID
  organizationId: string; // Reference to Organization
  adminId: string; // Reference to Admin account who processed

  // Payment Tracking
  referenceNumber: string; // Format: ORG-YYYYMMDD-001
  paymentPeriod: string; // Format: "YYYY-MM" for monthly billing

  // Financial Breakdown
  baseFee: number; // Fixed admin fee
  transactionFee: number; // Percentage of revenue
  subtotalAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;

  // Payment Details
  paymentMethod: "bank_transfer" | "cash_on_hand" | "digital_wallet" | "N/A";
  paymentReference: string; // Bank reference/transaction ID
  paymentDate: Date | null; // Null until paid

  // Status Tracking
  status: "draft" | "issued" | "paid" | "overdue" | "voided";
  dueDate: Date;

  // Audit Trail
  createdDate: Date;
  modifiedDate: Date;
  processedBy: string; // Admin account ID who last modified
}
