export function passwordResetOtpEmailTemplate(params: {
  firstName: string;
  otp: string;
  expiresInMinutes: number;
  appUrl: string;
}) {
  return {
    subject: 'BRX EduNexa Password Reset OTP',

    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset OTP</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">

  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 8px 30px rgba(0,0,0,0.08);">

    <h2 style="margin:0 0 12px;color:#172554;">
      BRX EduNexa
    </h2>

    <p style="color:#334155;font-size:16px;">
      Hello ${params.firstName},
    </p>

    <p style="color:#475569;font-size:15px;line-height:1.6;">
      We received a request to reset your BRX EduNexa password.
      Use the OTP below to continue.
    </p>

    <div style="margin:28px 0;text-align:center;">
      <div style="display:inline-block;padding:16px 28px;border-radius:12px;background:#eef2ff;color:#1e3a8a;font-size:32px;font-weight:700;letter-spacing:8px;">
        ${params.otp}
      </div>
    </div>

    <p style="color:#64748b;font-size:14px;text-align:center;">
      This OTP expires in ${params.expiresInMinutes} minutes.
    </p>

    <p style="color:#64748b;font-size:13px;line-height:1.6;">
      If you did not request a password reset, you can safely ignore this email.
      Never share your OTP with anyone.
    </p>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />

    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      © BRX EduNexa. All rights reserved.
    </p>

  </div>

</body>
</html>
`,
  };
}