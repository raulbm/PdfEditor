import EmbedPDF from "@embedpdf/snippet";
import type { PdfEditorCapabilities, CriticalPdfOperations } from "@enterprise-pdf-editor/core";
import { EmbedPdfCriticalOperations } from "./critical-operations.js";

export interface EmbedPdfViewerAdapter {
  readonly kind: "embedpdf";
  readonly instance: ReturnType<typeof EmbedPDF.init>;
  saveAsCopy(): Promise<ArrayBuffer>;
  getCapabilities(): Promise<PdfEditorCapabilities>;
  getOperations(): CriticalPdfOperations;
}

/**
 * Mounts EmbedPDF behind the SDK adapter boundary. The host only provides PDF
 * bytes to the Web Component; it never needs to know EmbedPDF's API.
 */
export function mountEmbedPdfViewer(
  target: HTMLElement,
  sourceUrl: string,
): EmbedPdfViewerAdapter {
  const instance = EmbedPDF.init({
    type: "container",
    target,
    src: sourceUrl,
    theme: { preference: "light" },
  });
  if (!instance) throw new Error("EmbedPDF could not initialize.");

  return {
    kind: "embedpdf",
    instance,
    getOperations(): CriticalPdfOperations {
      return new EmbedPdfCriticalOperations(this as EmbedPdfViewerAdapter);
    },
    async getCapabilities(): Promise<PdfEditorCapabilities> {
      const registry = await instance.registry;
      const has = (id: string): boolean => typeof registry?.getPlugin === "function" && Boolean(registry.getPlugin(id));
      return {
        annotations: has("annotation"),
        redaction: has("redaction"),
        bookmarks: has("bookmark"),
        links: has("annotation"),
        attachments: has("attachment"),
        forms: has("form"),
        export: has("export"),
      };
    },
    async saveAsCopy(): Promise<ArrayBuffer> {
      const registry = await instance.registry;
      const getPlugin = registry?.getPlugin;
      if (typeof getPlugin !== "function") {
        throw new Error("EmbedPDF registry is unavailable.");
      }
      const pluginHandle = getPlugin.call(registry, "export");
      const provide = pluginHandle?.provides;
      if (typeof provide !== "function") {
        throw new Error("EmbedPDF export plugin is unavailable.");
      }
      const exportPlugin = provide.call(pluginHandle);
      const saveAsCopy = exportPlugin?.saveAsCopy as
        (() => { toPromise(): Promise<ArrayBuffer> }) | undefined;
      if (typeof saveAsCopy !== "function") {
        throw new Error("EmbedPDF export plugin is unavailable.");
      }
      const task = saveAsCopy();
      if (typeof task?.toPromise !== "function") {
        throw new Error("EmbedPDF export task is unavailable.");
      }
      return task.toPromise();
    },
  };
}

export { EmbedPdfCriticalOperations } from "./critical-operations.js";

