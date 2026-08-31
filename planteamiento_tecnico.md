# Planteamiento técnico revisado — SDK web reutilizable de edición PDF

**Documento de partida:** `requisitos_editor_pdf_aspnet_liteparse.md`, versión 1.1  
**Fecha de revisión:** 30 de agosto de 2026  
**Estado:** arquitectura candidata para validar mediante PoC  
**Resultado objetivo:** librería web reutilizable, sin acoplamiento con ASP.NET ni con otro framework o backend

## 1. Decisión arquitectónica

El producto se construirá como un **SDK web de edición PDF autónomo y framework-agnostic**. La aplicación ASP.NET mencionada en los requisitos será el primer consumidor, pero no formará parte del núcleo ni condicionará su API.

La dirección de dependencias será siempre:

```text
Aplicación HTML/ASP.NET/React/Angular/Vue
                    │
                    ▼
              SDK PDF web
                    │
                    ├── EmbedPDF/PDFium
                    └── motor estructural PDF
```

El SDK no conocerá controladores, sesiones, modelos de dominio, bases de datos, almacenamiento, tokens ni reglas de negocio del consumidor. Todo lo externo se conectará mediante interfaces inyectables y eventos estándar.

## 2. Interpretación del documento de requisitos

La especificación funcional se conserva. Lo que cambia es la asignación arquitectónica de responsabilidades:

| Bloque de requisitos | Propietario |
|---|---|
| PDF-001 a PDF-178: visualización, anotaciones, objetos, páginas y edición PDF | SDK |
| PDF-180/181/184/185: guardar, guardar como, cambios pendientes y errores | SDK + contrato con el host |
| PDF-182/183/186: versionado, auditoría y recuperación persistente | Aplicación host |
| PDF-190 a PDF-192: concurrencia y bloqueo | Aplicación host; el SDK representa el resultado |
| OCR-001 a OCR-014 | Proveedor de extracción opcional, local WASM o servicio controlado |
| MD-001 a MD-022 y MD-029 | LiteParse/proveedor de extracción |
| MD-023 a MD-025 | SDK, si se instala el módulo de extracción |
| MD-026 a MD-028 y MD-030 | Aplicación host mediante contratos opcionales |
| SEC-001/002/003/007/008 | SDK y proveedor de extracción, según corresponda |
| SEC-004/005/006 | Aplicación host; el SDK no sustituye su autorización |
| INT-001 | SDK/proveedor de extracción |
| INT-002/003 | Host, apoyado por hashes y metadatos producidos por el SDK |

Las etiquetas EP, PL, LL, BE, LP y OCR del documento son hipótesis técnicas, no parte inmutable del requisito. En particular, `BE` significa “responsabilidad del host o servicio”, no “dependencia de ASP.NET”.

## 3. Forma del producto

Se propone un monorepo con paquetes independientes:

```text
packages/
├── core/                 # estado, comandos y contratos; sin UI
├── engine-embedpdf/      # adaptación de EmbedPDF/PDFium
├── engine-structural/    # adaptación de pdf-lib u otro motor
├── web-component/        # <enterprise-pdf-editor>
├── extraction-client/    # contrato opcional LiteParse/OCR
└── themes/               # tokens y tema predeterminado

services/
└── liteparse/            # servicio opcional, independiente del host

examples/
├── vanilla/              # integración mínima de referencia
├── aspnet/               # consumidor de ejemplo, nunca dependencia
└── react/                # wrapper fino opcional
```

Artefactos de distribución:

- paquetes npm ESM con tipos TypeScript;
- Web Component `<enterprise-pdf-editor>`;
- bundle para integración mediante `<script type="module">` sin npm;
- assets WASM y Web Workers con ruta configurable, compatibles con subrutas y CSP;
- contenedor opcional LiteParse/OCR con contrato OpenAPI versionado.

Los wrappers React, Angular o Vue solo adaptarán propiedades y eventos del Web Component. No implementarán lógica alternativa.

## 4. Arquitectura lógica

