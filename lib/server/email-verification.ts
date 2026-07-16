import "server-only";

import {
  createHash,
  randomInt,
} from "node:crypto";

export const EMAIL_CODE_LENGTH = 6;
export const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
export const EMAIL_RESEND_LIMIT_MS = 60 * 1000;
export const EMAIL_VERIFY_MAX_ATTEMPTS = 5;
export const TRANSACTIONAL_MAIL_FROM = "Uğurbey Spot <info@ugurbeyspot.com>";

export type VerificationPurpose = "register" | "password_reset";

export function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidVerificationCode(code: string): boolean {
  return new RegExp(`^\\d{${EMAIL_CODE_LENGTH}}$`).test(code);
}

export function generateVerificationCode(): string {
  const min = 10 ** (EMAIL_CODE_LENGTH - 1);
  const max = 10 ** EMAIL_CODE_LENGTH;

  return String(randomInt(min, max));
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function getEmailVerificationKey(
  email: string,
  purpose: VerificationPurpose,
): string {
  return sha256(`verification:${purpose}:${normalizeEmail(email)}`);
}

export function buildVerificationEmailHtml(code: string): string {
  return `
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Uğurbey Spot Doğrulama Kodu</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f3;font-family:Segoe UI,Arial,sans-serif;color:#181817;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid rgba(24,24,23,.1);border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:24px 24px 18px;background:linear-gradient(135deg,#fff3a8,#f4d84c 55%,#e2b100);">
              <div style="display:inline-block;padding:8px 12px;background:#181817;color:#fff;border-radius:10px;font-weight:700;letter-spacing:.04em;">Uğurbey Spot</div>
              <h1 style="margin:16px 0 0;font-size:28px;line-height:1.1;letter-spacing:-.03em;color:#181817;">Doğrulama Kodunuz</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 24px 18px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4c4c46;">Kayıt işlemini tamamlamak için aşağıdaki 6 haneli doğrulama kodunu girin.</p>
              <div style="margin:8px 0 16px;padding:18px 14px;border-radius:14px;border:1px dashed rgba(154,119,0,.45);background:#fffbe9;text-align:center;">
                <span style="display:block;font-size:34px;line-height:1;letter-spacing:.28em;font-weight:800;color:#9a7700;">${code}</span>
              </div>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#707067;">Bu kod <strong>10 dakika</strong> boyunca gecerlidir. Kodu kimseyle paylaşmayın.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;border-top:1px solid rgba(24,24,23,.08);font-size:12px;color:#8a8a83;line-height:1.6;">
              Bu e-posta otomatik olarak gonderildi. Sorulariniz icin iletisim sayfasini kullanabilirsiniz.
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

export function buildPasswordResetEmailHtml(code: string): string {
  return `
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Uğurbey Spot Sifre Sifirlama Kodu</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f3;font-family:Segoe UI,Arial,sans-serif;color:#181817;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid rgba(24,24,23,.1);border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:24px 24px 18px;background:linear-gradient(135deg,#fff3a8,#f4d84c 55%,#e2b100);">
              <div style="display:inline-block;padding:8px 12px;background:#181817;color:#fff;border-radius:10px;font-weight:700;letter-spacing:.04em;">Uğurbey Spot</div>
              <h1 style="margin:16px 0 0;font-size:28px;line-height:1.1;letter-spacing:-.03em;color:#181817;">Sifre Sifirlama Kodunuz</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 24px 18px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4c4c46;">Sifrenizi yenilemek icin asagidaki 6 haneli kodu girin.</p>
              <div style="margin:8px 0 16px;padding:18px 14px;border-radius:14px;border:1px dashed rgba(154,119,0,.45);background:#fffbe9;text-align:center;">
                <span style="display:block;font-size:34px;line-height:1;letter-spacing:.28em;font-weight:800;color:#9a7700;">${code}</span>
              </div>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#707067;">Bu kod <strong>10 dakika</strong> boyunca gecerlidir. Kodu kimseyle paylasmayin.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;border-top:1px solid rgba(24,24,23,.08);font-size:12px;color:#8a8a83;line-height:1.6;">
              Talep size ait degilse bu e-postayi dikkate almayin.
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
