# Bitácora: qué se hizo, en orden, y qué se aprendió

Sin secretos ni valores de configuración. Las fechas exactas solo se conocen donde se indican; el resto está en orden cronológico aproximado (reconstruido de la conversación y del historial de git: `git log` es la fuente exacta). Los problemas resueltos están aquí para no repetirlos.

## Fase 0: decisiones y núcleo
- Producto: marketplace de autos del Perú, la empresa es intermediaria; depósito configurable (S/ 10) para agendar visita con un asesor, reembolsable si asiste. Nombre elegido: **Kuntur Autos**. Repositorio público `RodrigoR4mirez/kuntur-autos`.
- Decisiones técnicas (2026-11-08): Next.js (web), Fastify (API), PostgreSQL + Drizzle, Better Auth, Zod, Vitest. Arquitectura limpia con núcleo puro (`packages/core`) y regla de dependencias verificada por `pnpm boundaries`.
- Núcleo: catálogo, anuncios, vitrina por nivel de acceso, cuentas/sesión, citas, pagos, búsqueda e historial por placa (puertos e implementaciones en memoria). Contratos con Zod.
- Marca: colores, tipografías, logotipo y la placa como motivo (`04-marca.md`, `design-tokens`).

## Base de datos y autenticación
- Neon (PostgreSQL) como base; migraciones y catálogo inicial (12 marcas, 70 modelos). Suites de contrato con PGlite.
- Better Auth: correo con verificación (cuando hay SMTP) y Google; sesiones por Bearer.
- **Problema:** `sslmode` en la URL de Neon → se fuerza `verify-full` (`withStrictSsl`).

## Integración y entrega continua (GitHub Actions)
- Flujos: `ci.yml`, `security.yml` (CodeQL, gitleaks, Trivy, auditoría y revisión de dependencias), `deploy-staging.yml`, `deploy-production.yml`, `infra-azure.yml`, `db-migrate.yml`. Acciones fijadas por SHA, Azure por OIDC sin secretos guardados.
- Verificadores propios: `pnpm boundaries`, `pnpm workflows`, `pnpm delivery`, compuerta de promoción.
- Limpieza previa pedida por el dueño: dependencias, configuración obsoleta y documentación ordenada.

## Azure (staging)
- Contenedores en **Azure Container Apps**, Brazil South, grupo `rg-kuntur-staging`; Bicep en `infra/azure/main.bicep`; identidad de GitHub con rol Contributor solo sobre su grupo (`infra/azure/setup.sh`).
- **Problemas resueltos:**
  - La credencial federada rechazaba el acceso (AADSTS700213): GitHub envía el *subject* con los IDs numéricos de dueño y repositorio; `setup.sh` ya lo calcula.
  - El flujo de infraestructura usaba la etiqueta móvil `:staging` y volvía a una imagen vieja: ahora, con `image` vacío, mantiene la imagen que corre.
  - La migración recibía `DATABASE_URL` vacía dentro de un flujo reutilizable: se reemplazó por la acción compuesta `deploy-app`, con el secreto del entorno.
  - Trivy marcó vulnerabilidades en npm/yarn/corepack y en el binario de esbuild: la imagen final los elimina.
  - Pruebas de integración lentas en GitHub (tiempo límite 30 s) y falsos positivos de gitleaks con contraseñas de prueba (lista de permitidos).
- Estado: despliegue automático a staging en verde en cada merge a `main`, con prueba de humo y reversión.

## Inicio de sesión con Google (verificado 2026-11-15)
- Proyecto y cliente OAuth creados por el dueño en Google Cloud; secretos guardados en el entorno `staging` de GitHub (nunca en el chat).
- Se probó con una página temporal `/login-test` (activa con `LOGIN_TEST_PAGE=true`); el ingreso funcionó, la sesión duró 7 días y el rol por defecto fue `buyer`. Detalle en `11-google-login.md`.