```text
┌──────────────────────── Aplicación host ──────────────────────────┐
│ Autenticación, autorización, documentos, versiones, auditoría     │
│ Reglas de negocio, almacenamiento y política de concurrencia      │
└──────────────────────────────┬────────────────────────────────────┘
                               │ providers + eventos DOM
┌──────────────────────────────▼────────────────────────────────────┐
│ <enterprise-pdf-editor>                                           │
│  ├─ Editor Shell, paneles, accesibilidad e i18n                   │
│  ├─ DocumentSession y estado de cambios                           │
│  ├─ CommandBus, deshacer/rehacer                                  │
│  ├─ ViewerAdapter: render, selección y anotaciones                │
│  ├─ MutationAdapter: páginas, merge, adjuntos y estructura        │
│  ├─ PersistenceProvider opcional                                  │
│  └─ ExtractionProvider opcional                                   │
└───────────────────────┬─────────────────────┬─────────────────────┘
                        │                     │ HTTP opcional
             ┌──────────▼──────────┐  ┌──────▼─────────────────────┐
             │ PDFium / pdf-lib /  │  │ Servicio LiteParse + OCR  │
             │ motor sustituible   │  │ autónomo y reemplazable   │
             └─────────────────────┘  └────────────────────────────┘
```

### Principios

1. **Núcleo sin red.** Core, motores y Web Component no llaman a endpoints de negocio. Solo un provider suministrado por el host puede hacerlo.
2. **Inversión de control.** Carga, persistencia, versionado y extracción se solicitan a interfaces del consumidor.
3. **Estado PDF canónico único.** EmbedPDF y el motor estructural no mantienen copias divergentes. Una mutación estructural genera nuevos bytes y una recarga controlada.
4. **API pública propia.** Ningún consumidor recibe tipos internos de EmbedPDF, pdf-lib o LiteParse.
5. **Capacidades opcionales.** Sin persistencia se puede editar y descargar; sin extracción no se muestra OCR/Markdown.
6. **Sin SaaS implícito.** Ningún documento abandona el navegador salvo configuración e invocación expresa de un provider remoto.
7. **Interoperabilidad.** Una función no termina hasta guardar, reabrir, volver a editar cuando proceda y validar en lectores externos.

## 5. Contrato público del SDK

La API exacta se cerrará durante la PoC, pero seguirá esta forma:

```ts
export type PdfBinary = Blob | ArrayBuffer | Uint8Array;

export interface DocumentDescriptor {
  id?: string;
  name: string;
  version?: string;
  etag?: string;
  readOnly?: boolean;
  metadata?: Record<string, unknown>;
}

export interface LoadedDocument {
  descriptor: DocumentDescriptor;
  content: PdfBinary;
}

export interface DocumentProvider {
  open(request: { documentId?: string; signal: AbortSignal }):
    Promise<LoadedDocument>;
}

export interface SaveRequest {
  descriptor: DocumentDescriptor;
  content: Blob;
  sha256: string;
  mode: "save" | "save-as";
  signal: AbortSignal;
}

export interface PersistenceProvider {
  save(request: SaveRequest): Promise<{ descriptor: DocumentDescriptor }>;
}

export interface ExtractionProvider {
  start(request: ExtractionRequest): Promise<ExtractionJob>;
  getStatus(jobId: string, signal: AbortSignal): Promise<ExtractionStatus>;
  cancel(jobId: string): Promise<void>;
}
```

El host también podrá entregar directamente el PDF sin `DocumentProvider`. Si no aporta `PersistenceProvider`, el SDK emitirá `pdf-save-requested` con el `Blob` o permitirá descargarlo.

Eventos mínimos:

```text
pdf-ready
pdf-dirty-state-changed
pdf-save-requested
pdf-saved
pdf-save-failed
pdf-conflict
pdf-document-replaced
pdf-redaction-committed
pdf-extraction-progress
pdf-error
```

