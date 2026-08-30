# Especificación de requisitos técnicos
## Editor PDF integrado en aplicación web ASP.NET

**Versión:** 1.1  
**Estado:** Requisitos para PoC y desarrollo  
**Arquitectura objetivo:** ASP.NET + editor PDF client-side  
**Tecnologías inicialmente propuestas:** EmbedPDF + pdf-lib + JavaScript/TypeScript  
**Fase 2:** OCR + extracción a Markdown mediante LiteParse

---

# 1. Objetivo

Integrar en la aplicación web ASP.NET existente un editor PDF empresarial que permita visualizar, anotar, modificar, reorganizar y generar documentos PDF sin depender de servicios SaaS externos.

El procesamiento ordinario del PDF deberá realizarse preferentemente en el navegador del usuario.

El servidor ASP.NET será responsable de:

- autenticación;
- autorización;
- recuperación del documento;
- almacenamiento;
- versionado;
- concurrencia;
- auditoría;
- integración con los procesos de negocio.

El objetivo no es reproducir Adobe Acrobat Pro, sino proporcionar las funcionalidades PDF necesarias dentro de la propia aplicación empresarial.

---

# 2. Alcance expresamente excluido

Quedan fuera del alcance:

- edición del texto original existente en el PDF;
- creador visual de formularios PDF;
- PDF → Word;
- PDF → Excel;
- PDF → PowerPoint;
- conversión PDF/A certificada;
- reparación profunda de PDFs corruptos;
- firma electrónica avanzada/cualificada mediante certificado;
- traducción automática;
- funciones generativas de IA.

El OCR y la extracción a Markdown se contemplan como **Fase 2**.

---

# 3. Arquitectura propuesta

```text
┌─────────────────────────────────────────────┐
│                APLICACIÓN ASP.NET           │
│                                             │
│ Autenticación                               │
│ Autorización                                │
│ Expedientes / documentos                    │
│ Versionado                                  │
│ Auditoría                                   │
│ Concurrencia                                │
│ Persistencia                                │
└────────────────────┬────────────────────────┘
                     │
                     │ HTTPS / PDF
                     ▼
┌─────────────────────────────────────────────┐
│                 NAVEGADOR                   │
│                                             │
│ ┌─────────────────┐  ┌───────────────────┐ │
│ │    EmbedPDF     │  │     pdf-lib       │ │
│ │                 │  │                   │ │
│ │ Viewer          │  │ páginas           │ │
│ │ Anotaciones     │  │ merge / split     │ │
│ │ Texto nuevo     │  │ attachments       │ │
│ │ Imágenes        │  │ watermark         │ │
│ │ Comentarios     │  │ numeración        │ │
│ │ Formas          │  │ metadatos         │ │
│ │ Firma visual    │  │                   │ │
│ │ Redacción       │  │                   │ │
│ └─────────────────┘  └───────────────────┘ │
│                                             │
│ UI propia                                   │
│ Marcadores / enlaces / adjuntos             │
│ Panel propiedades                           │
└────────────────────┬────────────────────────┘
                     │
                  GUARDAR
                     ▼
              Aplicación ASP.NET
```

---

# 4. Clasificación técnica

Se utilizarán las siguientes categorías:

- **EP** — EmbedPDF nativo o basado directamente en su API.
- **PL** — pdf-lib.
- **UI** — Desarrollo propio JavaScript/TypeScript.
- **LL** — Manipulación PDF de bajo nivel o componente OSS complementario.
- **BE** — Backend ASP.NET.
- **LP** — LiteParse.
- **OCR** — Motor OCR asociado a LiteParse.
- **P2** — Fase 2.

---

# 5. Requisitos funcionales — Fase 1

## 5.1. Apertura y visualización

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-001 | Abrir PDF desde la aplicación | EP + BE | Obligatoria | Desde un registro de la aplicación, el usuario pulsa «Abrir PDF» y el documento aparece en el editor sin descarga manual previa. |
| PDF-002 | Visualización multipágina | EP | Obligatoria | Todas las páginas válidas del documento pueden visualizarse y recorrerse correctamente. |
| PDF-003 | Miniaturas | EP | Obligatoria | Se muestra panel con una miniatura por página y al pulsarla se navega a dicha página. |
| PDF-004 | Página anterior/siguiente | EP | Obligatoria | Los controles permiten recorrer todo el documento sin saltos incorrectos. |
| PDF-005 | Ir a página | EP | Obligatoria | Introduciendo un número válido se muestra la página solicitada. |
| PDF-006 | Zoom | EP | Obligatoria | El usuario puede aumentar y disminuir el nivel de zoom. |
| PDF-007 | Ajustar ancho/página | EP | Obligatoria | Existen modos de ajuste automático al ancho y a la página completa. |
| PDF-008 | Pantalla completa | UI/EP | Media | El área de edición puede utilizar el máximo espacio disponible del navegador. |
| PDF-009 | Buscar texto | EP | Obligatoria | Una búsqueda devuelve todas las coincidencias de texto disponibles y permite navegar entre ellas. |
| PDF-010 | Seleccionar/copiar texto | EP | Obligatoria | El texto nativo seleccionable puede copiarse al portapapeles. |
| PDF-011 | Imprimir | EP | Obligatoria | Puede iniciarse la impresión del documento completo desde el editor. |
| PDF-012 | Descargar | EP | Obligatoria | Se descarga la última versión del PDF resultante. |

---

## 5.2. Texto añadido

