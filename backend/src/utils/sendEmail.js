/**
 * Helper: Sends email via Resend HTTP API.
 */
const sendViaResendAPI = async (toEmail, subject, htmlContent, textContent, toName) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "OverflowX <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured in environment variables.");
  }

  const payload = {
    from: fromEmail,
    to: toEmail,
    subject: subject,
    html: htmlContent,
    text: textContent
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'overflowx/1.0'
    },
    body: JSON.stringify(payload)
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message || `Resend API error: ${response.status}`);
  }
  return responseData;
};

/**
 * Sends a simplified OTP email to a user.
 */
const sendOTPEmail = async (email, otp, username) => {
  const subject = `OverflowX Verification Code: ${otp}`;
  const text = `Your OverflowX verification code is: ${otp}\n\nThis code is valid for 15 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4f46e5;">OverflowX Verification</h2>
      <p>Hello <strong>${username || 'Learner'}</strong>,</p>
      <p>Your verification code is: <strong style="font-size: 24px; color: #4f46e5; letter-spacing: 2px;">${otp}</strong></p>
      <p>This code is valid for 15 minutes.</p>
    </div>
  `;

  try {
    const result = await sendViaResendAPI(email, subject, html, text, username);
    return { success: true, mode: 'resend-api', messageId: result.id };
  } catch (error) {
    console.error(`[Resend Error] Failed to send OTP email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a simplified password reset email to a user.
 */
const sendPasswordResetEmail = async (email, password, username) => {
  const subject = `OverflowX Password Reset`;
  const text = `Your temporary password is: ${password}\n\nPlease change it after logging in.`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #e11d48;">OverflowX Password Reset</h2>
      <p>Hello <strong>${username || 'Learner'}</strong>,</p>
      <p>Your temporary password is: <strong style="font-size: 20px; color: #e11d48;">${password}</strong></p>
      <p>Please change this password immediately after logging in.</p>
    </div>
  `;

  try {
    const result = await sendViaResendAPI(email, subject, html, text, username);
    return { success: true, mode: 'resend-api', messageId: result.id };
  } catch (error) {
    console.error(`[Resend Error] Failed to send password reset email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a simplified Login Verification OTP email to a user.
 */
const sendLoginOTPEmail = async (email, otp, username) => {
  const subject = `OverflowX Login Verification Code: ${otp}`;
  const text = `Your login verification code is: ${otp}\n\nThis code is valid for 15 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4f46e5;">OverflowX Login Verification</h2>
      <p>Hello <strong>${username || 'Learner'}</strong>,</p>
      <p>Your login verification code is: <strong style="font-size: 24px; color: #4f46e5; letter-spacing: 2px;">${otp}</strong></p>
      <p>This code is valid for 15 minutes.</p>
    </div>
  `;

  try {
    const result = await sendViaResendAPI(email, subject, html, text, username);
    return { success: true, mode: 'resend-api', messageId: result.id };
  } catch (error) {
    console.error(`[Resend Error] Failed to send login OTP email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a simplified subscription invoice email to a user.
 */
const sendSubscriptionInvoiceEmail = async (email, username, planName, amount, invoiceId) => {
  const subject = `OverflowX Invoice - ${planName} Subscription`;
  const text = `Hi ${username},\n\nThank you for subscribing to our ${planName} Plan. Here are your subscription details:\n\nInvoice ID: ${invoiceId}\nPlan: ${planName}\nAmount Paid: ₹${amount}.00\n\nBest regards,\nOverflowX Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 500px;">
      <h2 style="color: #4f46e5; border-bottom: 2px solid #eee; padding-bottom: 10px;">OverflowX Invoice</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Thank you for subscribing to the <strong>${planName} Plan</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr><th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd; color: #888;">Invoice ID</th><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${invoiceId}</td></tr>
        <tr><th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd; color: #888;">Plan Name</th><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${planName}</td></tr>
        <tr><th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd; color: #888;">Amount Paid</th><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #4f46e5;">₹${amount}.00</td></tr>
      </table>
      <p>Keep learning and sharing knowledge!</p>
    </div>
  `;

  try {
    const result = await sendViaResendAPI(email, subject, html, text, username);
    return { success: true, mode: 'resend-api', messageId: result.id };
  } catch (error) {
    console.error(`[Resend Error] Failed to send subscription invoice email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPEmail, sendPasswordResetEmail, sendLoginOTPEmail, sendSubscriptionInvoiceEmail };
