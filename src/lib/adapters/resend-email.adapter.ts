// ─────────────────────────────────────────────────────────────────────────────
// ResendEmailAdapter — ارسال ایمیل از طریق Resend API (DECISION-064)
// هرگز مستقیم از کد فیچر صدا زده نمی‌شود — همیشه از طریق src/lib/email/send.ts
//
// بازنویسی قالب‌ها ۲۰۲۶-۰۶-۱۳ (DECISION-084):
//   • قالب جداگانه برای فعال‌سازی حساب (نه عنوان عمومی)
//   • نسخهٔ text/plain برای هر ایمیل (بهبودِ deliverability)
//   • RTL کامل + دیزاین سیستم همسو
//   • Click-tracking در داشبوردِ Resend باید غیرفعال شود
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
      subject: `کد تأیید ایمیل همسو: ${code}`,
      html: buildCodeHtml(code),
      text: buildCodeText(code),
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
      subject: "فعال‌سازی حساب کاربری همسو",
      html: buildActivationHtml(link),
      text: buildActivationText(link),
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
      html: buildPasswordResetHtml(link),
      text: buildPasswordResetText(link),
    });
    if (error || !data?.id) {
      return { success: false, error: error?.message ?? "خطای ناشناخته Resend" };
    }
    return { success: true, messageId: data.id };
  }

  async sendContactReply(email: string, subject: string, message: string): Promise<SendEmailResult> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: email,
      subject,
      html: buildMessageHtml(subject, message),
      text: buildMessageText(subject, message),
    });
    if (error || !data?.id) {
      return { success: false, error: error?.message ?? "خطای ناشناخته Resend" };
    }
    return { success: true, messageId: data.id };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// قالب‌های HTML — دیزاین سیستم همسو، RTL کامل
// ─────────────────────────────────────────────────────────────────────────────