No se incluye modificación del texto original del PDF.

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-020 | Añadir texto | EP | Obligatoria | El usuario puede insertar una caja de texto en cualquier posición válida. |
| PDF-021 | Editar texto añadido | EP | Obligatoria | Después de insertar el texto puede volver a seleccionarlo y modificar su contenido. |
| PDF-022 | Mover texto | EP | Obligatoria | Una caja existente puede desplazarse mediante ratón/táctil. |
| PDF-023 | Redimensionar caja | EP | Obligatoria | Puede modificarse el tamaño del contenedor del texto. |
| PDF-024 | Tamaño de fuente | EP/UI | Obligatoria | Puede cambiarse el tamaño y el cambio persiste al guardar y reabrir. |
| PDF-025 | Color | EP/UI | Obligatoria | Puede modificarse el color del texto añadido. |
| PDF-026 | Fuente | EP/UI | Media | Puede seleccionarse una fuente de entre las soportadas y configuradas por la aplicación. |
| PDF-027 | Eliminar texto | EP | Obligatoria | El objeto seleccionado puede eliminarse. |

---

## 5.3. Marcado y dibujo

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-030 | Resaltar | EP | Obligatoria | El usuario selecciona texto y aplica resaltado que persiste al guardar. |
| PDF-031 | Subrayar | EP | Obligatoria | Puede añadirse y eliminarse un subrayado. |
| PDF-032 | Tachar | EP | Obligatoria | Puede tacharse texto seleccionado. |
| PDF-033 | Dibujo libre | EP | Obligatoria | Puede dibujarse sobre la página mediante ratón o dispositivo táctil. |
| PDF-034 | Modificar dibujo | EP/UI | Obligatoria | Puede seleccionarse posteriormente y modificar al menos color y grosor. |
| PDF-035 | Eliminar dibujo | EP | Obligatoria | Puede eliminarse un dibujo seleccionado. |

---

## 5.4. Formas

Debe permitirse como mínimo:

- línea;
- flecha;
- rectángulo;
- elipse/círculo.

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-040 | Insertar forma | EP | Obligatoria | Puede insertarse cada una de las formas definidas. |
| PDF-041 | Mover forma | EP | Obligatoria | Una forma existente puede desplazarse. |
| PDF-042 | Redimensionar | EP | Obligatoria | Una forma puede cambiar de tamaño. |
| PDF-043 | Color de borde | EP/UI | Obligatoria | Puede seleccionarse otro color de borde. |
| PDF-044 | Grosor | EP/UI | Obligatoria | Puede modificarse el grosor de línea. |
| PDF-045 | Relleno | EP/UI | Media | Las formas cerradas admiten color de relleno cuando el tipo lo permita. |
| PDF-046 | Opacidad | EP/UI | Media | Puede modificarse la opacidad cuando el motor lo permita. |
| PDF-047 | Eliminar | EP | Obligatoria | Puede eliminarse cualquier forma añadida. |

---

## 5.5. Notas y comentarios

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-050 | Añadir nota | EP | Obligatoria | El usuario puede insertar una nota asociada a una posición. |
| PDF-051 | Editar contenido | EP | Obligatoria | Una nota guardada puede reabrirse y modificarse. |
| PDF-052 | Mover nota | EP | Obligatoria | Puede cambiarse su posición. |
| PDF-053 | Eliminar nota | EP | Obligatoria | Puede eliminarse posteriormente. |
| PDF-054 | Panel de comentarios | EP/UI | Media | Puede visualizarse una lista de comentarios/notas y navegar desde ella a la página correspondiente. |

---

## 5.6. Imágenes

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-060 | Insertar imagen | EP | Obligatoria | Puede insertarse al menos PNG y JPEG desde un fichero local. |
| PDF-061 | Mover imagen | EP | Obligatoria | La imagen puede reposicionarse. |
| PDF-062 | Redimensionar | EP | Obligatoria | Puede redimensionarse manteniendo opcionalmente la proporción. |
| PDF-063 | Eliminar | EP | Obligatoria | Puede eliminarse una imagen añadida. |
| PDF-064 | Sustituir | UI/EP | Media | Una imagen añadida puede reemplazarse por otra manteniendo, cuando sea posible, posición y dimensiones. |

---

## 5.7. Sellos

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-070 | Insertar sello | EP | Obligatoria | Puede insertarse un sello en una página. |
| PDF-071 | Sellos corporativos | EP/UI | Obligatoria | La aplicación permite configurar sellos propios como REVISADO, APROBADO, PENDIENTE, etc. |
| PDF-072 | Mover/redimensionar | EP | Obligatoria | El sello puede moverse y cambiar de tamaño. |
| PDF-073 | Eliminar | EP | Obligatoria | Puede eliminarse el sello. |

---

## 5.8. Firma visual

No constituye firma electrónica avanzada ni cualificada.

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-080 | Dibujar firma | EP | Obligatoria | El usuario puede crear una firma manuscrita con ratón o dispositivo táctil. |
| PDF-081 | Insertar imagen de firma | EP | Obligatoria | Puede utilizarse una imagen como firma visual. |
| PDF-082 | Mover/redimensionar | EP | Obligatoria | La firma puede ajustarse antes de guardar. |
| PDF-083 | Eliminar | EP | Obligatoria | Puede eliminarse una firma visual añadida. |

---

## 5.9. Redacción o censura

