export function registrationOtpEmailTemplate(params: {
  firstName: string;
  otp: string;
  expiresInMinutes: number;
  appUrl: string;
}) {
  return {
    subject: `${params.otp} is your BRX EduNexa verification code`,

    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BRX EduNexa Verification</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:40px auto;padding:20px;">

    <div style="background:#ffffff;border-radius:16px;padding:36px 28px;border:1px solid #e5eaf2;">

      <div style="text-align:center;margin-bottom:28px;">
        <h1 style="margin:0;color:#172554;font-size:28px;">
          BRX EduNexa
        </h1>

        <p style="margin:8px 0 0;color:#64748b;font-size:14px;">
          Education Management Platform
        </p>
      </div>

      <h2 style="color:#0f172a;font-size:22px;">
        Verify your email
      </h2>

      <p style="color:#475569;font-size:15px;line-height:1.7;">
        Hello ${params.firstName},
      </p>

      <p style="color:#475569;font-size:15px;line-height:1.7;">
        Use the verification code below to continue your BRX EduNexa registration.
      </p>

      <div style="text-align:center;margin:30px 0;">
        <div style="
          display:inline-block;
          padding:16px 28px;
          background:#eef2ff;
          border-radius:12px;
          color:#1e3a8a;
          font-size:32px;
          font-weight:700;
          letter-spacing:8px;
        ">
          ${params.otp}
        </div>
      </div>

      <p style="color:#64748b;font-size:14px;text-align:center;">
        This code expires in ${params.expiresInMinutes} minutes.
      </p>

      <p style="color:#64748b;font-size:13px;line-height:1.6;margin-top:28px;">
        If you did not request this verification code, you can safely ignore this email.
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />

      <p style="color:#94a3b8;font-size:12px;text-align:center;">
        © BRX EduNexa. All rights reserved.
      </p>

    </div>
  </div>
</body>
</html>
`,
  };
}
