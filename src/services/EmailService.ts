import { GlobalConfig } from "../config/GlobalConfig";
import type { UserRole } from "../lib/auth.types";
import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";

export class EmailService {
  private readonly mailsender: MailerSend | null;
  private readonly sentFrom: Sender;
  constructor(private readonly config: GlobalConfig) {
    this.mailsender = new MailerSend({
      apiKey: this.config.mailSenderApiKey!,
    });
    this.sentFrom = new Sender(this.config.mailSenderFromEmail!);

    if (!this.mailsender || !this.sentFrom) {
      console.warn(
        "[EmailService] MAILSENDER_APIKEY not set — emails will be skipped",
      );
    }
  }

  async sendInvitation(params: {
    toEmail: string;
    invitedByEmail: string;
    projectName: string;
    subdomain: string;
    role: UserRole;
    temporaryPassword: string;
    isNewUser: boolean;
  }): Promise<void> {
    if (!this.mailsender) return;

    const loginUrl = `http://${params.subdomain}.localhost:3000/login`;

    const roleDescriptions: Record<UserRole, string> = {
      admin: "Full access — manage workflows, credentials and team members",
      editor: "Create and run workflows, manage credentials",
      viewer: "Read-only access to all resources",
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to ${params.projectName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:36px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:12px;margin-bottom:16px;">
                <span style="font-size:24px;">⚡</span>
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">n8n Clone</h1>
              <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.75);">Workflow Automation Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">
                You've been invited! 🎉
              </h2>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                <strong style="color:#374151;">${params.invitedByEmail}</strong> has invited you to join
                the <strong style="color:#374151;">${params.projectName}</strong> workspace on n8n Clone.
              </p>

              <!-- Role badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 18px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#3b82f6;text-transform:uppercase;letter-spacing:0.05em;">Your Role</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:#1e40af;text-transform:capitalize;">${params.role}</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${roleDescriptions[params.role]}</p>
                  </td>
                </tr>
              </table>

              ${
                params.isNewUser
                  ? `
              <!-- Credentials box -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
                    <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Your Login Credentials</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                          <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:500;">Workspace</p>
                          <p style="margin:4px 0 0;font-size:14px;color:#111827;font-family:monospace;">${params.subdomain}.localhost</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                          <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:500;">Email</p>
                          <p style="margin:4px 0 0;font-size:14px;color:#111827;font-family:monospace;">${params.toEmail}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:500;">Temporary Password</p>
                          <p style="margin:4px 0 0;font-size:14px;color:#111827;font-family:monospace;background:#f3f4f6;display:inline-block;padding:4px 10px;border-radius:6px;letter-spacing:0.05em;">${params.temporaryPassword}</p>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;font-size:12px;color:#f59e0b;">⚠️ Please change your password after your first login.</p>
                  </td>
                </tr>
              </table>
              `
                  : `
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 18px;">
                Use your existing credentials to sign in. Select the <strong style="font-family:monospace;color:#374151;">${params.subdomain}</strong> workspace on the login page.
              </p>
              `
              }

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.01em;">
                      Open Workspace →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Login URL -->
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                Or copy this link: <a href="${loginUrl}" style="color:#6366f1;text-decoration:none;font-family:monospace;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This invitation was sent by ${params.invitedByEmail} via n8n Clone.<br/>
                If you didn't expect this email you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      const recipient = [new Recipient(params.toEmail)];
      const emailParams = new EmailParams()
        .setFrom(this.sentFrom)
        .setTo(recipient)
        .setSubject("Hi! This is your invitation")
        .setHtml(html);

      await this.mailsender.email.send(emailParams);
      console.log(`[EmailService] invitation sent to ${params.toEmail}`);
    } catch (err: unknown) {
      // Do not let email failure block the invite flow
      console.error(
        "[EmailService] failed to send invitation:",
        err instanceof Error ? err.message : err,
      );
    }
  }
}