La censura debe eliminar realmente la información cuando se aplique definitivamente. No será suficiente superponer un rectángulo negro.

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-090 | Marcar área para censura | EP | Obligatoria | Puede seleccionarse un rectángulo que se identifica como pendiente de censura. |
| PDF-091 | Marcar texto | EP | Obligatoria | Puede seleccionarse texto para censura cuando exista capa textual. |
| PDF-092 | Aplicar definitivamente | EP | Obligatoria | Tras aplicar y guardar, el contenido censurado no puede recuperarse mediante selección/copia del texto original. |
| PDF-093 | Confirmación | UI | Obligatoria | Antes de aplicar definitivamente se solicita confirmación al usuario. |

---

## 5.10. Hipervínculos

Deben contemplarse dos tipos:

1. URL externa.
2. enlace interno dentro del documento.

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-100 | Crear enlace URL | LL/UI | Obligatoria | El usuario selecciona un área y puede asociarle una URL HTTP/HTTPS válida. |
| PDF-101 | Abrir enlace URL | EP/Browser | Obligatoria | Al activar el enlace se abre la URL respetando las políticas de seguridad de la aplicación. |
| PDF-102 | Editar enlace | LL/UI | Obligatoria | Puede modificarse posteriormente URL, posición y dimensiones. |
| PDF-103 | Eliminar enlace | LL/UI | Obligatoria | Puede eliminarse un hipervínculo añadido. |
| PDF-104 | Crear enlace interno | LL/UI | Obligatoria | Puede vincularse un área con una página concreta del mismo PDF. |
| PDF-105 | Navegar por enlace interno | EP/LL | Obligatoria | Al activarlo se navega al destino correspondiente. |

---

## 5.11. Marcadores / Bookmarks / Outline

Se entiende por marcador la estructura navegable del PDF, no una simple anotación.

```text
Informe
 ├── Introducción
 ├── Resultados
 │    ├── Área A
 │    └── Área B
 └── Conclusiones
```

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-110 | Mostrar marcadores | LL/UI | Obligatoria | Al abrir un PDF con bookmarks se muestra su árbol completo. |
| PDF-111 | Crear marcador | LL/UI | Obligatoria | Puede crearse un marcador con título y destino. |
| PDF-112 | Renombrar | LL/UI | Obligatoria | Puede modificarse el título. |
| PDF-113 | Eliminar | LL/UI | Obligatoria | Puede eliminarse un marcador sin afectar al documento. |
| PDF-114 | Cambiar destino | LL/UI | Obligatoria | Puede asociarse a otra página/posición. |
| PDF-115 | Jerarquía | LL/UI | Obligatoria | Puede crearse estructura padre/hijo. |
| PDF-116 | Reordenar | LL/UI | Media | Los marcadores pueden reorganizarse mediante drag & drop o controles equivalentes. |
| PDF-117 | Persistencia | LL | Obligatoria | Después de guardar y reabrir con otro visor PDF compatible se conserva el árbol. |

**Requisito de PoC obligatorio:** validar escritura y modificación fiable del Outline PDF antes de aprobar definitivamente la arquitectura.

---

## 5.12. Ficheros adjuntos al PDF

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-120 | Adjuntar fichero | PL | Obligatoria | Puede incorporarse un fichero binario al PDF. |
| PDF-121 | Tipos arbitrarios | PL | Obligatoria | Se admiten al menos PDF, DOCX, XLSX, CSV, TXT, JPG y PNG. |
| PDF-122 | Nombre | PL | Obligatoria | El nombre original o uno definido por el usuario queda almacenado. |
| PDF-123 | Descripción | PL | Media | Puede añadirse descripción al adjunto. |
| PDF-124 | Listar adjuntos | LL/UI | Obligatoria | El editor muestra los adjuntos existentes. |
| PDF-125 | Descargar adjunto | LL/UI | Obligatoria | Puede extraerse el fichero manteniendo integridad binaria. |
| PDF-126 | Eliminar adjunto | LL/UI | Obligatoria | Puede eliminarse un adjunto. |
| PDF-127 | Reemplazar | LL/UI | Media | Puede sustituirse conservando o modificando nombre y metadatos. |
| PDF-128 | Persistencia externa | PL/LL | Obligatoria | Los adjuntos continúan accesibles al abrir el PDF generado con otro lector compatible. |

---

## 5.13. Gestión de páginas

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-130 | Rotar página | PL/EP | Obligatoria | Puede rotarse 90°, 180° o 270° y la rotación persiste. |
| PDF-131 | Eliminar página | PL | Obligatoria | Puede eliminarse cualquier página salvo que el documento vaya a quedar inválido. |
| PDF-132 | Insertar página vacía | PL | Obligatoria | Puede añadirse una página en una posición seleccionada. |
| PDF-133 | Insertar desde otro PDF | PL | Obligatoria | Puede seleccionarse otro PDF y copiar una o más páginas. |
| PDF-134 | Reordenar | PL/UI | Obligatoria | Puede modificarse el orden mediante drag & drop. |
| PDF-135 | Duplicar | PL | Media | Puede duplicarse una página. |
| PDF-136 | Extraer | PL | Obligatoria | Una selección de páginas puede guardarse como nuevo PDF. |
| PDF-137 | Unir PDFs | PL/UI | Obligatoria | Dos o más PDFs pueden convertirse en un único documento respetando el orden seleccionado. |
| PDF-138 | Dividir | PL/UI | Obligatoria | Puede crearse un nuevo PDF a partir de páginas/rangos seleccionados. |
| PDF-139 | Recortar | PL/UI | Media | El usuario define visualmente una región y se actualiza el área visible de la página. |

---

