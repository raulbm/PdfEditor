# Créditos y licencias

## Código propio

Enterprise PDF Editor SDK — Copyright (c) 2026 Enterprise PDF Editor contributors — MIT. Todos los paquetes propios (`@enterprise-pdf-editor/*`) y el ejemplo Vanilla declaran MIT en sus manifiestos.

## Inventario completo bloqueado

El archivo [`license-inventory.json`](license-inventory.json) se genera con `npm run licenses:check` a partir de `package-lock.json` y de los manifiestos instalados. La revisión actual cubre 157 paquetes y no deja licencias desconocidas:

- MIT: 142
- OFL-1.1: 7
- Apache-2.0: 3
- BSD-2-Clause: 1
- BSD-3-Clause: 1
- 0BSD: 1
- ISC: 1
- MIT AND Zlib: 1

## Dependencias relevantes

| Dependencia | Uso | Licencia |
|---|---|---|
| EmbedPDF (`@embedpdf/*`) | Visor, plugins y PDFium | MIT |
| EmbedPDF fonts (`@embedpdf/fonts-*`) | Fuentes incluidas | OFL-1.1 |
| pdf-lib | Edición estructural PDF | MIT |
| LiteParse (`@llamaindex/liteparse`) | Extracción/OCR local | Dependencia CLI externa; revisar su licencia al instalar |
| TypeScript | Compilación y tipos | Apache-2.0 |
| Vite | Bundling navegador | MIT |

Las licencias y avisos de terceros deben conservarse al redistribuir los bundles. `LiteParse` no está en `package-lock.json`: se usa como herramienta global opcional (`lit`), por lo que su versión y licencia deben fijarse en el entorno de CI o en un inventario de release.
