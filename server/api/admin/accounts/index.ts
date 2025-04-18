import { adminAuth, adminFirestore } from "~/server/utils/firebase-admin";
import type { Account } from "~/types/models/Account";

export default defineEventHandler(async (event) => {
  try {
    const accountsCollection = adminFirestore.collection("accounts");
    const querySnapshot = await accountsCollection.get();

    const accounts = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const authUser = await adminAuth.getUser(doc.id); // Fetch user from Firebase Auth

        return {
          id: doc.id,
          email: authUser.email || "",
          username: data.username || "",
          role: data.role || "user",
          firstname: data.firstname || "",
          lastname: data.lastname || "",
          department: data.department || "",
          studentID: data.studentID || "",
          avatarURL: data.avatarURL || "",
          phoneNumber: data.phoneNumber || "",
          college: data.college || "",
          course: data.course || "",
          hasOrganization: data.hasOrganization || false,
          organization: data.organization || "",
          organizationID: data.organizationID || "",
          organizationRole: data.organizationRole || "",
          dateCreated: data.dateCreated ? data.dateCreated.toDate() : new Date(),
          lastModified: data.lastModified ? data.lastModified.toDate() : new Date(),
          isArchived: data.isArchived || false,
          disabled: authUser.disabled || false,
        };
      })
    );

    return accounts;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch accounts",
    });
  }
});
