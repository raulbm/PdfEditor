import type { LoadedDocument, PersistenceProvider, SaveMode, PdfEditorCapabilities, CriticalPdfOperations } from "@enterprise-pdf-editor/core";
export declare const PDF_EDITOR_TAG_NAME = "enterprise-pdf-editor";
export declare class EnterprisePdfEditor extends HTMLElement {
    private loadedDocument?;
    private persistence?;
    private signer?;
    private objectUrl?;
    private viewer?;
    constructor();
    set document(value: LoadedDocument | undefined);
    get document(): LoadedDocument | undefined;
    set persistenceProvider(value: PersistenceProvider | undefined);
    connectedCallback(): void;
    getOperations(): CriticalPdfOperations;
    getCapabilities(): Promise<PdfEditorCapabilities>;
    requestSave(mode?: SaveMode): Promise<void>;
    private emitError;
    private render;
}
//# sourceMappingURL=index.d.ts.map