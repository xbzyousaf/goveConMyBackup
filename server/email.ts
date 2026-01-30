// import sgMail from '@sendgrid/mail';
import nodemailer from "nodemailer";

// if (process.env.SENDGRID_API_KEY) {
//   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// }

export class EmailService {
  // private static readonly FROM_EMAIL = 'noreply@tullisstrategic.com';
  private static readonly COMPANY_NAME = 'GovScale Alliance';
private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: true, // ✅ IMPORTANT
    },
  });
static async sendVerificationEmail(
    to: string,
    token: string,
    firstName?: string | null
  ): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("[EMAIL] SMTP not configured, skipping email send");
      console.log(`[EMAIL] Verification link: ${this.getVerificationUrl(token)}`);
      return;
    }

    const name = firstName || "there";
    const verificationUrl = this.getVerificationUrl(token);

    await this.transporter.sendMail({
      from: `"${this.COMPANY_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject: `Verify your ${this.COMPANY_NAME} account`,
      text: this.getTextContent(name, verificationUrl),
      html: this.getHtmlContent(name, verificationUrl),
    });

    console.log(`[EMAIL] Verification email sent to ${to}`);
  }
  static async sendWelcomeEmail(
    to: string,
    firstName?: string | null
  ): Promise<void> {
    const name = firstName || "there";

    await this.transporter.sendMail({
      from: `"${this.COMPANY_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject: `Welcome to ${this.COMPANY_NAME}!`,
      text: this.getWelcomeTextContent(name),
      html: this.getWelcomeHtmlContent(name),
    });

    console.log(`[EMAIL] Welcome email sent to ${to}`);
  }
  private static getVerificationUrl(token: string): string {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000";
    return `${baseUrl}/verify-email?token=${token}`;
  }
  // static async sendVerificationEmail(
  //   to: string,
  //   token: string,
  //   firstName?: string | null
  // ): Promise<void> {
  //   if (!process.env.SENDGRID_API_KEY) {
  //     console.warn('[EMAIL] SendGrid API key not configured, skipping email send');
  //     console.log(`[EMAIL] Verification link: ${this.getVerificationUrl(token)}`);
  //     return;
  //   }

  //   const verificationUrl = this.getVerificationUrl(token);
  //   const name = firstName || 'there';

  //   const msg = {
  //     to,
  //     from: this.FROM_EMAIL,
  //     subject: `Verify your ${this.COMPANY_NAME} account`,
  //     text: this.getTextContent(name, verificationUrl),
  //     html: this.getHtmlContent(name, verificationUrl),
  //   };

  //   try {
  //     await sgMail.send(msg);
  //     console.log(`[EMAIL] Verification email sent to ${to}`);
  //   } catch (error) {
  //     console.error('[EMAIL] Error sending verification email:', error);
  //     throw new Error('Failed to send verification email');
  //   }
  // }

  // static async sendWelcomeEmail(
  //   to: string,
  //   firstName?: string | null
  // ): Promise<void> {
  //   if (!process.env.SENDGRID_API_KEY) {
  //     console.warn('[EMAIL] SendGrid API key not configured, skipping email send');
  //     return;
  //   }

  //   const name = firstName || 'there';

  //   const msg = {
  //     to,
  //     from: this.FROM_EMAIL,
  //     subject: `Welcome to ${this.COMPANY_NAME}!`,
  //     text: this.getWelcomeTextContent(name),
  //     html: this.getWelcomeHtmlContent(name),
  //   };

  //   try {
  //     await sgMail.send(msg);
  //     console.log(`[EMAIL] Welcome email sent to ${to}`);
  //   } catch (error) {
  //     console.error('[EMAIL] Error sending welcome email:', error);
  //   }
  // }

  // private static getVerificationUrl(token: string): string {
  //   const baseUrl = process.env.REPLIT_DEV_DOMAIN
  //     ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  //     : 'http://localhost:5000';
  //   return `${baseUrl}/verify-email?token=${token}`;
  // }

  private static getTextContent(name: string, verificationUrl: string): string {
    return `
Hello ${name},

Thank you for signing up with ${this.COMPANY_NAME}!

To complete your registration and verify your email address, please click the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with us, please ignore this email.

Best regards,
The ${this.COMPANY_NAME} Team
Powered by Tullis Strategic Solutions LLC
    `.trim();
  }

  private static getHtmlContent(name: string, verificationUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e5ba8 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ${this.COMPANY_NAME}
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                Powered by Tullis Strategic Solutions LLC
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">
                Hello ${name},
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Thank you for signing up with ${this.COMPANY_NAME}! We're excited to help you grow your government contracting business.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                To complete your registration and verify your email address, please click the button below:
              </p>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 14px; word-break: break-all;">
                ${verificationUrl}
              </p>
              
              <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6;">
                <strong>Note:</strong> This verification link will expire in 24 hours.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px;">
                If you didn't create an account with us, please ignore this email.
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                © ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private static getWelcomeTextContent(name: string): string {
    return `
Hello ${name},

Welcome to ${this.COMPANY_NAME}!

Your email has been verified and your account is now active.

We're here to help you accelerate your government contracting journey with proven frameworks and expert guidance.

Next steps:
1. Complete your maturity assessment
2. Explore your personalized dashboard
3. Access process guidance for Business Structure, Strategy, and Execution

Get started now at: ${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}

Best regards,
The ${this.COMPANY_NAME} Team
Powered by Tullis Strategic Solutions LLC
    `.trim();
  }

  private static getWelcomeHtmlContent(name: string): string {
    const dashboardUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}/dashboard`
      : 'http://localhost:5000/dashboard';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${this.COMPANY_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e5ba8 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Welcome to ${this.COMPANY_NAME}!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">
                Hello ${name},
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Your email has been verified and your account is now active!
              </p>
              
              <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                We're here to help you accelerate your government contracting journey with proven frameworks and expert guidance.
              </p>
              
              <h3 style="margin: 0 0 15px 0; color: #1a202c; font-size: 18px; font-weight: 600;">
                Next Steps:
              </h3>
              
              <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #4a5568; font-size: 16px; line-height: 1.8;">
                <li>Complete your maturity assessment</li>
                <li>Explore your personalized dashboard</li>
                <li>Access process guidance for Business Structure, Strategy, and Execution</li>
              </ul>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Get Started
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                © ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.<br>
                Powered by Tullis Strategic Solutions LLC
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}
