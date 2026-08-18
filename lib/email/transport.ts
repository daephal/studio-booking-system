import nodemailer, { type Transporter } from "nodemailer";
import { env, isEmailConfigured, isResendConfigured, isGmailConfigured } from "@/lib/env";
import { getStudioProfile } from "@/lib/studio-profile-server";

export const emailConfigured = isEmailConfigured;

let transporter: Transporter | null = null;

function getGmailTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.gmailUser, pass: env.gmailAppPassword },
    });
  }
  return transporter;
}

async function sendViaResend(fromName: string, to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${env.emailFrom}>`,
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend 발송 실패 (${res.status}): ${body}`);
  }
}

async function sendViaGmail(fromName: string, to: string, subject: string, html: string) {
  await getGmailTransporter().sendMail({
    from: `"${fromName}" <${env.gmailUser}>`,
    to,
    subject,
    html,
  });
}

// RESEND_API_KEY(+EMAIL_FROM)가 설정되어 있으면 Resend를 우선 사용하고,
// 없으면 도메인 인증 없이도 바로 쓸 수 있는 Gmail SMTP로 대체한다.
export async function sendMail(to: string, subject: string, html: string): Promise<{ sent: boolean }> {
  if (!isResendConfigured && !isGmailConfigured) {
    console.warn(`[email:not-configured] to="${to}" subject="${subject}" — RESEND_API_KEY 또는 GMAIL_USER/GMAIL_APP_PASSWORD 미설정`);
    return { sent: false };
  }
  const { studioName } = await getStudioProfile();
  if (isResendConfigured) {
    await sendViaResend(studioName, to, subject, html);
    return { sent: true };
  }
  await sendViaGmail(studioName, to, subject, html);
  return { sent: true };
}
