import "@enterprise-pdf-editor/web-component";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { structuralPdfEngine } from "@enterprise-pdf-editor/engine-structural";

const editor = document.querySelector("#editor") as HTMLElement & {
  document?: any;
  requestSave?: (mode?: "save" | "saveAs") => Promise<void>;
  getOperations?: () => any;
};
const status = document.querySelector("#status") as HTMLElement;
if (!editor) throw new Error("PDF editor element was not found.");

let revision = 1;
let currentContent: Blob;

function blobFromBytes(bytes: Uint8Array): Blob {
  return new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], { type: "application/pdf" });
}

async function createDemoPdf(): Promise<Blob> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("PDF Editor SDK — Vanilla", { x: 48, y: 780, size: 22, font, color: rgb(0.1, 0.2, 0.4) });
  page.drawText("Documento utilizado por el ejemplo reutilizable", { x: 48, y: 748, size: 12, font });
  return blobFromBytes(await pdf.save());
}

function load(content: Blob): void {
  currentContent = content;
  editor.document = {
    descriptor: { id: "vanilla-demo", name: `demo-v${revision}.pdf`, version: String(revision) },
    content,
  };
  status.textContent = `Documento cargado · revisión ${revision}`;
}

async function mutate(label: string, operation: (engine: any) => Promise<void>): Promise<void> {
  try {
    const engine = await structuralPdfEngine.open(currentContent);
    await operation(engine);
    currentContent = blobFromBytes(await engine.save({ compressed: true }));
    revision += 1;
    load(currentContent);
    status.textContent = `${label} aplicada · ${currentContent.size} bytes · revisión ${revision}`;
  } catch (error) {
    status.textContent = `${label} no disponible: ${error instanceof Error ? error.message : String(error)}`;
  }
}

document.querySelectorAll<HTMLButtonElement>("[data-operation]").forEach((button) => {
  button.addEventListener("click", async () => {
    const op = button.dataset.operation;
    if (op === "watermark") return mutate("Marca de agua", (e) => e.addTextWatermark("CONFIDENCIAL"));
    if (op === "numbering") return mutate("Numeración", (e) => e.addPageNumbers("Página {page}/{total}"));
    if (op === "rotate") return mutate("Rotación", (e) => e.rotatePages([0], 90));
    if (op === "blank") return mutate("Inserción de página", (e) => e.insertBlankPage(1));
    if (op === "annotate") {
      try { await editor.getOperations?.().then((ops: any) => ops.addAnnotation({ id: crypto.randomUUID(), pageIndex: 0, subtype: "highlight", rect: { origin: { x: 48, y: 700 }, size: { width: 220, height: 28 } }, contents: "Anotación de demostración", color: "#ffcc00", opacity: 0.6 })); status.textContent = "Anotación añadida · usa Guardar copia para persistir"; } catch (error) { status.textContent = `Anotación no disponible: ${error instanceof Error ? error.message : String(error)}`; }
      return;
    }
    if (op === "redact") {
      try { const ops = editor.getOperations?.(); await ops.markRedaction({ id: crypto.randomUUID(), pageIndex: 0, rect: { origin: { x: 48, y: 700 }, size: { width: 220, height: 28 } }, text: "PDF Editor SDK" }); const result = await ops.commitRedactions(); status.textContent = result.committed ? "Censura aplicada irreversiblemente · usa Guardar copia" : "Censura pendiente"; } catch (error) { status.textContent = `Censura no disponible: ${error instanceof Error ? error.message : String(error)}`; }
      return;
    }
    if (op === "attachment") { try { await editor.getOperations?.().then((ops: any) => ops.addAttachment(new Blob(["evidence from vanilla"], { type: "text/plain" }), "evidence.txt", "UI evidence")); status.textContent = "Adjunto añadido · usa Guardar copia"; } catch (error) { status.textContent = `Adjunto no disponible: ${error instanceof Error ? error.message : String(error)}`; } return; }
    if (op === "link") { try { await editor.getOperations?.().then((ops: any) => ops.addLink({ id: crypto.randomUUID(), pageIndex: 0, rect: { origin: { x: 48, y: 650 }, size: { width: 180, height: 24 } }, target: { kind: "url", url: "https://example.com" } })); status.textContent = "Enlace externo añadido · usa Guardar copia"; } catch (error) { status.textContent = `Enlace no disponible: ${error instanceof Error ? error.message : String(error)}`; } return; }
    if (op === "forms") { try { const fields = await editor.getOperations?.().then((ops: any) => ops.listFormFields()); status.textContent = `Campos AcroForm detectados: ${fields?.length ?? 0}`; } catch (error) { status.textContent = `Formularios no disponibles: ${error instanceof Error ? error.message : String(error)}`; } return; }
    if (op === "image") return mutate("Imagen", async (e) => { const pixel = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="), (c) => c.charCodeAt(0)); await e.insertImage(pixel, 0, { x: 480, y: 700, width: 48, height: 48 }, "image/png"); });
    if (op === "header") return mutate("Encabezado y pie", (e) => e.addHeaderFooter("Enterprise PDF Editor", "Página {page}"));
    if (op === "bookmarks") return mutate("Bookmarks", (e) => e.setBookmarks([{ title: "Inicio", pageIndex: 0 }, { title: "Contenido", pageIndex: Math.min(1, e.pageCount - 1) }]));
    if (op === "inspect") { try { const ops = editor.getOperations?.(); const [annotations, links, attachments] = await Promise.all([ops.listAnnotations(), ops.listLinks(), ops.listAttachments()]); status.textContent = `Elementos: ${annotations.length} anotaciones · ${links.length} enlaces · ${attachments.length} adjuntos`; } catch (error) { status.textContent = `Inspección no disponible: ${error instanceof Error ? error.message : String(error)}`; } return; }
    if (op === "remove-attachment") { try { const ops = editor.getOperations?.(); const attachments = await ops.listAttachments(); if (!attachments.length) { status.textContent = "No hay adjuntos para eliminar"; return; } await ops.removeAttachment(attachments[0].id); status.textContent = `Adjunto eliminado: ${attachments[0].name} · usa Guardar copia`; } catch (error) { status.textContent = `Eliminación no disponible: ${error instanceof Error ? error.message : String(error)}`; } return; }
    if (op === "save") return editor.requestSave?.("saveAs");
  });
});

editor.addEventListener("pdf-save-requested", () => {
  status.textContent = `${status.textContent} · evento de guardado emitido al host`;
});

const signatureCanvas = document.querySelector("#signature") as HTMLCanvasElement;
const signatureContext = signatureCanvas.getContext("2d");
if (signatureContext) { signatureContext.lineWidth = 3; signatureContext.strokeStyle = "#173b70"; signatureContext.beginPath(); signatureContext.moveTo(20, 60); signatureContext.bezierCurveTo(80, 10, 130, 85, 210, 35); signatureContext.stroke(); signatureContext.font = "16px sans-serif"; signatureContext.fillText("Firma demo", 220, 70); }
document.querySelector("#apply-signature")?.addEventListener("click", async () => { const blob = await new Promise<Blob | null>((resolve) => signatureCanvas.toBlob(resolve, "image/png")); if (!blob) return; await mutate("Firma manuscrita visual", async (e) => e.insertImage(new Uint8Array(await blob.arrayBuffer()), 0, { x: 48, y: 580, width: 180, height: 50 }, "image/png")); });

load(await createDemoPdf());












