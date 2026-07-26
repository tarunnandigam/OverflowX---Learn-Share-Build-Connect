const { sendOTPEmail } = require("./sendEmail");

/**
 * Sends a simulated or real SMS OTP code.
 * If TWILIO_ACCOUNT_SID is provided, it tries to use Twilio (requires 'twilio' npm package).
 * Otherwise it logs securely to the console in development mode.
 * 
 * @param {string} phone - Destination phone number
 * @param {string} message - Message body containing the OTP
 * @returns {Promise<{success: boolean, mode: string, sid?: string, error?: string}>}
 */
const sendSMS = async (phone, message) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  // Normalize phone number to international format
  if (phone) {
    phone = phone.trim().replace(/\s+/g, '');
    if (!phone.startsWith('+')) {
      if (phone.length === 10) {
        phone = '+91' + phone;
      } else if (phone.startsWith('91') && phone.length === 12) {
        phone = '+' + phone;
      }
    }
  }

  // Fallback to Console Print in Dev Mode if credentials are not configured
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n=========================================');
      console.log(`[SMS GATEWAY] Sent SMS to: ${phone}`);
      console.log(`Message: ${message}`);
      console.log('=========================================\n');
    }
    return { success: true, mode: 'dev', message };
  }

  try {
    let twilio;
    try {
      twilio = require('twilio');
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n=========================================');
        console.log(`[SMS GATEWAY] Twilio package is not installed (npm install twilio).`);
        console.log(`Sent OTP to: ${phone}`);
        console.log(`Message: ${message}`);
        console.log('=========================================\n');
      }
      return { success: true, mode: 'dev-no-package', message };
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, {
      timeout: 1500
    });
    const response = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: phone,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Twilio SMS] Message sent to ${phone}: ${response.sid}`);
    }
    return { success: true, mode: 'twilio', sid: response.sid };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[Twilio SMS Error] Failed to send to ${phone}:`, error);
    }
    return { success: false, mode: 'twilio-error', error: error.message };
  }
};

module.exports = { sendSMS };
