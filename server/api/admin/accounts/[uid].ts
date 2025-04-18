import { adminAuth, adminFirestore } from "~/server/utils/firebase-admin";

export default defineEventHandler(async (event) => {
  const { uid } = event.context.params as { uid: string };

  try {
    const docRef = adminFirestore.collection("accounts").doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw createError({ statusCode: 404, message: "Account not found" });
    }

    const authUser = await adminAuth.getUser(uid);

    return {
      id: uid,
      ...docSnap.data(),
      email: authUser.email,
      emailVerified: authUser.emailVerified,
      disabled: authUser.disabled,
    };
  } catch (error) {
    console.error("Error fetching account:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch account",
    });
  }
});