## La web (2026-11-15)
- `apps/web` (Next.js 16): landing, `/ingresar`, `/vender`, `/anuncios/[id]`; reenvío de `/api` y `/auth` a la API; la API acepta la cookie de sesión.
- Imagen propia `kuntur-autos-web`, acción `deploy-web`, app `kuntur-web-staging` creada por Infraestructura Azure. Pull request 2 fusionado; despliegue a staging y paquete público en GHCR hechos.
- **Problema:** la comprobación "Revisión de dependencias nuevas" falló porque el *Dependency graph* de GitHub estaba apagado; el dueño lo activó.
- **Error propio corregido:** la landing leía el id de las marcas como texto cuando es número; las marcas nunca habrían aparecido.
- **Error de proceso:** la primera versión de la landing se empujó directo a `main`; desde entonces, solo rama y pull request.
- Resultado: el dueño abrió la web desplegada y la calificó mal ("no funciona nada"); causa sin diagnosticar (ver `12-estado-y-siguientes-pasos.md`).

## Diagnóstico de la web y arranque en frío (2026-11-15)
- Revisada la web desplegada: estilos y fuentes bien; `/api/catalog/brands` dio 502 con la API dormida y 200 con la API despierta. Causa: escala a cero + espera de 15 s. Arreglo: 45 s, reintento de GET, mensaje claro.
- El dueño pidió que el agente haga pull, pull request, fusión y revisión de Actions (regla en `CLAUDE.md`).
- Rediseño de la landing con la marca (encabezado, hero con ficha de ejemplo, secciones, pie). Pruebas de contraste AA y de reglas de CSS en `apps/web/src/design.test.ts`. Aprendido: la ventana de Chrome del Mac no baja de cierto ancho; para capturas móviles reales se usa un marco de 390 px o Chrome sin ventana. `next dev` genera un `AGENTS.md` en `apps/web`: no se sube.
- Segunda versión del rediseño, fiel a una referencia visual del dueño (paneles, negro fuerte, barra lateral). Nuevos tokens: Negro Cóndor, hielo, panel, radius-xl. Módulos: listado público con filtros, mis anuncios y revisión por asesor (núcleo, PostgreSQL, API, web) con pruebas de contrato y HTTP. Aprendido: un botón `inline-flex` pierde el espacio inicial de un `span` interno (se envuelve el texto en un solo `span`); las capturas responsivas se hacen con un marco de ancho fijo.
- Ficha del auto tipo sala de exhibición a pedido del dueño (referencia: auto central con tarjetas y modo detalle) y datos de segunda mano. Aprendido: un nombre de clase genérico (`.tile`) chocó con otro ya existente en `home.css` y estiró las tarjetas; se usó el prefijo `show-`. Las copias duplicadas de iCloud (archivos "… 2.ts") rompen `pnpm boundaries` en local: no se suben, se mueven fuera para verificar.
- Entorno local: `pnpm` no estaba en el PATH; se usó `corepack pnpm` con un acceso directo temporal.

## Flujo completo en staging (2026-11-15)
- Ingreso con Google verificado en la web; rol `advisor` dado por el dueño en Neon (UPDATE sobre `"user"`, una fila). Flujo probado en el navegador: publicar → en revisión → aprobar en `/asesor` → aparece en `/autos` y su ficha real. Existe un anuncio de prueba ("Toyota Yaris 2019 de prueba", placa TST123) en la base de staging.
- **Error encontrado:** tras enviar a revisión, el formulario llevaba a `/anuncios/<id>` y daba 404 (aún no aprobado). Ahora lleva a `/mis-anuncios`.

## Configuración que vive fuera del repositorio (sin valores)
| Dónde | Qué | Quién |
|---|---|---|
| GitHub → entorno `staging` | Variables `AZURE_*`, `GOOGLE_CLIENT_ID`, `LOGIN_TEST_PAGE`, `AUTH_TRUSTED_ORIGINS` (opcional); secretos `DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_SECRET` | Dueño |
| GitHub → seguridad | Dependency graph activado | Dueño |
| GitHub → paquetes | `kuntur-autos-api` y `kuntur-autos-web` públicos | Dueño |
| Azure | Grupo, identidad `kuntur-github-staging` y credencial `github-staging` (creados con `setup.sh` en Cloud Shell) | Dueño |
| Neon | Proyecto y base de staging | Dueño |
| Google Cloud | Cliente OAuth web; **falta** registrar el URI de la web (ver `12`) | Dueño |

## No verificado todavía
`docker build` real de la web; Trivy sobre esa imagen en el despliegue; ingreso con Google a través de la web en Azure; reversión manual; producción (nunca ejecutada); alerta de presupuesto de Azure; envío real de correos.
