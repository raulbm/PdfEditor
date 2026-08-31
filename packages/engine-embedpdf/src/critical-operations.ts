import type { CriticalPdfOperations, AnnotationDraft, RedactionMark, RedactionCommitResult, BookmarkNode, PdfLink, PdfAttachmentInfo, PdfFormField } from "@enterprise-pdf-editor/core";
import type { EmbedPdfViewerAdapter } from "./index.js";

type AnyRecord = Record<string, any>;
const taskResult = async <T>(task: AnyRecord): Promise<T> => {
  if (!task || typeof task.toPromise !== "function") throw new Error("EmbedPDF task unavailable");
  const toPromise = task.toPromise as (() => Promise<T>) | undefined;
  if (typeof toPromise !== "function") throw new Error("EmbedPDF task unavailable");
  return toPromise();
};

export class EmbedPdfCriticalOperations implements CriticalPdfOperations {
  constructor(private readonly adapter: EmbedPdfViewerAdapter) {}
  private async capability(id: string): Promise<AnyRecord> {
    const instance = this.adapter.instance;
    if (!instance) throw new Error("EmbedPDF instance unavailable");
    const registry = await instance.registry;
    if (!registry) throw new Error("EmbedPDF registry unavailable");
    const plugin = typeof registry?.getPlugin === "function" ? registry.getPlugin(id) : undefined;
    const provides = plugin?.provides;
    if (typeof provides !== "function") throw new Error(`EmbedPDF capability unavailable: ${id}`);
    return provides.call(plugin) as AnyRecord;
  }
  async listAnnotations(pageIndex?: number): Promise<AnnotationDraft[]> {
    const a = await this.capability("annotation");
    return (a.getAnnotations({ pageIndex }) as AnyRecord[]).map((x) => ({ ...x.object, subtype: String(x.object.type) }));
  }
  async addAnnotation(annotation: AnnotationDraft): Promise<void> {
    const a = await this.capability("annotation");
    a.createAnnotation(annotation.pageIndex, { ...annotation, type: Number(annotation.subtype) || 9 });
  }
  async removeAnnotation(id: string): Promise<void> {
    const a = await this.capability("annotation");
    const found = a.getAnnotationById(id);
    if (!found) return;
    a.deleteAnnotation(found.object.pageIndex, id);
  }
  async markRedaction(mark: RedactionMark): Promise<void> {
    const r = await this.capability("redaction");
    r.addPending([{ id: mark.id, page: mark.pageIndex, rect: mark.rect, kind: "area", source: "annotation", markColor: "#ff0000", redactionColor: "#000000" }]);
  }
  async commitRedactions(): Promise<RedactionCommitResult> {
    const r = await this.capability("redaction");
    const committed = Boolean(await taskResult<boolean>(r.commitAllPending()));
    return { committed, removedTextEvidence: committed };
  }
  async getBookmarks(): Promise<BookmarkNode[]> {
    const b = await this.capability("bookmark");
    const result = await taskResult<{ bookmarks: BookmarkNode[] }>(b.getBookmarks());
    return result.bookmarks ?? [];
  }
  async setBookmarks(_bookmarks: BookmarkNode[]): Promise<void> {
    throw new Error("EmbedPDF bookmark mutation is not available in the current runtime");
  }
  async listLinks(): Promise<PdfLink[]> {
    const annotations = await this.listAnnotations();
    return annotations.filter((x) => x.subtype === "2").map((x) => ({ ...x, target: { kind: "url", url: String((x as AnyRecord).url ?? "") } })) as PdfLink[];
  }
  async addLink(link: PdfLink): Promise<void> {
    await this.addAnnotation({ id: link.id, pageIndex: link.pageIndex, subtype: "2", rect: link.rect, contents: JSON.stringify(link.target) });
  }
  async removeLink(id: string): Promise<void> { await this.removeAnnotation(id); }
  async listAttachments(): Promise<PdfAttachmentInfo[]> {
    const a = await this.capability("attachment");
    const items = await taskResult<AnyRecord[]>(a.getAttachments());
    return items.map((x) => ({ id: String(x.id), name: String(x.name ?? x.fileName ?? "attachment"), description: x.description, size: Number(x.size ?? 0), mimeType: x.mimeType }));
  }
  async downloadAttachment(id: string): Promise<Blob> {
    const a = await this.capability("attachment");
    const item = (await this.listAttachments()).find((x) => x.id === id);
    if (!item) throw new Error(`Attachment not found: ${id}`);
    return new Blob([await taskResult<ArrayBuffer>(a.downloadAttachment(item as AnyRecord))], { type: item.mimeType ?? "application/octet-stream" });
  }
  async addAttachment(_file: Blob, _name: string, _description?: string): Promise<void> { throw new Error("EmbedPDF attachment creation is not available in the current runtime"); }
  async removeAttachment(_id: string): Promise<void> { throw new Error("EmbedPDF attachment deletion is not available in the current runtime"); }
  async listFormFields(): Promise<PdfFormField[]> {
    const f = await this.capability("form");
    return (f.getFormFields?.() ?? []).map((x: AnyRecord) => ({ id: x.name, name: x.name, type: String(x.type), value: x.value }));
  }
  async setFormValues(values: Record<string, PdfFormField["value"]>): Promise<void> {
    const f = await this.capability("form");
    await taskResult<boolean>(f.setFormValues(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v ?? "")]))));
  }
}