import type { PdfBinary } from "./contracts.js";

export interface PageRange { start: number; end: number }
export interface PageRect { x: number; y: number; width: number; height: number }
export interface StructuralPdfOperations {
  pageCount(): number;
  rotatePages(pageIndexes: number[], degrees: 90 | 180 | 270): Promise<void>;
  removePages(pageIndexes: number[]): Promise<void>;
  insertBlankPage(index: number, width?: number, height?: number): Promise<void>;
  insertPages(index: number, source: PdfBinary, pageIndexes?: number[]): Promise<void>;
  duplicatePages(pageIndexes: number[]): Promise<void>;
  reorderPages(order: number[]): Promise<void>;
  extractPages(pageIndexes: number[]): Promise<Uint8Array>;
  split(ranges: PageRange[]): Promise<Uint8Array[]>;
  merge(sources: PdfBinary[]): Promise<void>;
  save(options?: { compressed?: boolean }): Promise<Uint8Array>;
  addTextWatermark(text: string, pageIndexes?: number[], options?: { fontSize?: number; opacity?: number }): Promise<void>;
  addPageNumbers(format?: string, pageIndexes?: number[]): Promise<void>;
  addHeaderFooter(header?: string, footer?: string, pageIndexes?: number[]): Promise<void>;
  attachFile(file: PdfBinary, name: string, description?: string, mimeType?: string): Promise<void>;
  removeAttachment(name: string): Promise<boolean>;
  createTextField(name: string, pageIndex: number, rect: PageRect, value?: string): Promise<void>;
  insertImage(file: PdfBinary, pageIndex: number, rect: PageRect, mimeType: "image/png" | "image/jpeg"): Promise<void>;
  setBookmarks(bookmarks: Array<{ title: string; pageIndex: number }>): Promise<void>;
  addNativeLink(id: string, pageIndex: number, rect: PageRect, target: { kind: "url"; url: string } | { kind: "page"; pageIndex: number }): Promise<void>;
  removeNativeLink(id: string): Promise<boolean>;
}