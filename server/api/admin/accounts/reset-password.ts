import { adminAuth } from "~/server/utils/firebase-admin";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email } = body;

  if (!email) {
    throw createError({
      statusCode: 400,
      message: "Email is required",
    });
  }

  try {
    // Generate a password reset link
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    return { success: true, resetLink };
  } catch (error) {
    console.error("Error generating password reset link:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to generate password reset link",
    });
  }
});