## 5.14. Marca de agua, numeración y encabezados

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-140 | Marca de agua de texto | PL/UI | Obligatoria | Puede aplicarse a todas o a páginas seleccionadas. |
| PDF-141 | Marca de agua imagen | PL/UI | Media | Puede insertarse imagen con posición y dimensiones configurables. |
| PDF-142 | Opacidad | PL/UI | Obligatoria | La marca admite nivel de opacidad configurable. |
| PDF-143 | Numerar páginas | PL/UI | Obligatoria | Puede añadirse numeración automática con formato configurable. |
| PDF-144 | Posición numeración | PL/UI | Obligatoria | Puede colocarse al menos izquierda, centro o derecha en cabecera/pie. |
| PDF-145 | Encabezado/pie | PL/UI | Media | Puede añadirse texto repetitivo a una selección o todas las páginas. |

---

## 5.15. Conversión básica de imágenes

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-150 | JPG/PNG → PDF | PL | Media | Una o varias imágenes generan un PDF válido. |
| PDF-151 | PDF → imagen | EP/PDFium | Media | Puede exportarse una página como PNG/JPEG con resolución configurable dentro de límites definidos. |

---

## 5.16. Formularios existentes

No se desarrollará un constructor de formularios.

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-160 | Mostrar formularios | EP | Media | Los campos existentes se muestran correctamente. |
| PDF-161 | Rellenar texto | EP | Media | Puede introducirse texto y conservarse al guardar. |
| PDF-162 | Checkbox | EP | Media | Puede activarse/desactivarse. |
| PDF-163 | Radio button | EP | Media | Funciona la exclusión correspondiente. |
| PDF-164 | Lista/Combo | EP | Media | Puede seleccionarse una opción válida. |
| PDF-165 | Persistencia | EP/PL | Obligatoria si se usan formularios | Los valores permanecen al guardar y reabrir. |

---

## 5.17. Edición transversal de objetos añadidos

Todo elemento añadido por el editor debe permanecer editable mientras su tipo PDF lo permita.

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-170 | Seleccionar objeto | EP/UI | Obligatoria | Un objeto añadido puede seleccionarse posteriormente. |
| PDF-171 | Mover | EP/UI | Obligatoria | Los objetos posicionables pueden desplazarse. |
| PDF-172 | Redimensionar | EP/UI | Obligatoria | Los objetos dimensionables pueden redimensionarse. |
| PDF-173 | Propiedades | EP/UI | Obligatoria | Se muestra un panel/contexto de propiedades aplicable al tipo seleccionado. |
| PDF-174 | Eliminar | EP/UI | Obligatoria | Puede eliminarse el elemento. |
| PDF-175 | Duplicar | UI | Media | Puede generarse una copia del elemento seleccionado. |
| PDF-176 | Copiar/pegar | UI | Media | Puede copiarse y pegarse dentro del documento cuando sea técnicamente viable. |
| PDF-177 | Deshacer | EP | Obligatoria | Ctrl+Z/botón revierte la última operación soportada. |
| PDF-178 | Rehacer | EP | Obligatoria | Puede recuperarse una operación deshecha. |

---

## 5.18. Guardado y versionado

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-180 | Guardar | BE | Obligatoria | La versión modificada sustituye o actualiza el documento según reglas de negocio. |
| PDF-181 | Guardar como | BE | Obligatoria | Puede crearse un nuevo documento sin modificar el original. |
| PDF-182 | Versionado | BE | Obligatoria | Cada guardado definido como versión genera un identificador de versión recuperable. |
| PDF-183 | Auditoría | BE | Obligatoria | Se registra usuario, fecha/hora, documento y tipo de operación de persistencia. |
| PDF-184 | Cambios pendientes | UI | Obligatoria | Si existen cambios sin guardar, se advierte antes de abandonar el editor. |
| PDF-185 | Error de guardado | BE/UI | Obligatoria | Un fallo de red/servidor no se presenta al usuario como guardado correcto. |
| PDF-186 | Reapertura | BE | Obligatoria | Tras guardar, cerrar y volver a abrir se conserva el resultado. |

---

## 5.19. Concurrencia

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| PDF-190 | Detectar edición concurrente | BE | Alta | La aplicación detecta que otro usuario ha modificado una versión posterior. |
| PDF-191 | Evitar sobrescritura silenciosa | BE | Alta | Una versión antigua no sobrescribe una nueva sin advertencia/estrategia explícita. |
| PDF-192 | Bloqueo opcional | BE | Media | Puede implementarse bloqueo pesimista cuando el proceso de negocio lo requiera. |

---

# 6. FASE 2 — OCR y extracción a Markdown mediante LiteParse

## 6.1. Objetivo

La Fase 2 incorporará capacidades de:

- detección de PDFs con texto nativo frente a PDFs escaneados;
- OCR;
- extracción de texto;
- reconstrucción de estructura documental;
- conversión a Markdown;
- extracción estructurada adicional en JSON cuando resulte útil.

**LiteParse se establece como candidato principal para la Fase 2.**

La arquitectura se diseñará para que:

1. LiteParse procese directamente los PDFs con texto nativo siempre que sea posible.
2. El OCR se aplique únicamente a páginas que lo requieran.
3. El resultado pueda obtenerse en Markdown y, opcionalmente, JSON estructurado.
4. No se dependa obligatoriamente de servicios SaaS externos.
5. El componente OCR sea reemplazable o configurable.

---

# 7. Arquitectura Fase 2

## 7.1. Arquitectura lógica

