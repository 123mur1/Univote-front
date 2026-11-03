"use client";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 1.5 * 1024 * 1024;

export function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Images are downscaled to JPEG so several documents fit in browser storage for the demo.
export async function fileToDataUrl(file: File, maxDim = 1400): Promise<string> {
  if (file.type === "application/pdf") {
    if (file.size > MAX_PDF_BYTES) throw new Error("PDFs must be 1.5 MB or smaller in this demo.");
    return readAsDataUrl(file);
  }
  if (!file.type.startsWith("image/")) throw new Error("Upload an image (JPG, PNG, WebP) or a PDF.");
  if (file.type === "image/svg+xml") return readAsDataUrl(file);

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read this image.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function isPdf(src: string) {
  return src.startsWith("data:application/pdf") || src.toLowerCase().endsWith(".pdf");
}
