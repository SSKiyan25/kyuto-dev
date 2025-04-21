import { useOrganization } from "~/composables/useOrganizationValues";
import { doc, getDoc } from "firebase/firestore";
import type { Account } from "~/types/models/Account";

export const useEmailOrder = () => {
  const db = useFirestore();
  const { getOrganizationById } = useOrganization();

  const sendOrderEmail = async (
    uniqRefNumber: string,
    userID: string,
    organizationID: string,
    orderDetails: {
      totalPrice: number;
      items: Array<{ name: string; quantity: number; priceWithCommission: number }>;
    }
  ) => {
    try {
      // Fetch organization details
      const organization = await getOrganizationById(organizationID);
      // Fetch user details
      const userRef = doc(db, "accounts", userID);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User not found");
      }

      const userData = userSnap.data() as Partial<Account>;
      const response = await $fetch("/api/send-email", {
        method: "POST",
        body: {
          to: userData.email,
          subject: `[Verch] Order Confirmation - ${uniqRefNumber}`,
          text: `Thank you for your order (Ref: ${uniqRefNumber}). Total: ₱${orderDetails.totalPrice}`,
          html: `
            <h1>Order Confirmation</h1>
            <p>Thank you for your purchase! Below are the details of your order:</p>
            <h3>Order Details</h3>
            <p><strong>Order Reference:</strong> ${uniqRefNumber}</p>
            <p><strong>Total Price:</strong> ₱${orderDetails.totalPrice}</p>
            <h3>Items:</h3>
            <ul>
              ${orderDetails.items
                .map(
                  (item) => `
                <li>${item.name} - ${item.quantity} x ₱${item.priceWithCommission}</li>
              `
                )
                .join("")}
            </ul>
            <h3>Contact Information</h3>
            <p>If you have any questions or concerns regarding your order, you can contact the organization/seller of the merchandise:</p>
            <p><strong>Email:</strong> ${organization.contactEmail || "Not provided"}</p>
            <p><strong>Phone:</strong> ${organization.phoneNumber || "Not provided"}</p>
            <p><strong>Address:</strong> ${organization.address || "Not provided"}</p>
            <br>
            <p>If your questions or concerns are related to the Verch platform (e.g., account issues, payment problems, or technical support), you can contact us directly:</p>
            <p><strong>Verch Support Email:</strong> verchcsofficial@gmail.com</p>
            <br>
            <p>We appreciate your business and look forward to serving you again!</p>
            <br>
            <p>Best regards,</p>
            <p><strong>${organization.name}</strong></p>
          `,
        },
      });

      return response;
    } catch (error) {
      console.error("Email send failed:", error);
      throw error;
    }
  };

  return { sendOrderEmail };
};