```text
                       PDF
                        │
                        ▼
                    LiteParse
                        │
              análisis de complejidad
                        │
           ┌────────────┴────────────┐
           │                         │
    texto PDF aprovechable      OCR necesario
           │                         │
           │                    motor OCR
           │                         │
           └────────────┬────────────┘
                        │
                  reconstrucción
                    documental
                        │
              ┌─────────┴─────────┐
              │                   │
           Markdown             JSON
              │                   │
              └─────────┬─────────┘
                        │
                        ▼
                Aplicación ASP.NET
```

---

## 7.2. Alternativas de despliegue

### Opción A — LiteParse en backend

Arquitectura preferente para la primera PoC:

```text
Navegador
   │
   ▼
ASP.NET
   │
   ▼
LiteParse
   │
   ├── parsing
   ├── OCR
   ├── Markdown
   └── JSON
   │
   ▼
ASP.NET
   │
   ▼
Usuario
```

Ventajas:

- procesamiento uniforme;
- menor dependencia del hardware del usuario;
- mejor control de memoria;
- más adecuado para documentos grandes;
- posibilidad de utilizar motores OCR más potentes;
- monitorización y logging centralizados;
- simplifica WebWorkers/WASM en el navegador.

### Opción B — LiteParse WASM client-side

Se evaluará como alternativa cuando la confidencialidad requiera que el documento no abandone el navegador.

Debe probarse especialmente:

- compatibilidad del binding WASM;
- memoria;
- tiempo de procesamiento;
- OCR;
- documentos de gran tamaño;
- experiencia en equipos corporativos de gama media.

No se considerará requisito obligatorio que toda la Fase 2 sea client-side si ello perjudica de forma significativa rendimiento, estabilidad o mantenibilidad.

---

# 8. Requisitos OCR

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| OCR-001 | Detectar necesidad de OCR | LP | Obligatoria | El sistema determina por página si existe texto útil o debe ejecutarse OCR. |
| OCR-002 | Evitar OCR innecesario | LP | Obligatoria | Una página con texto nativo válido no se OCRiza salvo petición expresa. |
| OCR-003 | OCR página individual | LP + OCR | Obligatoria | Puede procesarse únicamente una página seleccionada. |
| OCR-004 | OCR documento completo | LP + OCR | Obligatoria | Puede procesarse un documento multipágina. |
| OCR-005 | OCR selectivo | LP + OCR | Obligatoria | En un PDF mixto solo se aplica OCR a las páginas que lo necesitan. |
| OCR-006 | Español | OCR | Obligatoria | Se dispone de modelo OCR adecuado para castellano. |
| OCR-007 | Inglés | OCR | Media | Puede configurarse reconocimiento en inglés. |
| OCR-008 | Múltiples idiomas | OCR | Media | Puede configurarse una combinación de idiomas soportados. |
| OCR-009 | Mostrar progreso | UI/BE | Obligatoria | El usuario conoce el progreso aproximado y la página que está procesándose. |
| OCR-010 | Cancelar | UI/BE | Obligatoria | Puede cancelarse un trabajo de OCR prolongado sin dejar la aplicación bloqueada. |
| OCR-011 | Errores por página | LP/BE | Obligatoria | Un fallo en una página concreta se registra y no obliga necesariamente a perder todo el procesamiento. |
| OCR-012 | Procesamiento local/controlado | LP/OCR | Obligatoria | Ningún contenido se remite a un proveedor SaaS no aprobado. |
| OCR-013 | Motor OCR sustituible | LP | Alta | La arquitectura permite cambiar Tesseract u otro motor OCR sin reescribir el pipeline Markdown completo. |
| OCR-014 | PDF buscable | LP/OCR/PL | Deseable | Como extensión posterior, puede generarse una capa textual sobre páginas escaneadas. |

---

# 9. Requisitos de extracción a Markdown

## 9.1. Principios

LiteParse será responsable preferentemente de:

- extracción del texto;
- reconstrucción de párrafos;
- detección de encabezados;
- listas;
- tablas;
- imágenes;
- enlaces;
- metadatos estructurales;
- generación de Markdown.

El desarrollo propio deberá limitarse a:

- normalización adicional;
- reglas empresariales;
- validaciones;
- fallback;
- postprocesado;
- exportación;
- UI.

---

## 9.2. Matriz de requisitos Markdown

