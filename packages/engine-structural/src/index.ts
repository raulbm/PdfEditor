import { PDFDocument, PDFArray, PDFDict, PDFName, PDFString, PDFHexString, degrees, StandardFonts, rgb } from "pdf-lib";
import type { PdfBinary, PageRange, StructuralPdfOperations, PageRect } from "@enterprise-pdf-editor/core";

async function bytes(value: PdfBinary): Promise<Uint8Array> {
  if (value instanceof Blob) return new Uint8Array(await value.arrayBuffer());
  if (value instanceof Uint8Array) return value;
  return new Uint8Array(value);
}

export class PdfLibStructuralEngine implements StructuralPdfOperations {
  private constructor(private readonly pdf: PDFDocument) {}
  static async open(content: PdfBinary): Promise<PdfLibStructuralEngine> {
    return new PdfLibStructuralEngine(await PDFDocument.load(await bytes(content), { ignoreEncryption: false }));
  }
  pageCount(): number { return this.pdf.getPageCount(); }
  async rotatePages(pageIndexes: number[], rotation: 90 | 180 | 270): Promise<void> {
    for (const index of pageIndexes) {
      const page = this.pdf.getPage(index);
      page.setRotation(degrees((page.getRotation().angle + rotation) % 360));
    }
  }
  async removePages(pageIndexes: number[]): Promise<void> {
    const unique = [...new Set(pageIndexes)].sort((a, b) => b - a);
    if (unique.some((i) => i < 0 || i >= this.pageCount())) throw new RangeError("Page index out of range");
    if (unique.length >= this.pageCount()) throw new Error("Cannot remove all pages");
    unique.forEach((i) => this.pdf.removePage(i));
  }
  async insertBlankPage(index: number, width = 612, height = 792): Promise<void> {
    this.pdf.insertPage(index, [width, height]);
  }
  async insertPages(index: number, source: PdfBinary, pageIndexes?: number[]): Promise<void> {
    const sourceDoc = await PDFDocument.load(await bytes(source));
    const indexes = pageIndexes ?? sourceDoc.getPages().map((_, i) => i);
    const copied = await this.pdf.copyPages(sourceDoc, indexes);
    copied.forEach((page, offset) => this.pdf.insertPage(index + offset, page));
  }
  async duplicatePages(pageIndexes: number[]): Promise<void> {
    const copies = await this.pdf.copyPages(this.pdf, pageIndexes);
    copies.forEach((page, offset) => this.pdf.insertPage(pageIndexes[offset] + offset + 1, page));
  }
  async reorderPages(order: number[]): Promise<void> {
    const count = this.pageCount();
    if (order.length !== count || new Set(order).size !== count || order.some((i) => i < 0 || i >= count)) throw new Error("Order must contain every page exactly once");
    const source = await PDFDocument.create();
    const copied = await source.copyPages(this.pdf, order);
    copied.forEach((page) => source.addPage(page));
    const rebuilt = await PDFDocument.load(await source.save());
    while (this.pdf.getPageCount() > 0) this.pdf.removePage(0);
    const pages = await this.pdf.copyPages(rebuilt, rebuilt.getPageIndices());
    pages.forEach((page) => this.pdf.addPage(page));
  }
  async extractPages(pageIndexes: number[]): Promise<Uint8Array> {
    const out = await PDFDocument.create();
    const copied = await out.copyPages(this.pdf, pageIndexes);
    copied.forEach((page) => out.addPage(page));
    return out.save({ useObjectStreams: true });
  }
  async split(ranges: PageRange[]): Promise<Uint8Array[]> {
    return Promise.all(ranges.map((r) => this.extractPages(Array.from({ length: r.end - r.start + 1 }, (_, i) => r.start + i))));
  }
  async merge(sources: PdfBinary[]): Promise<void> {
    for (const source of sources) {
      const doc = await PDFDocument.load(await bytes(source));
      const copied = await this.pdf.copyPages(doc, doc.getPageIndices());
      copied.forEach((page) => this.pdf.addPage(page));
    }
  }
  async addTextWatermark(text: string, pageIndexes?: number[], options: { fontSize?: number; opacity?: number } = {}): Promise<void> {
    const font = await this.pdf.embedFont(StandardFonts.Helvetica);
    const indexes = pageIndexes ?? this.pdf.getPageIndices();
    for (const index of indexes) {
      const page = this.pdf.getPage(index);
      const size = page.getSize();
      page.drawText(text, { x: size.width / 2 - font.widthOfTextAtSize(text, options.fontSize ?? 36) / 2, y: size.height / 2, size: options.fontSize ?? 36, font, color: rgb(0.5, 0.5, 0.5), opacity: options.opacity ?? 0.2, rotate: degrees(45) });
    }
  }
  async addPageNumbers(format = "{page}/{total}", pageIndexes?: number[]): Promise<void> {
    const font = await this.pdf.embedFont(StandardFonts.Helvetica);
    const indexes = pageIndexes ?? this.pdf.getPageIndices();
    for (let position = 0; position < indexes.length; position++) {
      const page = this.pdf.getPage(indexes[position]);
      const size = page.getSize();
      const label = format.replace("{page}", String(position + 1)).replace("{total}", String(indexes.length));
      page.drawText(label, { x: size.width - font.widthOfTextAtSize(label, 10) - 24, y: 18, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    }
  }
  async attachFile(file: PdfBinary, name: string, description?: string, mimeType?: string): Promise<void> {
    await this.pdf.attach(await bytes(file), name, { description, mimeType });
  }
  async removeAttachment(name: string): Promise<boolean> {
    const names = this.pdf.catalog.lookupMaybe(PDFName.of("Names"), PDFDict);
    const embedded = names?.lookupMaybe(PDFName.of("EmbeddedFiles"), PDFDict);
    const entries = embedded?.lookupMaybe(PDFName.of("Names"), PDFArray);
    if (!entries) return false;
    for (let i = 0; i + 1 < entries.size(); i += 2) {
      const raw = entries.get(i);
      const key = raw instanceof PDFString || raw instanceof PDFHexString ? raw : undefined;
      if (key?.decodeText() === name) { entries.remove(i + 1); entries.remove(i); if (entries.size() === 0) names?.delete(PDFName.of("EmbeddedFiles")); return true; }
    }
    return false;
  }
  async createTextField(name: string, pageIndex: number, rect: PageRect, value = ""): Promise<void> {
    const field = this.pdf.getForm().createTextField(name);
    field.setText(value);
    field.addToPage(this.pdf.getPage(pageIndex), { x: rect.x, y: rect.y, width: rect.width, height: rect.height, borderWidth: 1 });
  }
  async addHeaderFooter(header = "", footer = "", pageIndexes?: number[]): Promise<void> {
    const font = await this.pdf.embedFont(StandardFonts.Helvetica);
    const indexes = pageIndexes ?? this.pdf.getPageIndices();
    for (const index of indexes) {
      const page = this.pdf.getPage(index); const size = page.getSize();
      if (header) page.drawText(header, { x: 24, y: size.height - 24, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
      if (footer) page.drawText(footer, { x: 24, y: 18, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    }
  }
  async addNativeLink(id: string, pageIndex: number, rect: PageRect, target: { kind: "url"; url: string } | { kind: "page"; pageIndex: number }): Promise<void> {
    const page = this.pdf.getPage(pageIndex); const annots = page.node.Annots() ?? this.pdf.context.obj([]);
    if (!page.node.Annots()) page.node.set(PDFName.of("Annots"), annots);
    const link = this.pdf.context.obj({ Type: PDFName.of("Annot"), Subtype: PDFName.of("Link"), Rect: this.pdf.context.obj([rect.x, rect.y, rect.x + rect.width, rect.y + rect.height]), NM: PDFString.of(id), Border: this.pdf.context.obj([0, 0, 0]) });
    if (target.kind === "url") link.set(PDFName.of("A"), this.pdf.context.obj({ S: PDFName.of("URI"), URI: PDFString.of(target.url) })); else link.set(PDFName.of("Dest"), this.pdf.context.obj([this.pdf.getPage(target.pageIndex).ref, PDFName.of("Fit")]));
    annots.push(this.pdf.context.register(link));
  }
  async removeNativeLink(id: string): Promise<boolean> {
    for (const page of this.pdf.getPages()) { const annots = page.node.Annots(); if (!annots) continue; for (let i = 0; i < annots.size(); i++) { const dict = annots.lookupMaybe(i, PDFDict); const nm = dict?.lookupMaybe(PDFName.of("NM"), PDFString); if (nm?.decodeText() === id) { annots.remove(i); return true; } } }
    return false;
  }
  async setBookmarks(bookmarks: Array<{ title: string; pageIndex: number }>): Promise<void> {
    if (bookmarks.length === 0) { this.pdf.catalog.delete(PDFName.of("Outlines")); return; }
    const context = this.pdf.context;
    const root = context.obj({ Type: PDFName.of("Outlines"), Count: bookmarks.length });
    const rootRef = context.register(root);
    const refs = bookmarks.map(() => context.nextRef());
    refs.forEach((ref, i) => { const b = context.obj({ Title: PDFString.of(bookmarks[i].title), Parent: rootRef, Dest: context.obj([this.pdf.getPage(bookmarks[i].pageIndex).ref, PDFName.of("XYZ"), null, null, null]) }); if (i > 0) b.set(PDFName.of("Prev"), refs[i - 1]); if (i < refs.length - 1) b.set(PDFName.of("Next"), refs[i + 1]); context.assign(ref, b); });
    root.set(PDFName.of("First"), refs[0]); root.set(PDFName.of("Last"), refs[refs.length - 1]);
    this.pdf.catalog.set(PDFName.of("Outlines"), rootRef);
  }
  async insertImage(file: PdfBinary, pageIndex: number, rect: PageRect, mimeType: "image/png" | "image/jpeg"): Promise<void> {
    const image = mimeType === "image/png" ? await this.pdf.embedPng(await bytes(file)) : await this.pdf.embedJpg(await bytes(file));
    this.pdf.getPage(pageIndex).drawImage(image, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
  }
  async save(options: { compressed?: boolean } = {}): Promise<Uint8Array> {
    return this.pdf.save({ useObjectStreams: options.compressed !== false, addDefaultPage: false });
  }
}

export interface StructuralPdfEngineAdapter { readonly kind: "structural"; open(content: PdfBinary): Promise<PdfLibStructuralEngine>; }
export const structuralPdfEngine: StructuralPdfEngineAdapter = { kind: "structural", open: PdfLibStructuralEngine.open };