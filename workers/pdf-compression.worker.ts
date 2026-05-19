/// <reference lib="webworker" />

import { compressPdfLocally } from "@/services/pdf/compress";
import type { WorkerRequest, WorkerResponse } from "@/types/pdf";

const cancelledJobs = new Set<string>();

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  if (message.type === "cancel") {
    cancelledJobs.add(message.jobId);
    postMessage({ type: "cancelled", jobId: message.jobId } satisfies WorkerResponse);
    return;
  }

  if (message.type !== "compress") return;

  const startedAt = performance.now();
  cancelledJobs.delete(message.jobId);

  try {
    const result = await compressPdfLocally(
      message.fileBuffer,
      message.options,
      (progress, stage) => {
        postMessage({ type: "progress", jobId: message.jobId, progress, stage } satisfies WorkerResponse);
      },
      () => cancelledJobs.has(message.jobId)
    );

    if (cancelledJobs.has(message.jobId)) {
      postMessage({ type: "cancelled", jobId: message.jobId } satisfies WorkerResponse);
      return;
    }

    postMessage(
      {
        type: "complete",
        jobId: message.jobId,
        outputBuffer: result.output,
        elapsedMs: performance.now() - startedAt,
        engine: result.engine
      } satisfies WorkerResponse,
      [result.output]
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      postMessage({ type: "cancelled", jobId: message.jobId } satisfies WorkerResponse);
      return;
    }

    postMessage({
      type: "error",
      jobId: message.jobId,
      error: error instanceof Error ? error.message : "Não foi possível compactar este PDF."
    } satisfies WorkerResponse);
  } finally {
    cancelledJobs.delete(message.jobId);
  }
};

export {};