| ID | Requisito | Tecnología | Prioridad | Criterio de aceptación |
|---|---|---|---|---|
| MD-001 | Extraer texto nativo | LP | Obligatoria | Un PDF con texto devuelve contenido textual sin necesidad de OCR. |
| MD-002 | Mantener orden lógico | LP | Obligatoria | En documentos de una columna el orden de lectura coincide con el documento original. |
| MD-003 | Integrar OCR | LP + OCR | Obligatoria | Las páginas escaneadas se incorporan al resultado Markdown mediante OCR. |
| MD-004 | PDF mixto | LP + OCR | Obligatoria | Un documento con páginas nativas y escaneadas genera una salida única y ordenada. |
| MD-005 | Detectar párrafos | LP | Obligatoria | Los saltos de línea puramente visuales no se convierten automáticamente en párrafos separados. |
| MD-006 | Encabezados | LP | Alta | Los títulos y subtítulos reconocibles se convierten a niveles Markdown apropiados. |
| MD-007 | Listas con viñetas | LP | Alta | Las listas convencionales generan sintaxis Markdown de lista. |
| MD-008 | Listas numeradas | LP | Alta | La numeración original se preserva razonablemente. |
| MD-009 | Negrita | LP | Media | El texto identificado como negrita se representa con Markdown cuando exista información suficiente. |
| MD-010 | Cursiva | LP | Media | El estilo cursivo se conserva cuando pueda determinarse de forma fiable. |
| MD-011 | Hipervínculos | LP | Alta | Los enlaces con texto asociado generan `[texto](URL)`. |
| MD-012 | URLs sin texto | LP | Media | Las URLs explícitas permanecen disponibles en la salida. |
| MD-013 | Tablas simples | LP | Alta | Una tabla sencilla se convierte en una tabla Markdown estructurada. |
| MD-014 | Cabeceras de tabla | LP | Alta | Cuando son identificables se preservan como cabeceras Markdown. |
| MD-015 | Tablas complejas | LP + fallback | Obligatoria | Cuando la estructura no puede reconstruirse con suficiente confianza, no se inventan columnas o datos. |
| MD-016 | Documentos multicolumna | LP | Alta | El orden de lectura se reconstruye correctamente en el conjunto de documentos de prueba definidos. |
| MD-017 | Imágenes | LP | Media | Las imágenes pueden representarse mediante referencia o placeholder. |
| MD-018 | Extraer imágenes | LP | Media | Cuando se habilite, las imágenes se exportan a una ubicación controlada. |
| MD-019 | Referencias relativas | LP/UI | Media | El Markdown puede enlazar imágenes mediante rutas relativas. |
| MD-020 | Saltos de página | LP/UI | Media | Puede configurarse conservar o eliminar el concepto de salto de página. |
| MD-021 | Número de página en metadatos | LP | Alta | Es posible conservar la relación entre contenido extraído y página de origen. |
| MD-022 | Markdown UTF-8 | LP | Obligatoria | Se preservan correctamente caracteres españoles, símbolos y Unicode habitual. |
| MD-023 | Vista previa | UI | Obligatoria | El usuario puede revisar el Markdown antes de descargarlo. |
| MD-024 | Copiar al portapapeles | UI | Obligatoria | El Markdown completo puede copiarse. |
| MD-025 | Descargar `.md` | UI/BE | Obligatoria | Puede generarse un fichero Markdown UTF-8. |
| MD-026 | Guardar resultado | BE | Media | Puede persistirse el Markdown asociado al documento original. |
| MD-027 | Regenerar | BE/LP | Media | El resultado puede regenerarse con una nueva versión/configuración del parser. |
| MD-028 | API interna | BE | Media | Otros procesos empresariales pueden solicitar el Markdown de un PDF. |
| MD-029 | Resultado JSON | LP | Alta | Puede conservarse opcionalmente la representación estructurada JSON. |
| MD-030 | Relación Markdown/JSON | LP/BE | Media | Ambos resultados pueden asociarse a la misma versión del documento fuente. |

---

# 10. Regla fundamental de conversión

La Fase 2 deberá aplicar el principio:

> **Es preferible perder formato que inventar estructura o contenido.**

Por tanto:

- si no puede determinarse con suficiente fiabilidad que una línea es un título, se mantendrá como texto;
- si una tabla no puede reconstruirse correctamente, se conservará texto bruto o se marcará como estructura no resuelta;
- no se modificarán cifras para corregir aparentes errores;
- no se generarán columnas inexistentes;
- no se completarán palabras o frases ausentes mediante inferencia generativa;
- no se utilizará un LLM como mecanismo obligatorio de reconstrucción;
- la salida deberá ser trazable hasta el contenido fuente siempre que sea posible.

---

# 11. Extracción de imágenes

Cuando se habilite la extracción de imágenes, el formato preferente será:

```text
documento/
├── documento.md
├── documento.json
└── images/
    ├── image-001.png
    ├── image-002.jpg
    └── image-003.png
```

El Markdown deberá utilizar referencias relativas:

```markdown
![Imagen](images/image-001.png)
```

Se evitará Base64 embebido por defecto salvo requisito específico.

---

# 12. JSON estructurado

Aunque Markdown sea el resultado principal de usuario, se recomienda conservar la capacidad de obtener JSON estructurado.

Casos de uso futuros:

- indexación;
- búsqueda empresarial;
- RAG;
- clasificación documental;
- análisis de tablas;
- referencias exactas a páginas;
- extracción de citas;
- procesamiento automatizado;
- trazabilidad del contenido extraído.

El JSON no deberá considerarse necesariamente un formato estable de integración externa hasta congelar un esquema propio de la aplicación.

---

# 13. PoC específica de LiteParse

La aprobación de LiteParse requerirá una PoC sobre un corpus real.

## 13.1. Corpus mínimo

Se seleccionarán al menos:

1. PDF textual sencillo.
2. PDF textual de 50+ páginas.
3. PDF con tablas.
4. PDF con tablas complejas.
5. PDF multicolumna.
6. PDF escaneado limpio.
7. PDF escaneado de calidad media.
8. PDF mixto: páginas nativas + escaneadas.
9. PDF con imágenes.
10. PDF con hipervínculos.
11. PDF con caracteres españoles y símbolos.
12. Documento representativo de uso real de la organización.

---

## 13.2. Pruebas PoC

### P2-POC-01 — Texto nativo
El PDF textual debe convertirse sin OCR y sin pérdida material de contenido.

### P2-POC-02 — Orden de lectura
Párrafos y secciones deben aparecer en el orden lógico correcto.

### P2-POC-03 — Títulos
Los encabezados principales y secundarios deben identificarse razonablemente.

### P2-POC-04 — Listas
Las listas numeradas y con viñetas deben conservar su estructura.

### P2-POC-05 — Tablas simples
Las tablas sencillas deben transformarse a Markdown válido.

