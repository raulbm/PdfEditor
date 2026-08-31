# Contrato público v0

El contrato inicial está implementado en `packages/core/src/contracts.ts`.

## Reglas de compatibilidad

- Los identificadores, versiones y ETags son opacos para el SDK.
- El SDK nunca solicita una URL de negocio ni obtiene credenciales.
- Los errores se comunican mediante códigos estables, no por análisis de mensajes.
- Un host puede proporcionar el documento directamente o implementar `DocumentProvider`.
- Un `PersistenceProvider` es opcional: sin él se emite `pdf-save-requested`.

## Criterio de aceptación de esta base

El mismo Web Component debe poder recibir un PDF y emitir una petición de guardado desde HTML puro y desde el ejemplo ASP.NET, sin importar código específico de esos hosts.

## Verificación local de extracción

La PoC estructural deja `tmp-structural-poc.pdf`. Si está disponible el CLI global `lit` de LiteParse, se puede comprobar extracción espacial local con:

```bash
npm run test:structural
npm run test:liteparse
```

El script valida que LiteParse devuelve páginas y `textItems` con coordenadas, sin depender de un servidor cloud. Para probar OCR se puede ejecutar `lit parse tmp-structural-poc.pdf --format json -o tmp-liteparse-ocr.json` (sin `--no-ocr`).

### Firma digital

El SDK define DigitalSignatureProvider para delegar la firma criptográfica al host. Las claves privadas, certificados, HSM y servicios remotos quedan fuera del SDK; el proveedor recibe un Blob y devuelve el PDF firmado.
