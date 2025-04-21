// types/email.d.ts
export type EmailType = "order-confirmation" | "password-reset";

export interface EmailPayload {
  to: string;
  subject: string;
  type: EmailType;
  order?: Order;
  resetLink?: string;
}
