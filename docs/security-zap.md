# Revisión de seguridad con OWASP ZAP

## Compatibilidad

El proyecto es compatible con ZAP porque los ejemplos se sirven por HTTP y el SDK se ejecuta en navegador. ZAP puede actuar como proxy, descubrir recursos JavaScript y ejecutar escaneos pasivos/activos sobre el host. El ejemplo ASP.NET actual solo sirve archivos estáticos y no expone endpoints de negocio.

La cobertura del escáner será distinta según el objetivo:

- Vanilla: `http://127.0.0.1:5173/`.
- ASP.NET: la URL configurada por Kestrel, normalmente `http://127.0.0.1:5111/`.
- API de extracción: debe escanearse por separado proporcionando su OpenAPI/GraphQL; `extraction-client` solo contiene un cliente HTTP.

## Ejecución recomendada con Docker Desktop (PowerShell)

Iniciar primero el host y después ejecutar un baseline pasivo:

```powershell
docker run --rm -t -v "${PWD}:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable `
  zap-baseline.py -t http://host.docker.internal:5173/ `
  -r zap-baseline.html -J zap-baseline.json
```

Para ASP.NET sustituir el destino por `http://host.docker.internal:5111/`. El baseline realiza spider y análisis pasivo; no ejecuta ataques activos. Para una evaluación autorizada más profunda:

```powershell
docker run --rm -t -v "${PWD}:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable `
  zap-full-scan.py -t http://host.docker.internal:5173/ `
  -r zap-full.html -J zap-full.json
```

El escaneo completo sí incluye análisis activo y debe ejecutarse solo contra entornos propios o expresamente autorizados.

## Qué debe probarse manualmente/automatizado

ZAP descubre principalmente navegación y tráfico HTTP. Para cubrir las operaciones PDF hay que conducir el navegador a través de ZAP y pulsar los controles: cargar, anotar, censurar, adjuntar, enlazar, crear formularios, insertar imagen/firma y guardar. El tráfico resultante (peticiones de persistencia, extracción o firma) quedará disponible para el análisis pasivo.

Las operaciones que solo manipulan `Blob` en memoria no generan una petición HTTP y no pueden ser validadas por ZAP como flujo de servidor. Para ellas se necesitan pruebas unitarias/E2E y validación criptográfica del PDF.

## Hallazgos previsibles del host de demostración

El host ASP.NET de ejemplo no añade todavía cabeceras como CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy` o `Permissions-Policy`; ZAP probablemente las reportará como advertencias. Esto es deliberado en la PoC y debe resolverse en el host de producción, con una CSP compatible con los workers/WASM de EmbedPDF.

El servidor Vite es exclusivamente de desarrollo y no debe exponerse públicamente.

## Automatización CI

ZAP ofrece imágenes Docker y el Automation Framework basado en un fichero YAML. Se recomienda empezar con baseline en cada pull request y reservar full scan para entornos aislados. Los informes HTML/JSON deben archivarse como artefactos y las reglas de severidad deben configurarse para que el pipeline falle solo ante alertas acordadas.

## Fuentes

- [ZAP Docker User Guide](https://www.zaproxy.org/docs/docker/about/)
- [ZAP Baseline Scan](https://www.zaproxy.org/docs/docker/baseline-scan/)
- [ZAP Automation Framework](https://www.zaproxy.org/docs/automate/automation-framework/)
- [ZAP Passive Scanner](https://www.zaproxy.org/docs/desktop/addons/passive-scanner/)