Los errores tendrán códigos estables como `CONFLICT`, `UNAUTHORIZED`, `READ_ONLY`, `FILE_TOO_LARGE`, `UNSUPPORTED_PDF` y `EXTRACTION_FAILED`. El consumidor no tendrá que analizar mensajes.

### Uso universal

```html
<enterprise-pdf-editor id="pdfEditor"></enterprise-pdf-editor>

<script type="module">
  import "@pdf-editor/web-component";

  const editor = document.querySelector("#pdfEditor");
  editor.document = {
    descriptor: { id: "123", name: "informe.pdf", version: "7" },
    content: pdfBlob,
  };
  editor.persistenceProvider = applicationPersistence;
</script>
```

El ejemplo ASP.NET obtendrá `pdfBlob` mediante su API e inyectará `applicationPersistence`. El paquete no contendrá ramas para ASP.NET.

## 6. Responsabilidades

### SDK

- PDF-001 a PDF-178;
- estado sucio, confirmación al abandonar y errores visibles;
- generación de PDF, hash SHA-256 y metadatos técnicos;
- UI, atajos, paneles, i18n, temas y accesibilidad;
- validación previa de formato y límites configurados;
- descarga, impresión y exportaciones locales;
- preview/copia/descarga Markdown cuando exista `ExtractionProvider`;
- telemetría solo por callback opt-in, sin destino incorporado.

### Aplicación host

- identidad, autenticación y autorización;
- localización y entrega del documento;
- almacenamiento, versionado, auditoría y retención;
- política de guardar/guardar como;
- concurrencia y bloqueo;
- acceso a versiones anteriores tras una censura;
- asociación de Markdown, JSON e imágenes con la versión fuente;
- capacidades, idioma, tema, límites y sellos corporativos.

### Servicio LiteParse/OCR opcional

- detección de OCR por página;
- parsing nativo y OCR selectivo;
- Markdown, JSON e imágenes;
- progreso, cancelación y errores parciales;
- motor OCR sustituible;
- ejecución local o en infraestructura controlada;
- temporales, cuotas, aislamiento, métricas y limpieza;
- contrato HTTP independiente de ASP.NET y del dominio consumidor.

En el futuro, un provider WASM local podrá sustituir al servicio sin cambiar la API pública.

## 7. Consecuencias sobre requisitos concretos

### Apertura, guardado y concurrencia

PDF-001 pasa a significar “abrir desde la aplicación host”. PDF-180 a PDF-186 se dividen: el SDK produce el resultado y controla la experiencia; el host persiste, versiona y audita.

`version` y `etag` son metadatos opacos. El host puede usar ETag, número de versión, bloqueo u otra estrategia y devolver `CONFLICT`.

### Objetos editables

Se distinguirá entre:

- anotaciones PDF estándar, preferidas cuando deban seguir editables;
- contenido incorporado a la página, persistente visualmente pero no necesariamente editable;
- metadatos privados del SDK, solo complementarios y nunca única persistencia de un requisito interoperable.

### Censura

El SDK aplica y verifica la censura sobre los bytes resultantes. El host controla las versiones anteriores. La guía advertirá que conservar el original accesible puede neutralizar el objetivo empresarial.

### Firmas existentes

El SDK intentará detectar firmas y advertirá antes de modificar. El host decide si bloquea, permite guardar como copia o aplica otra política.

### LiteParse y derivados

`sourceVersionId` será opcional y opaco. La identidad técnica común será el SHA-256 del PDF fuente. El host asociará ese hash a su versión y marcará derivados obsoletos cuando cambie.

## 8. PoC de decisión

### PoC A — Reutilización real

1. Compilar una sola vez los paquetes.
2. Consumirlos desde HTML/TypeScript sin backend específico.
3. Consumir los mismos artefactos desde ASP.NET.
4. Abrir mediante bytes y mediante `DocumentProvider`.
5. Guardar mediante evento y mediante `PersistenceProvider`.
6. Demostrar que el SDK no importa código .NET ni del ejemplo.
7. Probar raíz/subruta y rutas configurables de WASM/Workers.
8. Validar Shadow DOM, CSS variables, `::part`, modales, menús y accesibilidad.

