import { adminAuth, adminFirestore } from "~/server/utils/firebase-admin";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { uid } = body;

  if (!uid) {
    throw createError({
      statusCode: 400,
      message: "Invalid request data",
    });
  }

  try {
    // Delete the user from Firebase Auth
    await adminAuth.deleteUser(uid);

    // Delete the Firestore document
    const accountRef = adminFirestore.collection("accounts").doc(uid);
    await accountRef.delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to delete account",
    });
  }
});
