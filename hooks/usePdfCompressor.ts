"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StageKey } from "@/i18n/dictionaries";
import type { CompressionLevel, PdfEngine, PdfJob, WorkerRequest, WorkerResponse } from "@/types/pdf";
import { validatePdfFile } from "@/utils/file-validation";

type CompressorState = {
  job: PdfJob | null;
  stage: StageKey;
  engine: PdfEngine | null;
  selectedEngine: PdfEngine;
  setSelectedEngine: (engine: PdfEngine) => void;
  level: CompressionLevel;
  setLevel: (level: CompressionLevel) => void;
  addFile: (file: File) => Promise<void>;
  start: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
};

export function usePdfCompressor(): CompressorState {
  const workerRef = useRef<Worker | null>(null);
  const activeJobIdRef = useRef<string | null>(null);
  const [job, setJob] = useState<PdfJob | null>(null);
  const [stage, setStage] = useState<StageKey>("waiting");
  const [engine, setEngine] = useState<PdfEngine | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<PdfEngine>("ghostscript-wasm");
  const [level, setLevel] = useState<CompressionLevel>("maximum");

  const createWorker = useCallback(() => {
    const worker = new Worker(new URL("../workers/pdf-compression.worker.ts", import.meta.url), {
      type: "module"
    });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

      if (message.jobId !== activeJobIdRef.current) return;

      if (message.type === "progress") {
        setStage(message.stage);
        setJob((current) =>
          current
            ? { ...current, progress: message.progress, status: "processing" }
            : current
        );
      }

      if (message.type === "complete") {
        const outputBlob = new Blob([message.outputBuffer], { type: "application/pdf" });
        setEngine(message.engine);
        setJob((current) => {
          if (!current) return current;

          const reduction = ((current.originalSize - outputBlob.size) / current.originalSize) * 100;

          if (outputBlob.size >= current.originalSize) {
            setStage("ready");
            return {
              ...current,
              outputBlob: undefined,
              outputSize: undefined,
              reduction: undefined,
              elapsedMs: message.elapsedMs,
              notice: "outputLarger",
              progress: 0,
              status: "idle"
            };
          }

          setStage(getCompletedStage(message.engine));
          return {
            ...current,
            outputBlob,
            outputSize: outputBlob.size,
            reduction,
            elapsedMs: message.elapsedMs,
            notice: undefined,
            progress: 100,
            status: "completed"
          };
        });
      }

      if (message.type === "error") {
        setStage("processingError");
        setJob((current) =>
          current
            ? { ...current, error: message.error, status: "error", progress: 0 }
            : current
        );
      }

      if (message.type === "cancelled") {
        setStage("cancelled");
        setJob((current) => (current ? { ...current, status: "cancelled", progress: 0 } : current));
      }
    };

    return worker;
  }, []);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (selectedEngine !== "ghostscript-wasm" || job?.status !== "processing") return;

    const timer = window.setInterval(() => {
      setJob((current) => {
        if (!current || current.status !== "processing") return current;
        if (current.progress >= 94) return current;

        const elapsedSeconds = current.startedAt ? (Date.now() - current.startedAt) / 1000 : 0;
        const estimatedProgress = Math.min(94, 45 + elapsedSeconds * 0.42);

        return {
          ...current,
          progress: Math.max(current.progress, estimatedProgress)
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [job?.status, selectedEngine]);

  const addFile = useCallback(
    async (file: File) => {
      const id = crypto.randomUUID();
      activeJobIdRef.current = id;
      setEngine(null);
      setStage("validating");
      setJob({
        id,
        file,
        fileName: file.name,
        originalSize: file.size,
        progress: 0,
        status: "validating"
      });

      const validation = await validatePdfFile(file);
      if (activeJobIdRef.current !== id) return;

      if (!validation.ok) {
        setStage("rejected");
        setJob((current) =>
          current && current.id === id ? { ...current, status: "error", error: validation.key } : current
        );
        return;
      }

      setStage("ready");
      setJob((current) => (current && current.id === id ? { ...current, status: "idle", progress: 0 } : current));
    },
    []
  );

  const start = useCallback(async () => {
    if (!job || (job.status !== "idle" && job.status !== "completed")) return;

    const runId = crypto.randomUUID();
    activeJobIdRef.current = runId;
    workerRef.current?.terminate();
    workerRef.current = createWorker();
    setEngine(selectedEngine);
    setStage("sendingToWorker");
    setJob((current) =>
      current && current.id === job.id
        ? {
            ...current,
            id: runId,
            outputBlob: undefined,
            outputSize: undefined,
            reduction: undefined,
            elapsedMs: undefined,
            error: undefined,
            notice: undefined,
            status: "processing",
            progress: 3,
            startedAt: Date.now()
          }
        : current
    );

    const fileBuffer = await job.file.arrayBuffer();
    if (activeJobIdRef.current !== runId) return;

    const request: WorkerRequest = {
      type: "compress",
      jobId: runId,
      fileName: job.fileName,
      fileBuffer,
      options: { level, engine: selectedEngine }
    };

    workerRef.current?.postMessage(request, [fileBuffer]);
  }, [createWorker, job, level, selectedEngine]);

  const cancel = useCallback(() => {
    const runId = activeJobIdRef.current;
    if (!runId) return;

    workerRef.current?.terminate();
    workerRef.current = null;
    activeJobIdRef.current = null;
    setEngine(null);
    setStage("ready");
    setJob((current) =>
      current && current.id === runId
        ? {
            ...current,
            outputBlob: undefined,
            outputSize: undefined,
            reduction: undefined,
            startedAt: undefined,
            elapsedMs: undefined,
            error: undefined,
            notice: undefined,
            status: "idle",
            progress: 0
          }
        : current
    );
  }, []);

  const reset = useCallback(() => {
    activeJobIdRef.current = null;
    setJob(null);
    setStage("waiting");
    setEngine(null);
  }, []);

  return { job, stage, engine, selectedEngine, setSelectedEngine, level, setLevel, addFile, start, cancel, reset };
}

function getCompletedStage(engine: PdfEngine): StageKey {
  if (engine === "ghostscript-wasm") return "completedGhostscriptWasm";
  if (engine === "javascript") return "completedJavascript";
  return "completedQpdfWasm";
}
