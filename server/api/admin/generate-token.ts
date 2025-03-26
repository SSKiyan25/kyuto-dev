import { adminAuth, adminFirestore } from "../../utils/firebase-admin";

export default defineEventHandler(async (event) => {
  // 1. Verify Firebase ID Token
  const authHeader = event.node.req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  const { uid, email } = await adminAuth.verifyIdToken(idToken);

  // 2. Check Firestore for admin role
  const userDoc = await adminFirestore.doc(`accounts/${uid}`).get();
  const userData = userDoc.data();

  if (userData?.role !== "admin") {
    throw createError({ statusCode: 403, message: "Admin access required" });
  }

  // 3. Generate token for requested UID
  const { uid: targetUid } = await readBody(event);
  return { token: await adminAuth.createCustomToken(targetUid) };
});
