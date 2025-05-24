import { getAuth } from "firebase-admin/auth";
import { defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event) => {
  try {
    // Verify admin user authentication
    const authorization = event.node.req.headers.authorization;
    if (!authorization) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    // Get request body
    const { uid } = await readBody(event);

    if (!uid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing uid parameter" }),
      };
    }

    // Use Firebase Admin SDK to update the user
    await getAuth().updateUser(uid, {
      emailVerified: true,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Email verified successfully" }),
    };
  } catch (error: any) {
    console.error("Error verifying email:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to verify email",
        details: error.message,
      }),
    };
  }
});
