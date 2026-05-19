import type { CompressionLevel, PdfEngine } from "@/types/pdf";
import type { Locale } from "./config";

export type StageKey =
  | "waiting"
  | "validating"
  | "rejected"
  | "sendingToWorker"
  | "preparingEngine"
  | "loadingWasm"
  | "readingStructure"
  | "rewritingObjects"
  | "compressingObjects"
  | "compressingImages"
  | "finished"
  | "completedQpdfWasm"
  | "completedGhostscriptWasm"
  | "completedJavascript"
  | "processingError"
  | "cancelled";

export type ValidationKey = "selectValidPdf" | "pdfOnly" | "emptyPdf" | "tooLarge" | "invalidPdf";

type PresetCopy = {
  label: string;
  description: string;
};

export type Dictionary = {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    localBadge: string;
    title: string;
    description: string;
    privacy: string;
    trust: Array<{ title: string; text: string }>;
  };
  dropzone: {
    title: string;
    description: (maxSize: string) => string;
    selectPdf: string;
    inputLabel: string;
  };
  compression: {
    legend: string;
    presets: Record<CompressionLevel, PresetCopy>;
  };
  engines: {
    legend: string;
    options: Record<PdfEngine, PresetCopy>;
  };
  progress: {
    noFile: string;
    progressLabel: string;
    engine: string;
    engines: Record<PdfEngine, string>;
    original: string;
    final: string;
    reduction: string;
    time: string;
    cancel: string;
    download: string;
    newPdf: string;
    processingHint: string;
    ghostscriptProcessingHint: string;
    cancelledDescription: string;
  };
  language: {
    label: string;
    portuguese: string;
    english: string;
  };
  footer: {
    developedBy: string;
  };
  stages: Record<StageKey, string>;
  validation: Record<ValidationKey, string>;
  outputSuffix: string;
};

