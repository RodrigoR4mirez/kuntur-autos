# Integración y entrega continua (CI/CD)

Este documento es obligatorio para quien toque `.github/`, `apps/api/Dockerfile`, `infra/` o cualquier despliegue. Si cambias algo de eso, actualiza este documento en el mismo commit.

## Idea general

Ningún cambio llega a `main` ni a un servidor sin pasar por controles automáticos, y nada se despliega con secretos guardados.

```
 pull request ──► CI (tipos, formato, reglas, pruebas, imagen, Bicep) ──┐
              └─► Seguridad (CodeQL, dependencias, secretos, config)  ──┤  deben pasar para fusionar
                                                                        ▼
 merge a main ──► CI ─► Seguridad ─► construir imagen ─► escanear ─► firmar origen
                                                                        ▼
                                  migrar base ─► desplegar ─► prueba de humo ─► (si falla) volver atrás
```

> **Procedimiento paso a paso para cambiar, desplegar o revertir: `docs/10-runbook.md`.** Este documento describe cómo funciona cada flujo.

## Los flujos (`.github/workflows/`)

| Archivo | Cuándo corre | Qué hace |
|---|---|---|
| `ci.yml` | Cada pull request. En `main` lo llama el despliegue. | **validate**: tipos, formato, regla de dependencias, política de flujos, pruebas con cobertura contra PostgreSQL real. **image**: construye la imagen Docker y la escanea. **infra**: compila la plantilla Bicep. |
| `security.yml` | Cada pull request, antes de cada despliegue y cada lunes. | **codeql**: análisis estático de TypeScript. **dependency-review**: bloquea dependencias nuevas con vulnerabilidad alta (solo en PR). **audit**: `pnpm audit` de producción. **secrets**: gitleaks sobre todo el historial. **config-scan**: Trivy sobre archivos, Dockerfile y compose. |
| `deploy-staging.yml` | Cada push a `main` y a mano. | Su job `deploy` usa el entorno `staging` y la acción `.github/actions/deploy-app` (migra, actualiza, prueba `/health` y `/catalog/brands`, revierte si falla). | CI → seguridad → publica la imagen en GHCR con SBOM y procedencia → escanea la imagen publicada → atesta su origen → migra la base → despliega a Azure Container Apps → prueba de humo → vuelve atrás si falla. |
| `deploy-production.yml` | Solo a mano. | Despliega a producción **el mismo digest** que staging probó. Antes comprueba que el commit está en `main` y que el despliegue a staging de ese commit terminó en verde (`scripts/promotion-gate.mjs`). El entorno `production` exige aprobación. |
| `infra-azure.yml` | A mano. Elige `environment` (staging por defecto). | Crea o actualiza la infraestructura de staging con Bicep (`what-if` y luego aplica). Con el campo `image` vacío (por defecto) **mantiene la versión que ya corre**; no la cambia por la etiqueta `staging`. |
| `db-migrate.yml` | A mano. | Crea las tablas en la base de staging (Neon), carga el catálogo inicial y comprueba la conexión (`pnpm db:seed` y `pnpm db:check`). Es seguro repetirlo. No necesita Azure. |

Archivos de apoyo: `.github/actions/setup` (Node + pnpm + instalación exacta del lockfile), `dependabot.yml`, `CODEOWNERS`, `pull_request_template.md` y `SECURITY.md` en la raíz.

## Controles de seguridad

| Riesgo | Control |
|---|---|
| Código vulnerable | CodeQL en cada PR y cada semana |
| Dependencia vulnerable o maliciosa | `pnpm audit`, revisión de dependencias en PR, Dependabot semanal, lockfile congelado (`--frozen-lockfile`) |
| Secretos filtrados | gitleaks sobre el historial completo; Trivy `secret`; `.env` fuera del repositorio |
| Imagen vulnerable | Trivy sobre la imagen (alta y crítica con arreglo) antes y después de publicarla |
| Acción de terceros comprometida | Cada acción fijada por **SHA de commit**, verificada por `pnpm workflows` |
| Inyección de comandos en flujos | Prohibido `${{ }}` dentro de `run`; los valores pasan por `env` |
| Permisos excesivos | `permissions: contents: read` por defecto; cada job pide solo lo que necesita |
| Contraseñas de nube guardadas | Azure por **OIDC**: GitHub obtiene un token temporal, no hay clave en secretos |
| Origen de la imagen desconocido | SBOM y atestación de procedencia (`provenance: mode=max`, `attest-build-provenance`) |
| Bases remotas borradas por una prueba | Las pruebas destructivas solo corren contra `localhost` |
| Despliegues simultáneos o a medias | `concurrency` sin cancelar; pruebas de humo y reversión automática |