### P2-POC-06 — Tablas complejas
Cuando no sea posible una reconstrucción fiable, la salida no debe inventar celdas o relaciones.

### P2-POC-07 — OCR
Un PDF escaneado debe producir texto útil en castellano.

### P2-POC-08 — OCR selectivo
Un PDF mixto no debe OCRizar innecesariamente las páginas con texto válido.

### P2-POC-09 — Multicolumna
El orden de lectura debe ser correcto en documentos con dos o más columnas.

### P2-POC-10 — Enlaces
Los enlaces externos deben conservarse cuando sea posible.

### P2-POC-11 — Imágenes
Las imágenes deben poder extraerse o representarse mediante placeholder/referencia.

### P2-POC-12 — Markdown
El `.md` debe abrirse correctamente en un visor Markdown estándar.

### P2-POC-13 — JSON
Debe poder generarse salida JSON estructurada.

### P2-POC-14 — Rendimiento
Debe medirse tiempo, CPU y memoria para documentos pequeños, medios y grandes.

### P2-POC-15 — Estabilidad
Un fallo en un PDF concreto no debe comprometer el servicio completo.

---

# 14. Métricas para valorar LiteParse

La PoC deberá registrar como mínimo:

| Métrica | Objetivo |
|---|---|
| Texto omitido | mínimo posible |
| Texto inventado | 0 |
| Alteración de cifras | 0 |
| Orden de lectura | correcto en documentos objetivo |
| Encabezados | precisión suficiente para uso práctico |
| Listas | preservación razonable |
| Tablas simples | alta fidelidad |
| Tablas complejas | degradación segura |
| OCR castellano | calidad aceptable en corpus real |
| Tiempo por página | medir |
| Memoria máxima | medir |
| Fallos por documento | registrar |
| Markdown válido | sí |
| JSON disponible | sí |
| Enlaces preservados | cuando existan datos suficientes |

No se fijan porcentajes arbitrarios antes de medir el corpus real.

---

# 15. Requisitos no funcionales

## 15.1. Seguridad

**SEC-001.** El PDF no debe enviarse a servicios SaaS externos para operaciones estándar.

**SEC-002.** LiteParse y el OCR deberán ejecutarse en infraestructura controlada o local cuando se utilice backend.

**SEC-003.** No se utilizará una API OCR externa sin aprobación expresa.

**SEC-004.** Los endpoints ASP.NET deberán aplicar autorización sobre cada documento.

**SEC-005.** Los resultados Markdown y JSON tendrán los mismos controles de acceso que el PDF fuente.

**SEC-006.** La extracción de imágenes heredará las mismas restricciones de seguridad del documento original.

**SEC-007.** Los ficheros temporales generados durante OCR/parsing deberán eliminarse según política definida.

**SEC-008.** Los logs no deberán contener texto completo de documentos confidenciales salvo necesidad expresamente aprobada.

---

## 15.2. Integridad documental

**INT-001.** El procesamiento OCR/Markdown no modificará el PDF fuente salvo que el usuario solicite expresamente generar un PDF buscable.

**INT-002.** Markdown y JSON deberán asociarse a la versión exacta del PDF de origen.

**INT-003.** Si el PDF cambia, los derivados existentes deberán marcarse como potencialmente obsoletos.

---

## 15.3. Rendimiento

Se definirán tres perfiles:

### Caso S
- 5–10 páginas;
- PDF textual;
- < 5 MB.

### Caso M
- 50–100 páginas;
- imágenes + texto;
- aproximadamente 20–50 MB.

### Caso L
- 200+ páginas o documento escaneado pesado.

Para cada perfil se medirán:

- tiempo de análisis;
- tiempo de OCR;
- tiempo total Markdown;
- memoria máxima;
- CPU;
- tamaño de resultados;
- estabilidad.

---

# 16. Licencias

Antes de producción deberá generarse un inventario SBOM o equivalente que documente:

- paquete;
- versión exacta;
- licencia;
- URL del proyecto;
- dependencias relevantes.

Se priorizarán componentes MIT, Apache-2.0, BSD o equivalentes.

LiteParse deberá fijarse a una versión concreta y revisarse su árbol de dependencias antes de producción.

No se incorporará una dependencia AGPL/GPL que pueda afectar al modelo de distribución sin aprobación expresa previa.

---

# 17. Interfaz propuesta

## Fase 1

```text
Archivo
 ├── Guardar
 ├── Guardar como
 ├── Descargar
 └── Imprimir

Editar
 ├── Deshacer
 └── Rehacer

Anotar
 ├── Texto
 ├── Resaltar
 ├── Subrayar
 ├── Tachar
 ├── Nota
 ├── Dibujo
 ├── Línea
 ├── Flecha
 ├── Rectángulo
 ├── Elipse
 ├── Imagen
 ├── Sello
 └── Firma

Documento
 ├── Censurar
 ├── Hipervínculo
 ├── Marcadores
 ├── Adjuntos
 ├── Marca de agua
 └── Numerar páginas

Páginas
 ├── Insertar
 ├── Eliminar
 ├── Rotar
 ├── Duplicar
 ├── Extraer
 ├── Reordenar
 ├── Unir
 └── Dividir
```

## Fase 2

```text
Procesamiento
 ├── Analizar documento
 ├── Ejecutar OCR
 ├── Extraer Markdown
 ├── Ver Markdown
 ├── Descargar Markdown
 ├── Extraer JSON
 └── Extraer imágenes
```

---

# 18. Paneles laterales

El editor deberá contemplar:

1. Páginas
2. Marcadores
3. Comentarios
4. Adjuntos
5. Propiedades