export const dictionaries: Record<Locale, Dictionary> = {
  "pt-BR": {
    meta: {
      title: "zipdf.app - Compressão privada de PDF",
      description: "Compacte PDFs localmente no navegador. Nenhum arquivo é enviado para servidores."
    },
    hero: {
      localBadge: "100% local no navegador",
      title: "Compacte PDFs sem abrir mão da privacidade.",
      description:
        "Uma experiência moderna para reduzir arquivos PDF com processamento client-side, worker dedicado e arquitetura pronta para evoluir para SaaS.",
      privacy: "Seus arquivos nunca saem do seu dispositivo.",
      trust: [
        { title: "Privado", text: "Sem upload, sem armazenamento." },
        { title: "Rápido", text: "Worker evita travar a interface." },
        { title: "Sem conta", text: "Use direto no navegador, sem cadastro." }
      ]
    },
    dropzone: {
      title: "Solte seu PDF aqui",
      description: (maxSize) => `Compactação local, rápida e privada. Limite recomendado: ${maxSize} por arquivo.`,
      selectPdf: "Selecionar PDF",
      inputLabel: "Selecionar PDF para compactar"
    },
    compression: {
      legend: "Compressão",
      presets: {
        quality: {
          label: "Alta qualidade",
          description: "Menor redução, preservando melhor texto, vetores e imagens."
        },
        balanced: {
          label: "Balanceado",
          description: "Boa redução estrutural para PDFs do dia a dia, com ótima compatibilidade."
        },
        maximum: {
          label: "Máxima compressão",
          description: "Recomprime JPEGs de forma agressiva e pode reduzir mais a qualidade visual."
        }
      }
    },
    engines: {
      legend: "Motor",
      options: {
        "qpdf-wasm": {
          label: "QPDF WASM",
          description: "Rápido, local e ótimo para otimização estrutural."
        },
        javascript: {
          label: "JavaScript",
          description: "Fallback leve com pdf-lib, sem WASM pesado."
        },
        "ghostscript-wasm": {
          label: "Ghostscript WASM",
          description: "Padrão. Mais agressivo para PDFs com imagens, com downsample local."
        }
      }
    },
    progress: {
      noFile: "Nenhum PDF selecionado",
      progressLabel: "Progresso",
      engine: "Motor",
      engines: {
        "qpdf-wasm": "QPDF WASM",
        javascript: "JavaScript",
        "ghostscript-wasm": "Ghostscript WASM"
      },
      original: "Original",
      final: "Final",
      reduction: "Redução",
      time: "Tempo",
      cancel: "Cancelar",
      download: "Baixar PDF compactado",
      newPdf: "Novo PDF",
      processingHint: "Processando localmente. Mantenha esta aba aberta até a compactação terminar.",
      ghostscriptProcessingHint:
        "Ghostscript está recomprimindo imagens localmente. Em PDFs grandes, esta etapa pode levar alguns minutos.",
      cancelledDescription: "O processamento foi cancelado. Você pode selecionar outro arquivo quando quiser."
    },
    language: {
      label: "Idioma",
      portuguese: "Português",
      english: "English"
    },
    footer: {
      developedBy: "Desenvolvido por"
    },
    stages: {
      waiting: "Aguardando PDF",
      validating: "Validando PDF",
      rejected: "Arquivo recusado",
      sendingToWorker: "Enviando para worker local",
      preparingEngine: "Preparando motor local",
      loadingWasm: "Carregando WASM",
      readingStructure: "Lendo estrutura do PDF",
      rewritingObjects: "Reorganizando objetos internos",
      compressingObjects: "Compactando objetos",
      compressingImages: "Recomprimindo imagens",
      finished: "Finalizado",
      completedQpdfWasm: "Compactado com QPDF WASM local",
      completedGhostscriptWasm: "Compactado com Ghostscript WASM local",
      completedJavascript: "Compactado com JavaScript local",
      processingError: "Erro no processamento",
      cancelled: "Processamento cancelado"
    },
    validation: {
      selectValidPdf: "Selecione um arquivo PDF válido.",
      pdfOnly: "Apenas arquivos PDF são aceitos.",
      emptyPdf: "O PDF está vazio.",
      tooLarge: "Este PDF excede o limite local recomendado de 250 MB.",
      invalidPdf: "O arquivo não parece ser um PDF válido."
    },
    outputSuffix: "compactado"
  },
  en: {
    meta: {
      title: "zipdf.app - Private PDF compression",
      description: "Compress PDFs locally in your browser. No file is uploaded to servers."
    },
    hero: {
      localBadge: "100% local in your browser",
      title: "Compress PDFs without giving up privacy.",
      description:
        "A modern experience for reducing PDF files with client-side processing, a dedicated worker, and an architecture ready to grow into SaaS.",
      privacy: "Your files never leave your device.",
      trust: [
        { title: "Private", text: "No uploads, no storage." },
        { title: "Fast", text: "A worker keeps the interface responsive." },
        { title: "No account", text: "Use it in the browser without signing up." }
      ]
    },
    dropzone: {
      title: "Drop your PDF here",
      description: (maxSize) => `Local, fast, private compression. Recommended limit: ${maxSize} per file.`,
      selectPdf: "Select PDF",
      inputLabel: "Select a PDF to compress"
    },
    compression: {
      legend: "Compression",
      presets: {
        quality: {
          label: "High quality",
          description: "Smaller reduction while preserving text, vectors, and images."
        },
        balanced: {
          label: "Balanced",
          description: "Good structural reduction for everyday PDFs with excellent compatibility."
        },
        maximum: {
          label: "Maximum compression",
          description: "Aggressively recompresses JPEGs and may reduce visual quality further."
        }
      }
    },
    engines: {
      legend: "Engine",
      options: {
        "qpdf-wasm": {
          label: "QPDF WASM",
          description: "Fast, local, and great for structural optimization."
        },
        javascript: {
          label: "JavaScript",
          description: "Lightweight pdf-lib fallback without heavy WASM."
        },
        "ghostscript-wasm": {
          label: "Ghostscript WASM",
          description: "Default. More aggressive for image-heavy PDFs with local downsampling."
        }
      }
    },
    progress: {
      noFile: "No PDF selected",
      progressLabel: "Progress",
      engine: "Engine",
      engines: {
        "qpdf-wasm": "QPDF WASM",
        javascript: "JavaScript",
        "ghostscript-wasm": "Ghostscript WASM"
      },
      original: "Original",
      final: "Final",
      reduction: "Reduction",
      time: "Time",
      cancel: "Cancel",
      download: "Download compressed PDF",
      newPdf: "New PDF",
      processingHint: "Processing locally. Keep this tab open until compression finishes.",
      ghostscriptProcessingHint:
        "Ghostscript is recompressing images locally. For large PDFs, this step can take a few minutes.",
      cancelledDescription: "Processing was cancelled. You can select another file whenever you want."
    },
    language: {
      label: "Language",
      portuguese: "Português",
      english: "English"
    },
    footer: {
      developedBy: "Developed by"
    },
    stages: {
      waiting: "Waiting for PDF",
      validating: "Validating PDF",
      rejected: "File rejected",
      sendingToWorker: "Sending to local worker",
      preparingEngine: "Preparing local engine",
      loadingWasm: "Loading WASM",
      readingStructure: "Reading PDF structure",
      rewritingObjects: "Rewriting internal objects",
      compressingObjects: "Compressing objects",
      compressingImages: "Recompressing images",
      finished: "Finished",
      completedQpdfWasm: "Compressed with local QPDF WASM",
      completedGhostscriptWasm: "Compressed with local Ghostscript WASM",
      completedJavascript: "Compressed with local JavaScript",
      processingError: "Processing error",
      cancelled: "Processing cancelled"
    },
    validation: {
      selectValidPdf: "Select a valid PDF file.",
      pdfOnly: "Only PDF files are accepted.",
      emptyPdf: "The PDF is empty.",
      tooLarge: "This PDF exceeds the recommended local limit of 250 MB.",
      invalidPdf: "This file does not look like a valid PDF."
    },
    outputSuffix: "compressed"
  }
};
