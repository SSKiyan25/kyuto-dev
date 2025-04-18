import { adminAuth, adminFirestore } from "~/server/utils/firebase-admin";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const { email, password, accountData } = body;

    // Create Auth user
    const { uid } = await adminAuth.createUser({
      email,
      password,
      disabled: false,
      emailVerified: false,
    });

    // Create Firestore document
    await adminFirestore
      .collection("accounts")
      .doc(uid)
      .set({
        ...accountData,
        id: uid,
        dateCreated: new Date(),
        lastModified: new Date(),
      });

    return { uid };
  } catch (error) {
    console.error("Error creating account:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to create account",
    });
  }
});
