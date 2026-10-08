export function welcomeEmailTemplate(params: {
  firstName: string;
  brxUid: string;
  email: string;
  appUrl: string;
}) {
  const {
    firstName,
    brxUid,
    email,
    appUrl,
  } = params;

  return {
    subject: 'Welcome to BRX EduNexa — Your BRX UID',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="
  margin:0;
  padding:0;
  background:#f4f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#172033;
">

  <div style="
    max-width:620px;
    margin:40px auto;
    background:#ffffff;
    border-radius:20px;
    overflow:hidden;
    box-shadow:0 10px 40px rgba(20,40,80,.08);
  ">

    <div style="
      padding:32px;
      background:linear-gradient(135deg,#172554,#4f46e5);
      color:white;
    ">
      <h1 style="margin:0;font-size:28px;">
        BRX EduNexa
      </h1>

      <p style="
        margin:8px 0 0;
        opacity:.9;
      ">
        Education Management Platform
      </p>
    </div>

    <div style="padding:32px">

      <h2 style="margin-top:0;">
        Welcome, ${firstName}! 👋
      </h2>

      <p>
        Your BRX EduNexa account has been created successfully.
      </p>

      <div style="
        margin:24px 0;
        padding:22px;
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:16px;
      ">

        <p style="margin:0 0 8px;color:#64748b;">
          Your permanent BRX UID
        </p>

        <div style="
          font-size:24px;
          font-weight:700;
          letter-spacing:2px;
          color:#312e81;
        ">
          ${brxUid}
        </div>

      </div>

      <p>
        Registered email:
        <strong>${email}</strong>
      </p>

      <p>
        You can use your email or BRX UID to sign in.
      </p>

      <a
        href="${appUrl}/login"
        style="
          display:inline-block;
          margin-top:14px;
          padding:13px 24px;
          background:#4f46e5;
          color:white;
          text-decoration:none;
          border-radius:10px;
          font-weight:600;
        "
      >
        Login to BRX EduNexa
      </a>

      <p style="
        margin-top:30px;
        font-size:13px;
        color:#64748b;
      ">
        Your BRX UID is permanent and cannot be changed.
        Keep this email safe.
      </p>

    </div>
  </div>

</body>
</html>
`,
  };
}