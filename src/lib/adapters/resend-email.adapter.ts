// ─────────────────────────────────────────────────────────────────────────────
// ResendEmailAdapter — ارسال ایمیل از طریق Resend API (DECISION-064)
// هرگز مستقیم از کد فیچر صدا زده نمی‌شود — همیشه از طریق src/lib/email/send.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { EmailAdapter } from "@/lib/adapters/email.adapter";
import type { SendEmailResult } from "@/types/email";
import { Resend } from "resend";

interface ResendAdapterConfig {
  apiKey: string;
  fromAddress: string;
  fromName: string;
}

export class ResendEmailAdapter implements EmailAdapter {
  private client: Resend;
  private from: string;

  constructor(config: ResendAdapterConfig) {
    this.client = new Resend(config.apiKey);
    this.from = `${config.fromName} <${config.fromAddress}>`;
  }

  async sendVerificationCode(email: string, code: string): Promise<SendEmailResult> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: email,
      subject: "کد تأیید ایمیل — همسو",
      html: buildCodeHtml(code, "کد تأیید ایمیل"),
    });
    if (error || !data?.id) {
      return { success: false, error: error?.message ?? "خطای ناشناخته Resend" };
    }
    return { success: true, messageId: data.id };
  }

  async sendVerificationLink(email: string, link: string): Promise<SendEmailResult> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: email,
      subject: "تأیید حساب — همسو",
      html: buildLinkHtml("تأیید حساب", link, "تأیید ایمیل"),
    });
    if (error || !data?.id) {
      return { success: false, error: error?.message ?? "خطای ناشناخته Resend" };
    }
    return { success: true, messageId: data.id };
  }

  async sendPasswordResetLink(email: string, link: string): Promise<SendEmailResult> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: email,
      subject: "بازیابی رمز عبور — همسو",
      html: buildLinkHtml("بازیابی رمز عبور", link, "بازیابی رمز"),
    });
    if (error || !data?.id) {
      return { success: false, error: error?.message ?? "خطای ناشناخته Resend" };
    }
    return { success: true, messageId: data.id };
  }
}

// ─── قالب‌های HTML ────────────────────────────────────────────────────────────

function buildCodeHtml(code: string, title: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:32px;background:#ffffff;border-radius:16px;border:1px solid #e8e5de;">
    <p style="font-size:13px;color:#888;margin:0 0 4px 0;">همسو</p>
    <h1 style="font-size:18px;font-weight:600;color:#1a1a1a;margin:0 0 20px 0;">${title}</h1>
    <p style="font-size:14px;color:#555;margin:0 0 24px 0;">کد زیر را در همسو وارد کن:</p>
    <div style="font-size:36px;font-weight:700;letter-spacing:10px;text-align:center;padding:20px 16px;background:#f5f4f0;border-radius:12px;margin:0 0 24px 0;direction:ltr;color:#1a1a1a;">${code}</div>
    <p style="font-size:12px;color:#aaa;margin:0;line-height:1.8;">این کد ۲۴ ساعت معتبر است.<br>اگر این درخواست را نداده‌ای، این ایمیل را نادیده بگیر.</p>
  </div>
</body>
</html>`;
}

function buildLinkHtml(title: string, link: string, btnLabel: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:32px;background:#ffffff;border-radius:16px;border:1px solid #e8e5de;">
    <p style="font-size:13px;color:#888;margin:0 0 4px 0;">همسو</p>
    <h1 style="font-size:18px;font-weight:600;color:#1a1a1a;margin:0 0 20px 0;">${title}</h1>
    <p style="font-size:14px;color:#555;margin:0 0 24px 0;">برای ادامه روی دکمه زیر بزن:</p>
    <a href="${link}" style="display:inline-block;padding:14px 28px;background:#1a1a1a;color:#fff;font-size:14px;font-weight:500;text-decoration:none;border-radius:12px;margin:0 0 24px 0;">${btnLabel}</a>
    <p style="font-size:12px;color:#aaa;margin:0;line-height:1.8;">اگر دکمه کار نکرد، این لینک را در مرورگر باز کن:<br><a href="${link}" style="color:#888;word-break:break-all;direction:ltr;display:inline-block;">${link}</a></p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
    <p style="font-size:11px;color:#ccc;margin:0;">اگر این درخواست را نداده‌ای، این ایمیل را نادیده بگیر.</p>
  </div>
</body>
</html>`;
}
