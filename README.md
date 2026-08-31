# Enterprise PDF Editor SDK

SDK TypeScript reutilizable para editar, visualizar, guardar y extraer contenido PDF desde cualquier aplicación web. El núcleo no depende de ASP.NET, Razor, React ni de un backend concreto.

## Objetivo

El mismo paquete puede consumirse desde HTML puro, Vanilla TypeScript, ASP.NET u otro framework. El host entrega documentos y decide cómo persistirlos; el SDK no conoce URLs de negocio ni credenciales.

## Estructura

- `packages/core`: contratos públicos neutrales.
- `packages/web-component`: elemento `<enterprise-pdf-editor>`.
- `packages/engine-embedpdf`: visualización, anotaciones, censura y exportación mediante EmbedPDF.
- `packages/engine-structural`: páginas, bookmarks, adjuntos, enlaces, formularios, imágenes, marcas y metadatos mediante pdf-lib.
- `packages/extraction-client`: cliente opcional para servicios de extracción/LiteParse.
- `examples/vanilla`: consumo sin framework.
- `examples/aspnet`: host ASP.NET que sirve los mismos bundles estáticos.
- `docs`: contratos y decisiones de arquitectura.

## Requisitos

- Node.js 22 o superior.
- npm 11 o superior.
- Para `test:liteparse`, CLI global `lit` de `@llamaindex/liteparse`.
- .NET 8/10 solo para ejecutar el ejemplo ASP.NET; no es requisito del SDK.

## Inicio rápido

```bash
npm install
npm run check
npm run build
```

La aplicación puede proporcionar un documento directamente:

```ts
import "@enterprise-pdf-editor/web-component";

const editor = document.querySelector("enterprise-pdf-editor");
editor.document = { descriptor: { name: "factura.pdf", version: "1" }, content: pdfBlob };
editor.persistenceProvider = {
  async save(request) {
    await fetch("/api/documents", { method: "PUT", body: request.content });
    return { descriptor: { ...request.descriptor, version: "2" } };
  },
};
```

Las operaciones críticas se obtienen desde `editor.getOperations()`. Las operaciones estructurales se pueden usar mediante `structuralPdfEngine` en un bundle browser independiente.

## Ejemplos

- `npm run build` genera `examples/vanilla/dist-app` y sincroniza el SDK en `examples/aspnet/wwwroot/sdk`.
- `npm run test:structural` genera un PDF de PoC y verifica páginas, bookmarks, enlaces, adjuntos, formularios, imagen y compresión.
- `npm run test:liteparse` comprueba extracción espacial local con LiteParse sobre ese PDF.

## Firma digital

El SDK incluye `DigitalSignatureProvider` y `requestDigitalSignature()`. El proveedor pertenece al host y debe conectar certificado, HSM o servicio remoto. El SDK nunca recibe ni almacena claves privadas. La firma manuscrita visual es una imagen y no equivale a firma criptográfica.

## Estado de la PoC

La base reutilizable y las operaciones principales están implementadas y compiladas. Las limitaciones actuales se mantienen en [`TODO.md`](TODO.md).

## Licencia del proyecto

MIT. Consulte [`LICENSE`](LICENSE). La licencia cubre el código propio de este repositorio; las dependencias conservan sus propias licencias.