/** پوستهٔ مشترک — logo header + کارت سفید + footer */
function shell(title: string, cardContent: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" dir="rtl" lang="fa">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f8f5;-webkit-text-size-adjust:100%;mso-line-height-rule:exactly;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f9f8f5;">
    <tr>
      <td align="center" style="padding:48px 16px 40px 16px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="520" style="max-width:520px;width:100%;">

          <!-- لوگو -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <div style="display:inline-block;background-color:#1a1918;border-radius:10px;padding:6px 18px;">
                <span style="color:#ffffff;font-size:15px;font-weight:700;font-family:system-ui,-apple-system,Arial,sans-serif;letter-spacing:-0.3px;">همسو</span>
              </div>
            </td>
          </tr>

          <!-- کارت اصلی -->
          <tr>
            <td style="background-color:#ffffff;border-radius:20px;border:1px solid #e8e5de;padding:40px 36px;direction:rtl;text-align:right;box-shadow:0 2px 24px rgba(0,0,0,0.05);">
              ${cardContent}
            </td>
          </tr>

          <!-- فوتر -->
          <tr>
            <td align="center" style="padding-top:24px;direction:rtl;">
              <p style="font-size:11px;color:#b8b5b0;margin:0;line-height:1.9;font-family:system-ui,-apple-system,Arial,sans-serif;">
                این ایمیل از طرف همسو ارسال شده است ·
                <a href="https://hamsoo.app" style="color:#b8b5b0;text-decoration:none;">hamsoo.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── ۱. کد تأیید ایمیل (جریان افزودن ایمیل برای کاربر لاگین‌شده) ─────────────

function buildCodeHtml(code: string): string {
  const card = `
    <p style="font-size:12px;font-weight:600;color:#6e9e75;margin:0 0 8px 0;letter-spacing:0.2px;font-family:system-ui,-apple-system,Arial,sans-serif;">تأیید ایمیل</p>
    <h1 style="font-size:22px;font-weight:600;color:#1a1918;margin:0 0 16px 0;line-height:1.3;font-family:system-ui,-apple-system,Arial,sans-serif;">کد تأیید ایمیل</h1>
    <p style="font-size:14px;color:#706e6a;margin:0 0 24px 0;line-height:1.8;font-family:system-ui,-apple-system,Arial,sans-serif;">
      کد زیر را در همسو وارد کن:
    </p>
    <div style="font-size:38px;font-weight:700;letter-spacing:12px;text-align:center;padding:22px 16px;background-color:#f5f4f0;border-radius:14px;margin:0 0 28px 0;direction:ltr;color:#1a1918;font-family:Courier,monospace;">${escHtml(code)}</div>
    <hr style="border:none;border-top:1px solid #f0ede8;margin:0 0 20px 0;" />
    <p style="font-size:12px;color:#b0ada8;margin:0;line-height:1.85;font-family:system-ui,-apple-system,Arial,sans-serif;">
      این کد ۲۴ ساعت معتبر است.<br />
      اگر این درخواست را نداده‌ای، این ایمیل را نادیده بگیر.
    </p>`;
  return shell("کد تأیید ایمیل همسو", card);
}

function buildCodeText(code: string): string {
  return `همسو — کد تأیید ایمیل

کد تأیید تو: ${code}

این کد ۲۴ ساعت معتبر است.
اگر این درخواست را نداده‌ای، این ایمیل را نادیده بگیر.

—
hamsoo.app`;
}

// ── ۲. فعال‌سازی حساب کاربری (ثبت‌نام) ──────────────────────────────────────

function buildActivationHtml(link: string): string {
  const card = `
    <p style="font-size:12px;font-weight:600;color:#6e9e75;margin:0 0 8px 0;letter-spacing:0.2px;font-family:system-ui,-apple-system,Arial,sans-serif;">خوش آمدی</p>
    <h1 style="font-size:22px;font-weight:600;color:#1a1918;margin:0 0 16px 0;line-height:1.3;font-family:system-ui,-apple-system,Arial,sans-serif;">فعال‌سازی حساب کاربری</h1>
    <p style="font-size:14px;color:#706e6a;margin:0 0 28px 0;line-height:1.85;font-family:system-ui,-apple-system,Arial,sans-serif;">
      ثبت‌نامت در همسو دریافت شد.<br />
      برای فعال‌سازی حساب و شروع سفرت، روی دکمه زیر کلیک کن.
    </p>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="border-radius:12px;background-color:#1a1918;">
          <a href="${escAttr(link)}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;font-family:system-ui,-apple-system,Arial,sans-serif;border-radius:12px;letter-spacing:0.1px;">فعال‌سازی حساب</a>
        </td>
      </tr>
    </table>
    <p style="font-size:12px;color:#a09e9a;margin:24px 0 0 0;line-height:1.75;font-family:system-ui,-apple-system,Arial,sans-serif;">
      اگر دکمه باز نشد، این لینک را در مرورگر وارد کن:<br />
      <a href="${escAttr(link)}" style="color:#a09e9a;direction:ltr;display:inline-block;word-break:break-all;font-family:Courier,monospace;font-size:11px;">${escHtml(link)}</a>
    </p>
    <hr style="border:none;border-top:1px solid #f0ede8;margin:24px 0 20px 0;" />
    <p style="font-size:12px;color:#b0ada8;margin:0;line-height:1.85;font-family:system-ui,-apple-system,Arial,sans-serif;">
      این لینک تا ۲۴ ساعت معتبر است.<br />
      اگر این درخواست را نداده‌ای، این ایمیل را نادیده بگیر.
    </p>`;
  return shell("فعال‌سازی حساب کاربری همسو", card);
}

function buildActivationText(link: string): string {
  return `همسو — فعال‌سازی حساب کاربری

ثبت‌نامت در همسو دریافت شد.
برای فعال‌سازی حساب و شروع سفرت، روی لینک زیر کلیک کن:

${link}

این لینک تا ۲۴ ساعت معتبر است.
اگر این درخواست را نداده‌ای، این ایمیل را نادیده بگیر.

—
hamsoo.app`;
}

// ── ۳. بازیابی رمز عبور ───────────────────────────────────────────────────────

function buildPasswordResetHtml(link: string): string {
  const card = `
    <p style="font-size:12px;font-weight:600;color:#6e9e75;margin:0 0 8px 0;letter-spacing:0.2px;font-family:system-ui,-apple-system,Arial,sans-serif;">امنیت حساب</p>
    <h1 style="font-size:22px;font-weight:600;color:#1a1918;margin:0 0 16px 0;line-height:1.3;font-family:system-ui,-apple-system,Arial,sans-serif;">بازیابی رمز عبور</h1>
    <p style="font-size:14px;color:#706e6a;margin:0 0 28px 0;line-height:1.85;font-family:system-ui,-apple-system,Arial,sans-serif;">
      درخواست بازیابی رمز عبور برای حسابت دریافت شد.<br />
      روی دکمه زیر کلیک کن تا رمز جدید تنظیم کنی.
    </p>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="border-radius:12px;background-color:#1a1918;">
          <a href="${escAttr(link)}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;font-family:system-ui,-apple-system,Arial,sans-serif;border-radius:12px;letter-spacing:0.1px;">تنظیم رمز جدید</a>
        </td>
      </tr>
    </table>
    <p style="font-size:12px;color:#a09e9a;margin:24px 0 0 0;line-height:1.75;font-family:system-ui,-apple-system,Arial,sans-serif;">
      اگر دکمه باز نشد، این لینک را در مرورگر وارد کن:<br />
      <a href="${escAttr(link)}" style="color:#a09e9a;direction:ltr;display:inline-block;word-break:break-all;font-family:Courier,monospace;font-size:11px;">${escHtml(link)}</a>
    </p>
    <hr style="border:none;border-top:1px solid #f0ede8;margin:24px 0 20px 0;" />
    <p style="font-size:12px;color:#b0ada8;margin:0;line-height:1.85;font-family:system-ui,-apple-system,Arial,sans-serif;">
      این لینک تا ۱ ساعت معتبر است.<br />
      اگر این درخواست را نداده‌ای، رمزت امن است و نیازی به اقدام نیست.
    </p>`;
  return shell("بازیابی رمز عبور همسو", card);
}

function buildPasswordResetText(link: string): string {
  return `همسو — بازیابی رمز عبور

درخواست بازیابی رمز عبور برای حسابت دریافت شد.
برای تنظیم رمز جدید روی لینک زیر کلیک کن:

${link}

این لینک تا ۱ ساعت معتبر است.
اگر این درخواست را نداده‌ای، رمزت امن است و نیازی به اقدام نیست.

—
hamsoo.app`;
}

// ── ۴. پاسخ به پیام «تماس با ما» ────────────────────────────────────────────

/** متنِ کاربر escape و خطوط حفظ می‌شوند — ضدِ تزریقِ HTML */
function buildMessageHtml(title: string, message: string): string {
  const safeMsg = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");
  const card = `
    <p style="font-size:12px;font-weight:600;color:#6e9e75;margin:0 0 8px 0;letter-spacing:0.2px;font-family:system-ui,-apple-system,Arial,sans-serif;">پیامی از همسو</p>
    <h1 style="font-size:20px;font-weight:600;color:#1a1918;margin:0 0 20px 0;line-height:1.35;font-family:system-ui,-apple-system,Arial,sans-serif;">${escHtml(title)}</h1>
    <div style="font-size:14px;color:#706e6a;line-height:1.95;font-family:system-ui,-apple-system,Arial,sans-serif;">${safeMsg}</div>
    <hr style="border:none;border-top:1px solid #f0ede8;margin:24px 0 20px 0;" />
    <p style="font-size:12px;color:#b0ada8;margin:0;line-height:1.85;font-family:system-ui,-apple-system,Arial,sans-serif;">
      این پاسخ از تیمِ همسو در پاسخ به پیامِ «تماس با ما»ی توست.
    </p>`;
  return shell(title, card);
}

function buildMessageText(title: string, message: string): string {
  return `همسو — ${title}

${message}

—
این پاسخ از تیمِ همسو در پاسخ به پیامِ «تماس با ما»ی توست.
hamsoo.app`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
