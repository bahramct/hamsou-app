// ─────────────────────────────────────────────────────────────────────────────
// compress-image.ts — فشرده‌سازیِ تصویر سمتِ کلاینت با canvas → JPEG base64
// (الگوی AvatarCropModal). مصرف: کاورِ مقاله + تصاویرِ بدنه در ادیتورِ ادمین.
// ─────────────────────────────────────────────────────────────────────────────

export function compressImage(file: File, maxW: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const cx = canvas.getContext("2d");
        if (!cx) return reject(new Error("no-ctx"));
        cx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
