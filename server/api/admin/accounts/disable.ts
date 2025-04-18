import { adminAuth } from "~/server/utils/firebase-admin";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { uid, disabled } = body;

  if (!uid || typeof disabled !== "boolean") {
    throw createError({
      statusCode: 400,
      message: "Invalid request data",
    });
  }

  try {
    // Update the user's disabled status
    await adminAuth.updateUser(uid, { disabled });

    return { success: true };
  } catch (error) {
    console.error("Error updating account status:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to update account status",
    });
  }
});
