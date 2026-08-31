# ADR-0001 — SDK framework-agnostic

## Decisión

El editor PDF será un SDK web independiente de ASP.NET y de cualquier framework de interfaz. La integración universal será el Web Component `<enterprise-pdf-editor>`.

`@enterprise-pdf-editor/core` no tendrá dependencias de red, almacenamiento, autenticación ni motores PDF concretos. La aplicación host inyectará carga, persistencia y extracción mediante contratos TypeScript.

## Consecuencias

- ASP.NET es un consumidor de ejemplo, nunca una dependencia del SDK.
- Los motores PDF se encapsulan en paquetes adaptadores reemplazables.
- Sin `PersistenceProvider`, el editor puede entregar un `Blob` para descarga o manejarlo el host mediante eventos.
- Versionado, autorización, auditoría y concurrencia permanecen en el host.
