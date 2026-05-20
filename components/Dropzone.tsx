"use client";

import { FileUp, Lock, Plus } from "lucide-react";
import { useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { MAX_PDF_SIZE_BYTES } from "@/utils/file-validation";
import { formatBytes } from "@/utils/format";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
  t: Dictionary["dropzone"];
  privacyText: string;
};

export function Dropzone({ onFile, disabled, t, privacyText }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function pickFirstPdf(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      className={`relative flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center transition ${
        isDragging
          ? "border-mint bg-mint/8 shadow-glow"
          : "border-black/14 bg-white/75 shadow-soft"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        if (!disabled) pickFirstPdf(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => {
          pickFirstPdf(event.target.files);
          event.currentTarget.value = "";
        }}
        disabled={disabled}
        aria-label={t.inputLabel}
      />
      <div className="mb-5 inline-flex size-14 items-center justify-center rounded-full bg-ink text-white">
        <FileUp aria-hidden="true" size={24} />
      </div>
      <h2 className="text-2xl font-semibold tracking-normal text-ink">{t.title}</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-black/62">
        {t.description(formatBytes(MAX_PDF_SIZE_BYTES))}
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-mint disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus aria-hidden="true" size={17} />
        {t.selectPdf}
      </button>
      <p className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-black/56">
        <Lock aria-hidden="true" size={14} />
        {privacyText}
      </p>
    </div>
  );
}