## Fijar acciones por SHA

`pnpm workflows` (script `scripts/check-workflows.mjs`) falla si:
1. una acción externa no usa un SHA de 40 caracteres con un comentario de versión,
2. falta `permissions` al nivel superior,
3. un job no tiene `timeout-minutes`,
4. un `run` usa `${{ }}`,
5. `actions/checkout` no usa `persist-credentials: false`,
6. se usa `pull_request_target`.

Para agregar o actualizar una acción:
```bash
node scripts/pin-action.mjs actions/checkout
# imprime: uses: actions/checkout@<sha> # v7.0.1
```
Antes de usar una versión nueva, lee sus entradas (`action.yml` en ese SHA). Dependabot propone las actualizaciones cada semana.

## Despliegue y reversión

1. **Migraciones primero.** `pnpm db:seed` aplica las migraciones pendientes y carga el catálogo (es idempotente). Por eso toda migración debe ser **compatible hacia atrás**: la versión anterior de la API sigue corriendo mientras se migra. Para renombrar o borrar una columna se hace en dos despliegues (primero agregar y migrar el código, luego retirar).
2. **Imagen mínima e inmutable.** La imagen final no incluye npm, npx, corepack ni yarn (la API corre con `node` directamente), lo que quita superficie de ataque y vulnerabilidades ajenas al proyecto. Se despliega `nombre@sha256:...`, nunca una etiqueta móvil.
3. **Prueba de humo.** Tras desplegar se llama a `/health` (hasta 15 intentos) y a `/catalog/brands`, que confirma que la API habla con la base de datos.
4. **Reversión.** Si algo falla después de actualizar, el flujo vuelve a la imagen anterior que registró antes de desplegar. Las migraciones no se revierten solas: por eso deben ser compatibles hacia atrás.
5. **Sin configurar, no falla.** Si no están las variables `AZURE_*`, el flujo publica la imagen y termina en verde con un aviso.

## Configuración única

