# Estado del proyecto y siguientes pasos (traspaso entre sesiones)

Actualizado: 2026-11-15. Este archivo existe para que cualquier agente (otra sesión, Claude local) retome sin la conversación anterior. **Léelo después de `CLAUDE.md`.** Actualízalo al cerrar cada sesión.

## Cómo trabaja con el dueño
- Quiere **una sola instrucción a la vez**, precisa, "como a un niño", diciéndole qué debe escribir de vuelta. Nunca varias a la vez.
- Nunca pedir ni mostrar secretos en el chat.
- Nunca trabajar directo en `main`: rama + pull request. Desde 2026-11-15 **el agente fusiona** (con `gh`, ya autenticado) cuando todas las comprobaciones están en verde y luego revisa "Despliegue a staging" (ver `CLAUDE.md`). En sesiones en la nube `gh pr create` falla; usar `gh api repos/RodrigoR4mirez/kuntur-autos/pulls -f ...`.
- Marcar siempre lo verificado y lo no verificado. Documentación en el mismo commit.

## Qué existe y funciona (verificado)
- API Fastify + PostgreSQL (Neon) + Better Auth (Google) en Azure Container Apps, staging automático desde `main`. Reversión automática, escaneos, compuerta de producción (aún no usada).
- La API acepta la sesión por **cookie** además de Bearer (probado con Better Auth real).
- `apps/web` (Next.js 16): landing, `/ingresar` (Google), `/vender` (formulario conectado al catálogo; guarda borrador y envía a revisión), `/anuncios/[id]`. Reenvía `/api/*` y `/auth/*` a la API (`KUNTUR_API_URL`), un solo origen.
- Despliegue de la web: imagen `kuntur-autos-web`, acción `deploy-web`, Bicep `kuntur-web-<entorno>`. Pull request 2 fusionado; Infraestructura Azure corrió en verde y creó la web en staging.
- Dirección de la web en staging: `https://kuntur-web-staging.politerock-80f1ef72.brazilsouth.azurecontainerapps.io`

## Estado exacto al cerrar esta sesión
1. El dueño abrió la web desplegada y dijo: **"es el peor interfaz visual que he visto y no funciona nada"**. **No se sabe qué falla**: desde la sesión en la nube no se puede abrir la dirección de Azure (red bloqueada). En local, con captura de pantalla, la landing se veía correcta. Se le pidió una captura de la web desplegada (pendiente).
2. **Causas probables a revisar primero:** (a) el ingreso con Google no puede funcionar aún porque falta registrar en Google Cloud el URI `https://kuntur-web-staging.politerock-80f1ef72.brazilsouth.azurecontainerapps.io/auth/callback/google` (dará `redirect_uri_mismatch`); (b) estilos o tipografías sin cargar en la imagen real (la imagen se probó solo simulando el Dockerfile, no con Docker); (c) la web arrancó con la imagen `:staging` y aún no se desplegó por digest (corre "Despliegue a staging" otra vez); (d) la web no llega a la API (probar `/api/catalog/brands` en la dirección de la web).
3. El diseño es mínimo (un solo CSS, sin imágenes de autos). Rediseñarlo es una tarea real: pedirle referencias o mostrar capturas antes de rehacer.

## Diagnóstico de la web (2026-11-15, verificado con curl y `gh`)
- La web carga con estilos, fuentes y marca; la API directa responde; el último despliegue (`d445ffc`) fue verde con prueba de humo.
- El "no funciona" tenía como causa técnica un **arranque en frío**: en staging la API escala a cero y la primera petición tardó más de 15 s, el reenvío daba 502 `api_unreachable`. Con la API despierta, `/api/catalog/brands` da 200 en ~0,4 s. Corregido: espera de 45 s, un reintento en GET y mensaje claro (`apps/web/src/lib/proxy.ts`).
- **Rediseño total (2ª versión, rama `feat/web-redesign`)** según la referencia del dueño: paneles, Negro Cóndor, barra lateral y auto protagonista (ver `04-marca.md`). Responsivo: probado con capturas a 390, 820 y 1440 px en Chrome. **Sin verificar:** otros navegadores, un dispositivo físico, LCP/CLS medidos (no se corrió Lighthouse) e ingreso con Google (falta el URI en Google Cloud).
- **Módulos nuevos:** listado público con filtros (`GET /listings`, pantalla `/autos`), "Mis anuncios" (`/mis-anuncios`, enviar a revisión) y revisión por asesor (`/asesor`, aprobar o rechazar). Sin un asesor no se publica nada: ver `10-runbook.md` sección 11 (**no ejecutado todavía**).

## Pendiente, en orden sugerido
1. Obtener la captura de la web desplegada y corregir lo que falle.
2. Registrar el URI de Google de arriba (paso del dueño en Google Cloud → Clientes).
3. Dar el rol de asesor a una cuenta (runbook sección 11) y probar de punta a punta: publicar → enviar a revisión → aprobar → verlo en `/autos`. Luego: fotos reales, editar anuncio y búsqueda por texto.
4. Fotos, moderación y panel del asesor; citas con repositorio PostgreSQL; depósito de S/ 10 (requiere cuenta de pasarela, p. ej. Culqi).
5. Correo (SMTP_URL + MAIL_FROM), SMS y validación de DNI: el dueño debe elegir proveedor y crear cuentas.
6. Producción: primera puesta en marcha (ver `10-runbook.md`, sección 10). Nunca se ha ejecutado.
7. Quitar `/login-test` y `LOGIN_TEST_PAGE` cuando el ingreso en la web esté probado.
8. Activar la verificación en dos pasos de GitHub antes del 2026-12-23. Alerta de presupuesto de Azure: no confirmada.

## No verificado
`docker build` real de la web; escaneo Trivy sobre esa imagen en despliegue; el ingreso con Google a través de la web en Azure; reversión manual; producción.

## Datos para orientarse
- Repositorio: `RodrigoR4mirez/kuntur-autos` (público). Entornos de GitHub: `staging` y `production`. Grupos Azure: `rg-kuntur-staging`, `rg-kuntur-production` (Brazil South).
- Antes de tocar `.github/`, `infra/`, Docker, migraciones o secretos: skill `kuntur-delivery` y `10-runbook.md`.