Para Fase 2 se añadirá opcionalmente:

6. Extracción documental

Este panel podrá mostrar:

- estado del documento;
- texto nativo detectado;
- páginas que requieren OCR;
- progreso;
- advertencias;
- resultado Markdown;
- disponibilidad de JSON;
- imágenes extraídas.

---

# 19. Prueba de concepto general Fase 1

La PoC de Fase 1 deberá demostrar:

1. abrir un PDF desde ASP.NET;
2. añadir texto, modificarlo, moverlo y guardarlo;
3. añadir nota, imagen, forma y firma;
4. cerrar, reabrir y comprobar persistencia;
5. aplicar censura real;
6. eliminar, reordenar e insertar páginas;
7. unir dos PDFs;
8. crear hipervínculo externo;
9. crear enlace interno;
10. leer marcadores existentes;
11. crear, editar y eliminar marcadores jerárquicos;
12. adjuntar XLSX/PDF;
13. recuperar adjuntos desde un visor externo;
14. rellenar formulario existente;
15. procesar un documento grande representativo.

---

# 20. Criterio de éxito de Fase 1

La arquitectura:

```text
EmbedPDF
+
pdf-lib
+
JavaScript/TypeScript propio
+
ASP.NET
```

se aprobará para producción si:

1. no se identifica pérdida documental relevante;
2. todas las funciones obligatorias de PoC funcionan;
3. bookmarks, enlaces y attachments son interoperables con lectores externos;
4. la redacción elimina efectivamente el contenido;
5. el rendimiento es aceptable;
6. no aparece ninguna dependencia con licencia incompatible;
7. no resulta necesario un SDK comercial para los requisitos establecidos.

---

# 21. Criterio de éxito de Fase 2

LiteParse se aprobará como motor principal de extracción si:

1. procesa satisfactoriamente el corpus real;
2. preserva cifras y texto sin introducir contenido inventado;
3. reconstruye adecuadamente documentos simples y medianamente complejos;
4. degrada de manera segura ante tablas/layouts complejos;
5. permite OCR selectivo;
6. soporta castellano con calidad suficiente;
7. produce Markdown utilizable;
8. proporciona JSON cuando se solicite;
9. cumple los requisitos de seguridad;
10. su rendimiento resulta aceptable en la arquitectura escogida;
11. la licencia y dependencias son compatibles con el uso empresarial.

---

# 22. Fases de implantación

## Fase 1A — Núcleo

- visor;
- navegación;
- zoom;
- búsqueda;
- texto añadido;
- anotaciones;
- dibujos;
- formas;
- imágenes;
- notas;
- sellos;
- firma visual;
- guardar;
- descargar;
- imprimir.

## Fase 1B — Gestión documental PDF

- páginas;
- merge/split;
- bookmarks;
- enlaces;
- adjuntos;
- marcas de agua;
- numeración;
- formularios existentes;
- redacción;
- versionado;
- concurrencia;
- auditoría.

## Fase 2A — LiteParse base

- análisis PDF;
- extracción de texto;
- Markdown;
- JSON;
- encabezados;
- listas;
- enlaces;
- tablas;
- imágenes.

## Fase 2B — OCR

- detección automática;
- OCR selectivo;
- castellano;
- inglés;
- progreso;
- cancelación;
- backend controlado;
- evaluación de WASM client-side.

## Fase 2C — Integración documental

- preview Markdown;
- descarga `.md`;
- almacenamiento;
- API interna;
- relación con versiones;
- extracción de imágenes;
- JSON estructurado;
- eventual PDF buscable.

---

# 23. Criterio de terminado

Una funcionalidad que modifique un PDF no se considerará terminada únicamente porque funcione visualmente.

Debe superarse:

```text
ABRIR
  ↓
MODIFICAR
  ↓
GUARDAR
  ↓
CERRAR
  ↓
REABRIR
  ↓
VERIFICAR
  ↓
ABRIR EN VISOR EXTERNO
  ↓
VERIFICAR
```

Cuando el objeto deba permanecer editable:

```text
REABRIR
  ↓
SELECCIONAR OBJETO
  ↓
MODIFICAR
  ↓
VOLVER A GUARDAR
```

Para Fase 2:

```text
PDF ORIGINAL
  ↓
ANALIZAR
  ↓
OCR SI PROCEDE
  ↓
GENERAR MARKDOWN/JSON
  ↓
COMPARAR CON ORIGINAL
  ↓
VALIDAR TEXTO
  ↓
VALIDAR ESTRUCTURA
  ↓
REGISTRAR LIMITACIONES
```

---

# 24. Decisión tecnológica provisional

## Fase 1

- **Editor/visor:** EmbedPDF / PDFium WASM.
- **Manipulación estructural:** pdf-lib.
- **UI específica:** JavaScript/TypeScript.
- **Backend:** aplicación ASP.NET existente.

## Fase 2

- **Parser principal:** LiteParse.
- **Salida principal:** Markdown.
- **Salida complementaria:** JSON estructurado.
- **OCR:** motor configurable asociado a LiteParse.
- **Despliegue preferente inicial:** backend controlado.
- **Alternativa:** LiteParse WASM client-side.
- **PDF.js/PDFium:** herramientas auxiliares cuando aporten información no cubierta por LiteParse.
- **Tesseract/Tesseract.js:** motor OCR posible, no arquitectura obligatoria.
- **Otros OCR:** evaluables sin modificar el pipeline principal.

La selección definitiva queda condicionada a la PoC técnica sobre documentos reales.