### En GitHub (Settings del repositorio)
1. **Code security**: activar *Dependency graph*, *Dependabot alerts*, *Dependabot security updates*, *Secret scanning* con *Push protection*, y *Code scanning* (lo usa CodeQL).
2. **Branches → regla para `main`**: exigir pull request; exigir que pasen estas comprobaciones y que la rama esté al día: *Validar (tipos, formato, dependencias, pruebas)*, *Imagen Docker (construir y escanear)*, *Infraestructura (validar Bicep)*, *Análisis de código (CodeQL)*, *Auditoría de dependencias de producción*, *Búsqueda de secretos (gitleaks)*, *Escaneo de configuración y archivos (Trivy)*, *Revisión de dependencias nuevas*; bloquear force-push y borrado; exigir resolver conversaciones. Con una sola persona no exijas aprobaciones: no podrías aprobar tu propio PR.
3. **Environments → `staging`**: crearlo y guardar el secreto `DATABASE_URL`. Para producción, crear `production` con revisores obligatorios.
4. **Variables del repositorio** (Settings → Secrets and variables → Actions → Variables): `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` (staging), `GOOGLE_CLIENT_ID`, `MAIL_FROM`, `AUTH_TRUSTED_ORIGINS`. Variable del **entorno `staging` únicamente**: `LOGIN_TEST_PAGE` (`true` activa la página temporal de prueba de Google; nunca en producción). Ya no hacen falta `AZURE_RESOURCE_GROUP` ni `AZURE_CONTAINERAPP_NAME`: los nombres son fijos (`rg-kuntur-<entorno>`, `kuntur-api-<entorno>`) y puedes borrarlas.
5. **Secretos del entorno `staging`** (además de `DATABASE_URL`), todos opcionales y descritos en [`09-autenticacion.md`](09-autenticacion.md): `AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `SMTP_URL`. El flujo **Infraestructura Azure** los pasa a la Container App como secretos; `AUTH_BASE_URL` se calcula solo.

### Base de datos (Neon)
Crear un proyecto en Neon (plan gratuito), copiar la cadena de conexión (incluye `sslmode=require`) y guardarla como secreto `DATABASE_URL` del entorno `staging`. Una rama de Neon por entorno permite aislar staging de pruebas.

### Azure (una vez, desde Azure Cloud Shell)
No hace falta instalar nada: Azure trae una terminal dentro del navegador (**Cloud Shell**, el icono `>_` de la barra superior de https://portal.azure.com; elige **Bash** y, si te lo ofrece, continúa **sin cuenta de almacenamiento**).

El script `infra/azure/setup.sh` hace todo lo de esta sección y es seguro repetirlo: comprueba que la suscripción esté activa, registra los servicios, crea el grupo de recursos `rg-kuntur-staging`, crea una identidad para GitHub (OIDC, sin contraseñas) limitada a este repositorio, al entorno `staging` y a ese grupo, y al final imprime los cinco valores `AZURE_*` para guardarlos como **variables** del repositorio. Se puede cambiar con las variables `REPO`, `RG`, `LOCATION`, `IDENTITY_NAME` y `CONTAINERAPP_NAME`.

El subject de la credencial es la forma con IDs internos que envía GitHub: `repo:<dueño>@<id-dueño>/<repo>@<id-repo>:environment:staging` (el script lo calcula con la API pública de GitHub). Azure exige coincidencia exacta; la forma corta `repo:<dueño>/<repo>:environment:staging` **ya no funciona** con este repositorio.

Si la credencial `github-staging` ya existía con otro subject, el script no la cambia: corrígela en Microsoft Entra ID → App registrations → kuntur-github-staging → Certificates & secrets → Federated credentials → Edit.

Probado con un `az` y un `curl` simulados (primera vez, repetición, suscripción desactivada, subject con IDs). El primer ejecutado en una cuenta real fue el de la suscripción de pago por uso del propietario. Si falla con "Insufficient privileges", la cuenta no puede crear registros de aplicación en su directorio. Si la región `brazilsouth` no admite Container Apps, ejecútalo con `LOCATION=eastus2`.

Luego, en el portal de Azure, **Cost Management → Budgets**: crear un presupuesto mensual bajo (por ejemplo 5 USD) con alertas al 50 %, 80 % y 100 %. Es tu protección ante cobros inesperados. Verifica que Container Apps esté disponible en la región elegida; si no, usa otra.

### Orden de la primera vez
1. Neon y entorno `staging` con `DATABASE_URL` (arriba). Luego, en GitHub: **Actions → Base de datos staging → Run workflow**. Debe terminar en verde y el último paso imprime `Conexión correcta. Marcas: 12. Modelos: 70. Anuncios: 0.` Con eso confirmas que la base funciona antes de tocar Azure.
2. Fusionar a `main`: el flujo publica la imagen en GHCR (el despliegue queda omitido).
3. En GitHub → Packages → `kuntur-autos-api` → Package settings: si la imagen es privada, cambiar la visibilidad a pública (el repositorio es público) para que Azure pueda descargarla sin credenciales.
4. Ejecutar los comandos de Azure y guardar las cinco variables `AZURE_*`.
5. Ejecutar a mano el flujo **Infraestructura Azure** con la imagen `ghcr.io/rodrigor4mirez/kuntur-autos-api:staging`. Crea el entorno y la Container App.
6. Desde ahí, cada merge a `main` se despliega solo.

## Qué está verificado y qué no

Verificado antes de subirlo:
- Los cuatro flujos son YAML válido y cumplen el **esquema oficial de GitHub Actions**.
- `pnpm workflows` pasa; sus reglas tienen pruebas. `pnpm delivery` verifica que el Dockerfile copie todos los paquetes que necesita la API, que cada variable o secreto de los flujos esté documentado, que los parámetros de Bicep existan y que el flujo de infraestructura no use etiquetas móviles.
- Los SHA se resolvieron desde los repositorios oficiales y se leyeron los `action.yml` para confirmar las entradas usadas.
- La migración, el catálogo y la API funcionan contra PostgreSQL con el driver `pg` real.
- `pnpm audit` sin vulnerabilidades al momento de escribir esto (la alerta de `esbuild` que traía `better-auth` se resolvió con `pnpm.overrides`).

Verificado en GitHub Actions (según la revisión de la pestaña Actions que hizo el dueño; yo no tengo acceso a esa pestaña):
- CI, CodeQL, auditoría, gitleaks, escaneo de configuración y validación de Bicep pasaron.
- La imagen Docker se construye. El primer escaneo de Trivy falló por `brace-expansion`, `ip-address` y `pacote`, que son internos del `npm` de `node:22-slim`; se corrigió quitando npm, npx, corepack y yarn de la imagen final, y el despliegue #2 (`7d67526`) pasó completo.
- El paquete `kuntur-autos-api` de GHCR es público.
- El despliegue a Azure se omitió con el aviso "Despliegue no configurado".

Verificado por el propietario en su cuenta real (reportado, no lo puedo comprobar desde aquí):
- `infra/azure/setup.sh` se ejecutó con éxito en Cloud Shell.
- El flujo **Infraestructura Azure** pasó en verde en el segundo intento (el primero falló por el subject de la credencial). La API responde `/health` con `{"status":"ok"}` en su dirección de Azure.

**No verificado todavía:**
- Nada se ha desplegado a Azure: la plantilla Bicep compila en CI, pero no se aplicó, y los pasos de configuración de Azure y Neon no se han probado en una cuenta real.
- Disponibilidad de Container Apps en Brazil South.
- La prueba de humo y la reversión automática solo se verán en el primer despliegue real.
- Los comandos `az` de este documento no se ejecutaron.

## Costos y límites

Cifras de fuentes públicas a noviembre de 2026; confírmalas en la página del proveedor.
- Container Apps (plan de consumo): cuota mensual gratuita de 180.000 vCPU-segundos, 360.000 GiB-segundos y 2 millones de peticiones por suscripción; escala a cero ([precios](https://azure.microsoft.com/en-us/pricing/details/container-apps/)). Log Analytics y el tráfico fuera de la cuota se cobran: vigila el presupuesto.
- Neon (gratis): 1 GB por proyecto y 100 horas de cómputo al mes, sin cobro por exceso; la base se duerme sin uso y la primera consulta tarda más ([FAQ](https://neon.com/faqs/free-plan-limits-and-quotas)).
- GHCR y GitHub Actions: gratis para repositorios públicos.
- La decisión de hosting y las alternativas están en [`07-hosting.md`](07-hosting.md).

## Cómo cambiar de proveedor

- **Imagen**: es un contenedor Docker estándar; corre igual en Cloud Run, Render, Fly o un servidor propio. Solo cambia el paso de despliegue de `deploy-staging.yml` y `infra/azure/`.
- **Base de datos**: Neon es PostgreSQL estándar. Cambiar de proveedor es cambiar `DATABASE_URL`.
- **Registro de imágenes**: GHCR; se puede cambiar el `registry` del login y el nombre.

## Problemas frecuentes

| Síntoma | Causa probable |
|---|---|
| `Despliegue no configurado` en verde | Faltan las variables `AZURE_*` |
| Azure no puede descargar la imagen | El paquete de GHCR es privado: hazlo público o configura credenciales de registro |
| `pnpm workflows` falla | Una acción sin SHA, un job sin timeout, o un `${{ }}` dentro de `run` |
| CI falla en `Validar` con la base | Las pruebas destructivas solo aceptan `localhost`; revisa `DATABASE_URL` del job |
| Trivy marca un binario `esbuild` (Go) en la imagen | Llega como dependencia de `drizzle-kit` (vía `better-auth`). El Dockerfile lo quita de la imagen final porque la API no lo usa; las migraciones usan `drizzle-orm`. Si reaparece otra herramienta de desarrollo, quítala igual en la etapa final |
| gitleaks marca una contraseña en `*.test.ts` | Las contraseñas de prueba están permitidas en `.gitleaks.toml` (solo esas dos cadenas). Cualquier otro secreto sigue bloqueado |
| Una prueba de integración da `Test timed out` | Las pruebas de autenticación calculan contraseñas con hash seguro; el límite es 30 s (`vitest.config.ts`) |
| Trivy bloquea la imagen | Vulnerabilidad con arreglo en la imagen. Si es del `npm` o `yarn` incluidos en `node:22-slim` (por ejemplo `brace-expansion`, `ip-address`, `pacote`), ya se eliminan en la imagen final porque la API no los usa. Si es otra cosa, actualiza la dependencia o la imagen base |
| Dependabot propone `node:25-slim` o similar | Solo se usan versiones LTS de Node; `dependabot.yml` ignora saltos de versión mayor de `node`. Cierra ese PR |
| Aviso amarillo sobre `sslmode` en los registros | Lo emitía la librería `pg`: `sslmode=require` hoy verifica el certificado, pero en su próxima versión mayor dejará de hacerlo. El adaptador lo convierte a `verify-full` (`withStrictSsl`, con pruebas), así que la conexión sigue verificando al servidor y el aviso desaparece |
| La migración del despliegue falla con `Uso: DATABASE_URL=...` | La variable llegó vacía. Revisa que el secreto `DATABASE_URL` exista en el entorno del job (no en el repositorio) y que el job declare ese entorno |
| `AADSTS700213: No matching federated identity record` en "Infraestructura Azure" | El subject de la credencial no coincide con el que envía GitHub. Compara el texto de la anotación (*Show more*) con el de la credencial, letra por letra. Si ya coincide, espera unos minutos (Azure tarda en aplicar cambios) y vuelve a ejecutar |
| `Login failed` en el flujo, sin `AADSTS` | Falta una variable `AZURE_*` o el valor tiene espacios |
| Mensaje "No valid subscriptions found" en Cloud Shell | La cuenta no tiene una suscripción activa. Hay que crear una de pago por uso (ver el paso 1 de la guía) |
| Prueba de humo falla en `/catalog/brands` | La API no llega a la base: revisa el secreto `DATABASE_URL` y que Neon esté despierta |

## Producción

Staging y producción usan la misma acción de despliegue (`.github/actions/deploy-app`). Cada job declara su entorno y recibe `DATABASE_URL` de ese entorno; no se usan flujos reutilizables para esto, porque el secreto del entorno no llega igual a un flujo reutilizable (incidente de la ejecución #14); lo que cambia es el entorno de GitHub, la base y el grupo de recursos.

| | Staging | Producción |
|---|---|---|
| Cuándo se despliega | Automático en cada merge a `main` | A mano, con un commit ya aprobado en staging |
| Grupo y app | `rg-kuntur-staging` / `kuntur-api-staging` | `rg-kuntur-production` / `kuntur-api-production` |
| Réplicas mínimas | 0 (escala a cero) | 1 (sin arranque en frío) |
| Aprobación manual | No | Sí (revisores del entorno `production`) |
| Base de datos | Neon, proyecto de pruebas | Neon, proyecto **separado** |
| Identidad Azure | `kuntur-github-staging` | `kuntur-github-production` (credencial `github-production`) |

Orden para poner producción en marcha por primera vez (una sola vez):
1. Crear el entorno `production` en GitHub: revisores obligatorios (tú) y restricción de ramas a `main`.
2. Crear un proyecto de Neon separado y guardar su URL como secreto `DATABASE_URL` del entorno `production`. Igual para `AUTH_SECRET` (**distinto** al de staging), `GOOGLE_CLIENT_SECRET` y `SMTP_URL` si los usas.
3. Ejecutar `ENVIRONMENT=production bash infra/azure/setup.sh` en Cloud Shell. Guarda las variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` y `AZURE_SUBSCRIPTION_ID` **dentro del entorno `production`** (sobrescriben las del repositorio).
4. Ejecutar **Infraestructura Azure** con `environment = production` (campo `image` vacío). Revisar el what-if.
5. Ejecutar **Base de datos** con `environment = production` para comprobar la conexión.
6. Ejecutar **Despliegue a producción** con el SHA de un commit que ya terminó en verde en staging.

Reglas: nunca desplegar a producción una imagen que staging no haya probado; no reutilizar el secreto `AUTH_SECRET` de staging; cualquier cambio de secreto de producción exige volver a ejecutar **Infraestructura Azure** con `environment = production`.
