"use client";

import { Download, RotateCcw, Square } from "lucide-react";
import { useEffect, useState } from "react";
import type { Dictionary, StageKey, ValidationKey } from "@/i18n/dictionaries";
import type { PdfJob } from "@/types/pdf";
import { buildOutputName } from "@/utils/file-validation";
import { formatBytes, formatDuration, formatPercent } from "@/utils/format";
import { downloadBlob } from "@/utils/download";
import type { PdfEngine } from "@/types/pdf";

type Props = {
  job: PdfJob | null;
  stage: StageKey;
  engine: PdfEngine | null;
  onCancel: () => void;
  onReset: () => void;
  t: Dictionary;
};

export function ProgressPanel({ job, stage, engine, onCancel, onReset, t }: Props) {
  const isProcessing = job?.status === "processing" || job?.status === "validating";
  const isDone = job?.status === "completed" && job.outputBlob;
  const errorText = job?.error ? t.validation[job.error as ValidationKey] ?? job.error : null;
  const [now, setNow] = useState(0);
  const liveElapsedMs = isProcessing && job?.startedAt && now > 0 ? now - job.startedAt : job?.elapsedMs;

  useEffect(() => {
    if (!isProcessing) return;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isProcessing]);

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{job?.fileName ?? t.progress.noFile}</p>
          <p className="mt-1 text-sm text-black/58">{t.stages[stage]}</p>
        </div>
        {engine ? (
          <span className="w-fit rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-black/58">
            {t.progress.engine}: {t.progress.engines[engine]}
          </span>
        ) : null}
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/8" aria-label={t.progress.progressLabel}>
        <div
          className={`h-full rounded-full bg-mint transition-all duration-300 ${isProcessing ? "animate-pulse" : ""}`}
          style={{ width: `${job?.progress ?? 0}%` }}
        />
      </div>

      {isProcessing ? (
        <p role="status" className="mt-3 text-sm leading-6 text-black/58">
          {engine === "ghostscript-wasm" ? t.progress.ghostscriptProcessingHint : t.progress.processingHint}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Metric label={t.progress.original} value={formatBytes(job?.originalSize ?? 0)} />
        <Metric label={t.progress.final} value={formatBytes(job?.outputSize ?? 0)} />
        <Metric label={t.progress.reduction} value={formatPercent(job?.reduction)} />
        <Metric label={t.progress.time} value={formatDuration(liveElapsedMs)} />
      </div>

      {job?.status === "error" ? (
        <p role="alert" className="mt-4 rounded-lg border border-coral/25 bg-coral/8 px-4 py-3 text-sm text-coral">
          {errorText}
        </p>
      ) : null}

      {job?.status === "cancelled" ? (
        <p role="status" className="mt-4 rounded-lg border border-black/10 px-4 py-3 text-sm text-black/62">
          {t.progress.cancelledDescription}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {isProcessing ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-full border border-black/12 px-4 py-2 text-sm font-medium text-ink transition hover:border-coral hover:text-coral focus:outline-none focus:ring-2 focus:ring-coral"
          >
            <Square aria-hidden="true" size={15} />
            {t.progress.cancel}
          </button>
        ) : null}

        {isDone ? (
          <button
            type="button"
            onClick={() => downloadBlob(job.outputBlob as Blob, buildOutputName(job.fileName, t.outputSuffix))}
            className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-sm font-semibold text-white transition hover:bg-mint/90 focus:outline-none focus:ring-2 focus:ring-mint"
          >
            <Download aria-hidden="true" size={16} />
            {t.progress.download}
          </button>
        ) : null}

        {job ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-full border border-black/12 px-4 py-2 text-sm font-medium text-ink transition hover:border-black/25 focus:outline-none focus:ring-2 focus:ring-mint"
          >
            <RotateCcw aria-hidden="true" size={15} />
            {t.progress.newPdf}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/8 bg-black/[0.025] p-3">
      <p className="text-xs text-black/52">{label}</p>
      <p className="mt-1 text-base font-semibold text-ink">{value}</p>
    </div>
  );
}
