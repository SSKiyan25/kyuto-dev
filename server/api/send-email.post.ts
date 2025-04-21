// server/api/send-email.post.ts
export default defineEventHandler(async (event) => {
  const { sendMail } = useNodeMailer();
  const body = await readBody(event);

  try {
    const info = await sendMail({
      to: body.to,
      subject: body.subject,
      text: body.text,
      html: body.html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});
