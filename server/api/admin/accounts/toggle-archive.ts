import { adminFirestore } from "~/server/utils/firebase-admin";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { uid, isArchived } = body;

  if (!uid || typeof isArchived !== "boolean") {
    throw createError({
      statusCode: 400,
      message: "Invalid request data",
    });
  }

  try {
    const accountRef = adminFirestore.collection("accounts").doc(uid);
    await accountRef.update({ isArchived });

    return { success: true };
  } catch (error) {
    console.error("Error toggling archive status:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to toggle archive status",
    });
  }
});
