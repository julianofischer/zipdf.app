import type { ValidationKey } from "@/i18n/dictionaries";

const PDF_MAGIC_HEADER = "%PDF-";

export type FileValidationResult =
  | { ok: true }
  | {
      ok: false;
      key: ValidationKey;
    };

export const MAX_PDF_SIZE_BYTES = 250 * 1024 * 1024;

export async function validatePdfFile(file: File): Promise<FileValidationResult> {
  if (!file) {
    return { ok: false, key: "selectValidPdf" };
  }

  const extensionLooksRight = file.name.toLowerCase().endsWith(".pdf");
  const mimeLooksRight = file.type === "application/pdf" || file.type === "";

  if (!extensionLooksRight || !mimeLooksRight) {
    return { ok: false, key: "pdfOnly" };
  }

  if (file.size === 0) {
    return { ok: false, key: "emptyPdf" };
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return { ok: false, key: "tooLarge" };
  }

  const header = await file.slice(0, PDF_MAGIC_HEADER.length).text();
  if (header !== PDF_MAGIC_HEADER) {
    return { ok: false, key: "invalidPdf" };
  }

  return { ok: true };
}

export function buildOutputName(fileName: string, suffix: string): string {
  return `${fileName.replace(/\.pdf$/i, "")}-${suffix}.pdf`;
}
