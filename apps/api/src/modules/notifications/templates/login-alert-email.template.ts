export function loginAlertEmailTemplate(params: {
  firstName: string;
  brxUid: string;
  email: string;
  deviceType: string;
  deviceName: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string;
  loginTime: string;
  appUrl: string;
}) {
  return {
    subject: 'New login detected — BRX EduNexa',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
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
  background:#fff;
  border-radius:20px;
  overflow:hidden;
  box-shadow:0 10px 40px rgba(20,40,80,.08);
">

  <div style="
    padding:30px;
    background:linear-gradient(135deg,#172554,#4f46e5);
    color:white;
  ">
    <h1 style="margin:0;">
      BRX EduNexa
    </h1>

    <p style="margin:8px 0 0;">
      Security notification
    </p>
  </div>

  <div style="padding:32px">

    <h2 style="margin-top:0;">
      New login detected 🔐
    </h2>

    <p>
      Hi ${params.firstName}, your BRX EduNexa account was just
      signed in from a new session.
    </p>

    <div style="
      margin-top:24px;
      border:1px solid #e2e8f0;
      border-radius:16px;
      overflow:hidden;
    ">

      <div style="padding:14px 18px;background:#f8fafc;">
        <strong>Login details</strong>
      </div>

      <div style="padding:18px">

        <p>
          <strong>Device:</strong>
          ${params.deviceName}
        </p>

        <p>
          <strong>Device type:</strong>
          ${params.deviceType}
        </p>

        <p>
          <strong>Browser:</strong>
          ${params.browser}
        </p>

        <p>
          <strong>Operating system:</strong>
          ${params.operatingSystem}
        </p>

        <p>
          <strong>IP address:</strong>
          ${params.ipAddress}
        </p>

        <p>
          <strong>Time:</strong>
          ${params.loginTime}
        </p>

        <p>
          <strong>BRX UID:</strong>
          ${params.brxUid}
        </p>

      </div>
    </div>

    <p style="
      margin-top:28px;
      padding:16px;
      background:#fff7ed;
      border-radius:12px;
      color:#9a3412;
    ">
      If you don't recognize this login, open your
      Security page and sign out the session.
    </p>

    <a
      href="${params.appUrl}/security/sessions"
      style="
        display:inline-block;
        margin-top:10px;
        padding:13px 24px;
        background:#4f46e5;
        color:white;
        text-decoration:none;
        border-radius:10px;
        font-weight:600;
      "
    >
      Review Login Sessions
    </a>

  </div>
</div>

</body>
</html>
`,
  };
}