### PoC B — Núcleo funcional

- abrir, navegar, buscar, ampliar, imprimir y descargar;
- añadir y reeditar texto, marcado, nota, dibujo, forma, imagen/sello y firma;
- guardar, cerrar, reabrir y reeditar;
- deshacer/rehacer con límites de memoria;
- medir apertura, mutación, guardado y memoria en perfiles S, M y L.

### PoC C — Riesgos de los motores

1. **Censura:** texto, imágenes, recursos compartidos y contenido cubierto, verificados con herramienta independiente.
2. **Marcadores:** leer, crear, renombrar, cambiar destino, jerarquizar, reordenar y persistir.
3. **Enlaces:** URL e internos, existentes y nuevos.
4. **Adjuntos:** listar, extraer, añadir, eliminar y reemplazar, comprobando hashes.
5. **Formularios:** rellenar AcroForm y conservar apariencias; XFA queda fuera salvo decisión expresa.
6. **Mutaciones cruzadas:** anotar, reordenar, volver a editar y guardar sin pérdidas.
7. **Firmas digitales:** detectar, advertir y comprobar el resultado.
8. **Interoperabilidad:** Acrobat Reader y otro visor independiente.

### PoC D — LiteParse

Ejecutar las 15 pruebas P2-POC de los requisitos sobre el corpus real, registrando configuración, versiones, hashes, Markdown/JSON, OCR por página, errores, tiempo, CPU y memoria. El servicio y un provider local deberán poder intercambiarse sin modificar Core ni el Web Component.

## 9. Fases de entrega

### Etapa 0 — Fundaciones y PoC

- monorepo, build y contratos;
- Web Component integrado en vanilla y ASP.NET;
- adaptadores de motores;
- corpus y harness de interoperabilidad;
- PoC A–D y licencias;
- decisión `go`, `go con cambios` o `no-go`.

### Etapa 1 — SDK básico

- visor, navegación y anotaciones;
- objetos añadidos, propiedades e historial;
- carga directa/provider;
- guardado por evento/provider, descarga e impresión;
- temas, español, accesibilidad y documentación;
- ejemplos vanilla y ASP.NET.

### Etapa 2 — Gestión PDF avanzada

- páginas, merge/split, marca de agua y numeración;
- enlaces, bookmarks y adjuntos si superan la PoC;
- AcroForm;
- censura reforzada;
- detección de firmas y límites operativos.

### Etapa 3 — Extracción

- `ExtractionProvider` y panel opcional;
- LiteParse sin OCR para texto nativo;
- Markdown, JSON, preview y descarga;
- OCR selectivo e intercambiable;
- imágenes, trazabilidad y OpenAPI;
- provider WASM evaluable.

## 10. Puertas de aceptación

| Puerta | Condición mínima |
|---|---|
| G0 — Desacoplamiento | El mismo paquete funciona en vanilla y ASP.NET; el SDK no contiene el ejemplo ni ensamblados .NET. |
| G1 — API pública | Carga, guardado, errores y extracción usan contratos versionados y probados. |
| G2 — Integridad | Abrir-modificar-guardar-reabrir conserva el corpus y funciona en lectores externos. |
| G3 — Seguridad | No hay red implícita; la censura supera verificación independiente. |
| G4 — Rendimiento | Perfiles S/M/L medidos, límites configurables y fallos controlados. |
| G5 — Extracción | LiteParse conserva texto/cifras y el OCR castellano cumple el corpus. |
| G6 — Distribución | ESM, tipos, bundle, Workers/WASM, subrutas, CSP, SBOM y licencias verificados. |

## 11. Riesgos prioritarios

