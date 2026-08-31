# Host ASP.NET de ejemplo

Este proyecto no forma parte de los workspaces npm. Su único propósito es demostrar que el artefacto ya compilado del SDK puede servirse como estático desde `wwwroot/sdk/` y utilizarse sin referencias .NET desde los paquetes del editor.

`npm run build` genera la distribución completa en `packages/web-component/dist/` y la copia a `wwwroot/sdk/`. Esto conserva los chunks, Web Workers y WASM que necesita EmbedPDF. El HTML de este ejemplo consume exactamente ese bundle. La siguiente etapa añadirá una implementación de `PersistenceProvider` basada en una API de ejemplo.
