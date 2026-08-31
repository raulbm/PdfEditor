export type PdfBinary = Blob | ArrayBuffer | Uint8Array;

export interface DocumentDescriptor {
  id?: string;
  name: string;
  version?: string;
  etag?: string;
  readOnly?: boolean;
  metadata?: Record<string, unknown>;
}

export interface LoadedDocument {
  descriptor: DocumentDescriptor;
  content: PdfBinary;
}

export interface PdfEditorCapabilities {
  annotations: boolean;
  redaction: boolean;
  bookmarks: boolean;
  links: boolean;
  attachments: boolean;
  forms: boolean;
  export: boolean;
  /** Cryptographic signing is supplied by the host (certificate, HSM or remote signer). */
  digitalSignature?: boolean;
}

export interface DocumentProvider {
  open(request: { documentId?: string; signal: AbortSignal }): Promise<LoadedDocument>;
}

export type SaveMode = "save" | "save-as";

export interface SaveRequest {
  descriptor: DocumentDescriptor;
  content: Blob;
  sha256: string;
  mode: SaveMode;
  signal: AbortSignal;
}

export interface SaveResult {
  descriptor: DocumentDescriptor;
}

export interface PersistenceProvider {
  save(request: SaveRequest): Promise<SaveResult>;
}

export interface ExtractionRequest {
  sourceSha256: string;
  output: "markdown" | "json" | "images";
  ocrMode: "auto" | "never" | "force";
  languages: string[];
}

export interface ExtractionJob {
  id: string;
}

export interface ExtractionStatus {
  state: "queued" | "running" | "completed" | "cancelled" | "failed";
  progress?: number;
  message?: string;
}

export interface ExtractionProvider {
  start(request: ExtractionRequest): Promise<ExtractionJob>;
  getStatus(jobId: string, signal: AbortSignal): Promise<ExtractionStatus>;
  cancel(jobId: string): Promise<void>;
}

export type PdfEditorErrorCode =
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "READ_ONLY"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_PDF"
  | "EXTRACTION_FAILED"
  | "UNKNOWN";

export class PdfEditorError extends Error {
  constructor(
    public readonly code: PdfEditorErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PdfEditorError";
  }
}


export interface DigitalSignatureRequest {
  content: Blob;
  reason?: string;
  location?: string;
  contactInfo?: string;
  signal: AbortSignal;
}

export interface DigitalSignatureResult {
  content: Blob;
  signatureProfile?: string;
  signer?: string;
}

/** Host-owned certificate/HSM integration. The SDK never handles private keys. */
export interface DigitalSignatureProvider {
  sign(request: DigitalSignatureRequest): Promise<DigitalSignatureResult>;
}