| Prioridad | Riesgo | Mitigación |
|---|---|---|
| Crítica | Acoplar el SDK al primer host ASP.NET | Tests de arquitectura y PoC obligatoria en vanilla. |
| Crítica | Pérdida entre EmbedPDF y motor estructural | Estado canónico, adaptadores y pruebas cruzadas. |
| Crítica | Censura recuperable | Verificación independiente y contrato sobre históricos. |
| Alta | Bookmarks, enlaces o adjuntos requieren bajo nivel frágil | Spike temprano y motor sustituible. |
| Alta | Shadow DOM, portales o WASM dificultan integración | PoC multihost, CSS Parts y assets configurables. |
| Alta | Documentos grandes agotan memoria | Límites y medición S/M/L. |
| Alta | Edición invalida firmas | Detección, advertencia y política del host. |
| Alta | OCR consume recursos innecesarios | Análisis por página, cuotas y cancelación. |
| Media | Cambios en dependencias jóvenes | Versiones fijadas, SBOM, adaptadores y regresión. |

## 12. Estrategia de pruebas

- **Arquitectura:** Core no importa UI, motor concreto, red ni ejemplos.
- **Contratos:** suite que todo provider debe superar.
- **Hosts:** misma suite Playwright en vanilla, ASP.NET y un tercer host.
- **Semántica PDF:** páginas, anotaciones, formularios, enlaces, outline, adjuntos, texto y hashes.
- **Golden files:** comparar propiedades semánticas, no bytes completos.
- **Visual:** render antes/después con tolerancias controladas.
- **Interoperabilidad:** Acrobat Reader y otro visor.
- **Seguridad:** PDFs malformados, adjuntos, URLs, límites, CSP, Workers, logs y ausencia de red inesperada.
- **Accesibilidad:** teclado, foco, lector de pantalla, contraste y zoom.
- **Rendimiento:** perfiles S/M/L sobre hardware corporativo.

## 13. Decisiones pendientes

1. Nombre, licencia y publicación del SDK.
2. Navegadores, táctil y nivel WCAG.
3. Estrategia Shadow DOM; se recomienda abierto con CSS variables y `::part`.
4. Límites predeterminados y PDFs cifrados.
5. Exclusión explícita de XFA, portfolios y JavaScript embebido.
6. Política para PDFs firmados.
7. Capacidades base frente a módulos opcionales.
8. Si LiteParse se distribuye o solo se publica contrato e implementación de referencia.
9. Objetivos cuantitativos tras medir la PoC.

## 14. Evidencia tecnológica y cautelas

- EmbedPDF documenta anotaciones, guardado como copia y censura destructiva; deben verificarse con el corpus real.
- `pdf-lib` documenta adjuntos y operaciones sobre páginas. Outlines, enlaces y gestión completa de adjuntos siguen siendo hipótesis de PoC.
- LiteParse documenta Markdown/JSON, detección de OCR, imágenes, bindings nativos/WASM y OCR sustituible; la calidad varía con la complejidad.

Referencias oficiales:

- [EmbedPDF — Annotation Plugin](https://www.embedpdf.com/docs/react/headless/plugins/plugin-annotation)
- [EmbedPDF — Redaction Plugin](https://www.embedpdf.com/docs/react/headless/plugins/plugin-redaction)
- [pdf-lib — PDFDocument API](https://pdf-lib.js.org/docs/api/classes/pdfdocument)
- [LiteParse — documentación](https://github.com/run-llama/liteparse)
- [LiteParse — OCR API](https://github.com/run-llama/liteparse/blob/main/OCR_API_SPEC.md)

## 15. Conclusión

El resultado será una **librería/SDK web reutilizable**, no una funcionalidad interna de ASP.NET. El Web Component será la integración universal; Core contendrá la lógica independiente; los motores quedarán encapsulados; y carga, persistencia, versionado, auditoría y extracción se conectarán mediante contratos.

ASP.NET seguirá cumpliendo las responsabilidades empresariales indicadas en los requisitos, pero desde fuera del SDK. La arquitectura solo se aprobará si el mismo artefacto compilado funciona sin cambios en vanilla y ASP.NET, conserva los PDFs con interoperabilidad externa y permite sustituir motores sin romper la API pública.
