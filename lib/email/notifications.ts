/**
 * K-Universal Email Notification System
 * 결제 실패, 구독 변경 등의 이메일 알림
 *
 * 환경 변수:
 * - RESEND_API_KEY: Resend API 키 (선택사항)
 * - EMAIL_FROM: 발신자 이메일 (기본값: noreply@fieldnine.io)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'K-Universal <noreply@fieldnine.io>';
const IS_EMAIL_CONFIGURED = !!RESEND_API_KEY;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend API
 * Falls back to logging if not configured
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!IS_EMAIL_CONFIGURED) {
    // 이메일 서비스 미설정 시 로그만 출력
    console.log('[Email] Service not configured. Would send:', {
      to: options.to,
      subject: options.subject,
    });
    return { success: true }; // 설정 안 됐어도 에러로 처리하지 않음
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Email] Failed to send:', error);
      return { success: false, error };
    }

    console.log('[Email] Sent successfully to:', options.to);
    return { success: true };
  } catch (error) {
    console.error('[Email] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 결제 실패 알림 이메일
 */
export async function sendPaymentFailedEmail(
  email: string,
  userName: string,
  planName: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: '[K-Universal] Payment Failed - Action Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #171717; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #171717; }
          .content { background: #f9f9f7; padding: 30px; border-radius: 12px; }
          .button { display: inline-block; background: #171717; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">K-Universal</div>
          </div>
          <div class="content">
            <h2>Payment Failed</h2>
            <p>Hi ${userName || 'there'},</p>
            <p>We were unable to process your payment for the <strong>${planName}</strong> plan.</p>
            <p>To continue enjoying your subscription benefits, please update your payment method.</p>
            <a href="https://www.fieldnine.io/settings/billing" class="button">Update Payment Method</a>
            <p style="margin-top: 20px;">If you believe this is an error, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2026 K-Universal by Field Nine Solutions</p>
            <p>Questions? Contact us at support@fieldnine.io</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${userName || 'there'},\n\nWe were unable to process your payment for the ${planName} plan.\n\nPlease update your payment method at: https://www.fieldnine.io/settings/billing\n\n- K-Universal Team`,
  });
}

/**
 * 구독 취소 확인 이메일
 */
export async function sendSubscriptionCancelledEmail(
  email: string,
  userName: string,
  endDate: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: '[K-Universal] Subscription Cancelled',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #171717; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #171717; }
          .content { background: #f9f9f7; padding: 30px; border-radius: 12px; }
          .button { display: inline-block; background: #171717; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">K-Universal</div>
          </div>
          <div class="content">
            <h2>Subscription Cancelled</h2>
            <p>Hi ${userName || 'there'},</p>
            <p>Your K-Universal subscription has been cancelled.</p>
            <p>You'll continue to have access to your premium features until <strong>${endDate}</strong>.</p>
            <p>We'd love to have you back! If you change your mind, you can resubscribe anytime.</p>
            <a href="https://www.fieldnine.io/pricing" class="button">View Plans</a>
          </div>
          <div class="footer">
            <p>© 2026 K-Universal by Field Nine Solutions</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${userName || 'there'},\n\nYour K-Universal subscription has been cancelled.\n\nYou'll continue to have access until ${endDate}.\n\nResubscribe anytime at: https://www.fieldnine.io/pricing\n\n- K-Universal Team`,
  });
}

/**
 * 환영 이메일 (구독 시작)
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string,
  planName: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: '[K-Universal] Welcome to Your New Subscription! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #171717; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #171717; }
          .content { background: #f9f9f7; padding: 30px; border-radius: 12px; }
          .button { display: inline-block; background: #171717; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">K-Universal</div>
          </div>
          <div class="content">
            <h2>Welcome to ${planName}! 🎉</h2>
            <p>Hi ${userName || 'there'},</p>
            <p>Thank you for subscribing to K-Universal! Your journey to experience Korea like a local starts now.</p>
            <div class="features">
              <p><strong>Here's what you can do:</strong></p>
              <ul>
                <li>🚕 Book taxis instantly</li>
                <li>🍜 Order food with English menus</li>
                <li>🏨 Find the best hotels</li>
                <li>💳 Pay anywhere with your virtual card</li>
                <li>🌐 Get real-time translations</li>
              </ul>
            </div>
            <a href="https://www.fieldnine.io/dashboard" class="button">Start Exploring</a>
          </div>
          <div class="footer">
            <p>© 2026 K-Universal by Field Nine Solutions</p>
            <p>Need help? Contact support@fieldnine.io</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${userName || 'there'},\n\nWelcome to K-Universal ${planName}!\n\nStart exploring at: https://www.fieldnine.io/dashboard\n\n- K-Universal Team`,
  });
}
