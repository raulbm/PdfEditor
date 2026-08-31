import type { DocumentDescriptor } from "./contracts.js";

export interface PdfRect { origin: { x: number; y: number }; size: { width: number; height: number } }
export interface AnnotationDraft { id: string; pageIndex: number; subtype: string; rect: PdfRect; contents?: string; color?: string; opacity?: number }
export interface RedactionMark { id: string; pageIndex: number; rect: PdfRect; text?: string }
export interface RedactionCommitResult { committed: boolean; removedTextEvidence: boolean; descriptor?: DocumentDescriptor }
export interface BookmarkNode { title: string; pageIndex?: number; children?: BookmarkNode[] }
export interface PdfLink { id: string; pageIndex: number; rect: PdfRect; target: { kind: "url"; url: string } | { kind: "page"; pageIndex: number } }
export interface PdfAttachmentInfo { id: string; name: string; description?: string; size: number; mimeType?: string }
export interface PdfFormField { id: string; name: string; type: string; value?: string | string[] | boolean | number }

export interface CriticalPdfOperations {
  listAnnotations(pageIndex?: number): Promise<AnnotationDraft[]>;
  addAnnotation(annotation: AnnotationDraft): Promise<void>;
  removeAnnotation(id: string): Promise<void>;
  markRedaction(mark: RedactionMark): Promise<void>;
  commitRedactions(): Promise<RedactionCommitResult>;
  getBookmarks(): Promise<BookmarkNode[]>;
  setBookmarks(bookmarks: BookmarkNode[]): Promise<void>;
  listLinks(): Promise<PdfLink[]>;
  addLink(link: PdfLink): Promise<void>;
  removeLink(id: string): Promise<void>;
  listAttachments(): Promise<PdfAttachmentInfo[]>;
  downloadAttachment(id: string): Promise<Blob>;
  addAttachment(file: Blob, name: string, description?: string): Promise<void>;
  removeAttachment(id: string): Promise<void>;
  listFormFields(): Promise<PdfFormField[]>;
  setFormValues(values: Record<string, PdfFormField["value"]>): Promise<void>;
}