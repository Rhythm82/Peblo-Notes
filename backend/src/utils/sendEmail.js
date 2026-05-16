const BREVO_EMAIL_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendOtpEmail(to, otp) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is missing.");
  }

  if (!process.env.EMAIL_FROM_EMAIL) {
    throw new Error("EMAIL_FROM_EMAIL is missing.");
  }

  const senderName = process.env.EMAIL_FROM_NAME || "PebloNotes";
  const htmlContent = `
    <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;box-shadow:0 12px 30px rgba(15,23,42,0.08);">
          <p style="margin:0 0 8px;color:#0891b2;font-size:13px;font-weight:700;text-transform:uppercase;">PebloNotes Verification</p>
          <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:#0f172a;">Your verification code</h1>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#334155;">Use this code to finish creating your PebloNotes account.</p>
          <div style="margin:24px 0;padding:20px;border-radius:14px;background:#ecfeff;border:1px solid #a5f3fc;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0e7490;">Verification code</p>
            <p style="margin:0;font-size:36px;line-height:1;font-weight:800;letter-spacing:8px;color:#0f172a;">${otp}</p>
          </div>
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#334155;">This code is used to verify your PebloNotes account.</p>
          <p style="margin:0;padding-top:20px;border-top:1px solid #e2e8f0;font-size:13px;line-height:1.6;color:#64748b;">If you did not request this, you can ignore this email.</p>
        </div>
      </div>
    </div>
  `;

  const response = await fetch(BREVO_EMAIL_API_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: process.env.EMAIL_FROM_EMAIL,
      },
      to: [{ email: to }],
      subject: "Your PebloNotes verification code",
      htmlContent,
      textContent: `Your PebloNotes verification code is ${otp}`,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Brevo OTP email failed:", errorBody);
    throw new Error("Could not send OTP email.");
  }

  try {
    return await response.json();
  } catch {
    return { success: true };
  }
}
