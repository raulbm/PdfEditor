import type {
  LoadedDocument,
  PersistenceProvider,
  SaveMode,
  SaveRequest,
  PdfEditorCapabilities,
  CriticalPdfOperations,
  DigitalSignatureProvider,
  DigitalSignatureRequest,
} from "@enterprise-pdf-editor/core";
import {
  mountEmbedPdfViewer,
  type EmbedPdfViewerAdapter,
} from "@enterprise-pdf-editor/engine-embedpdf";

export const PDF_EDITOR_TAG_NAME = "enterprise-pdf-editor";

export class EnterprisePdfEditor extends HTMLElement {
  private loadedDocument?: LoadedDocument;
  private persistence?: PersistenceProvider;
  private signer?: DigitalSignatureProvider;
  private objectUrl?: string;
  private viewer?: EmbedPdfViewerAdapter;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set document(value: LoadedDocument | undefined) {
    this.loadedDocument = value;
    void this.render();
  }

  get document(): LoadedDocument | undefined {
    return this.loadedDocument;
  }

  set persistenceProvider(value: PersistenceProvider | undefined) {
    this.persistence = value;
  }

  connectedCallback(): void {
    void this.render();
    this.dispatchEvent(new CustomEvent("pdf-ready", { bubbles: true, composed: true }));
  }

  getOperations(): CriticalPdfOperations {
    if (!this.viewer) throw new Error("The PDF viewer is not ready.");
    return this.viewer.getOperations();
  }

  async getCapabilities(): Promise<PdfEditorCapabilities> {
    if (!this.viewer) {
      return { annotations: false, redaction: false, bookmarks: false, links: false, attachments: false, forms: false, export: false };
    }
    return this.viewer.getCapabilities();
  }

  async requestSave(mode: SaveMode = "save"): Promise<void> {
    if (!this.loadedDocument) {
      this.emitError("UNSUPPORTED_PDF", "No document is loaded.");
      return;
    }

    if (!this.viewer) {
      this.emitError("UNSUPPORTED_PDF", "The PDF viewer is not ready.");
      return;
    }

    let content: Blob;
    try {
      content = new Blob([await this.viewer.saveAsCopy()], { type: "application/pdf" });
    } catch (error) {
      this.emitError("UNKNOWN", "The modified PDF could not be exported.", error);
      return;
    }
    const request: SaveRequest = {
      descriptor: this.loadedDocument.descriptor,
      content,
      sha256: await calculateSha256(content),
      mode,
      signal: new AbortController().signal,
    };

    if (!this.persistence) {
      this.dispatchEvent(new CustomEvent("pdf-save-requested", {
        detail: request,
        bubbles: true,
        composed: true,
      }));
      return;
    }

    try {
      const result = await this.persistence.save(request);
      this.loadedDocument = { ...this.loadedDocument, descriptor: result.descriptor };
      this.dispatchEvent(new CustomEvent("pdf-saved", {
        detail: result,
        bubbles: true,
        composed: true,
      }));
      void this.render();
    } catch (error) {
      this.dispatchEvent(new CustomEvent("pdf-save-failed", {
        detail: error,
        bubbles: true,
        composed: true,
      }));
    }
  }

  private emitError(code: string, message: string, cause?: unknown): void {
    this.dispatchEvent(new CustomEvent("pdf-error", {
      detail: { code, message, cause },
      bubbles: true,
      composed: true,
    }));
  }

  private async render(): Promise<void> {
    if (!this.shadowRoot) return;
    const name = this.loadedDocument?.descriptor.name ?? "Sin documento";
    this.objectUrl && URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = undefined;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: system-ui, sans-serif; }
        section { border: 1px solid var(--pdf-editor-border-color, #d1d5db); border-radius: 8px; min-height: 640px; }
        header { padding: 12px 16px; border-bottom: 1px solid var(--pdf-editor-border-color, #d1d5db); }
        p { margin: 0; color: var(--pdf-editor-muted-color, #4b5563); }
        #viewer { height: 580px; }
      </style>
      <section part="shell" aria-label="Editor PDF">
        <header><strong part="title">Enterprise PDF Editor</strong>
        <p part="status">${escapeHtml(name)}</p><button id="save" part="save">Guardar</button></header>
        <div id="viewer" part="viewer"></div>
      </section>`;

    this.shadowRoot.querySelector<HTMLButtonElement>("#save")?.addEventListener(
      "click",
      () => void this.requestSave(),
    );

    if (!this.loadedDocument) return;
    const viewer = this.shadowRoot.querySelector<HTMLElement>("#viewer");
    if (!viewer) return;

    this.objectUrl = URL.createObjectURL(await asBlob(this.loadedDocument.content));
    this.viewer = mountEmbedPdfViewer(viewer, this.objectUrl);
  }
}

async function asBlob(content: LoadedDocument["content"]): Promise<Blob> {
  if (content instanceof Blob) return content;
  if (content instanceof Uint8Array) {
    return new Blob([Uint8Array.from(content).buffer], { type: "application/pdf" });
  }
  return new Blob([content], { type: "application/pdf" });
}

async function calculateSha256(content: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await content.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;",
  })[character] ?? character);
}

if (!customElements.get(PDF_EDITOR_TAG_NAME)) {
  customElements.define(PDF_EDITOR_TAG_NAME, EnterprisePdfEditor);
}


