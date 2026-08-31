import type { ExtractionJob, ExtractionProvider, ExtractionRequest, ExtractionStatus } from "@enterprise-pdf-editor/core";
export interface ExtractionClientOptions { baseUrl: string; fetch?: typeof globalThis.fetch; headers?: Record<string, string>; }
export class HttpExtractionProvider implements ExtractionProvider {
  private readonly request: typeof fetch;
  constructor(private readonly options: ExtractionClientOptions) { this.request = options.fetch ?? globalThis.fetch.bind(globalThis); }
  private url(path: string): string { return `${this.options.baseUrl.replace(/\/$/, "")}${path}`; }
  private init(signal?: AbortSignal): RequestInit { return { headers: { "content-type": "application/json", ...this.options.headers }, signal }; }
  async start(request: ExtractionRequest): Promise<ExtractionJob> { const response = await this.request(this.url("/jobs"), { ...this.init(), method: "POST", body: JSON.stringify(request) }); if (!response.ok) throw new Error(`Extraction start failed: ${response.status}`); return response.json() as Promise<ExtractionJob>; }
  async getStatus(jobId: string, signal: AbortSignal): Promise<ExtractionStatus> { const response = await this.request(this.url(`/jobs/${encodeURIComponent(jobId)}`), this.init(signal)); if (!response.ok) throw new Error(`Extraction status failed: ${response.status}`); return response.json() as Promise<ExtractionStatus>; }
  async cancel(jobId: string): Promise<void> { const response = await this.request(this.url(`/jobs/${encodeURIComponent(jobId)}`), { ...this.init(), method: "DELETE" }); if (!response.ok) throw new Error(`Extraction cancellation failed: ${response.status}`); }
}