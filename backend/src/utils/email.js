const { Resend } = require('resend');

if (!process.env.RESEND_API_KEY) {
  console.error('Warning: RESEND_API_KEY is not set. Email functionality will be disabled.');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const sendPasswordResetEmail = async (email, resetToken) => {
  if (!resend) {
    console.error('Email service not configured. Please set RESEND_API_KEY in your environment variables.');
    return false;
  }

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  console.log('Sending reset email to:', email);
  console.log('Reset URL:', resetUrl);
  
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Password Reset Request</h2>
          <p>You have requested to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(to right, #4F46E5, #7C3AED, #EC4899);
                      color: white;
                      padding: 12px 24px;
                      text-decoration: none;
                      border-radius: 6px;
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6B7280; font-size: 14px;">
            If you didn't request this password reset, please ignore this email or contact support if you have concerns.
          </p>
          <p style="color: #6B7280; font-size: 14px;">
            This link will expire in 1 hour for security reasons.
          </p>
        </div>
      `
    });
    console.log('Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    if (error.response) {
      console.error('Resend API Error:', error.response.data);
    }
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendPasswordResetEmail
}; 