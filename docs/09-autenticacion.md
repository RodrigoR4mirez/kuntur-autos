# Autenticación: inicio de sesión por correo y Google

Este documento es obligatorio para quien toque `packages/adapters/auth`, `packages/adapters/notifications`, las rutas `/auth/*` o las variables de entorno de sesión. Si cambias algo de eso, actualízalo en el mismo commit.

## Decisión: Better Auth, gratis y sin proveedor externo

Se eligió **Better Auth**, una librería de código abierto que corre dentro de nuestra API y guarda usuarios y sesiones en nuestra propia base de datos. No hay un servicio de terceros ni costo por usuario.

| Opción | Gratis hasta | Por qué no |
|---|---|---|
| **Better Auth** (elegida) | Sin límite: los costos son nuestra base y nuestro servidor | — |
| Supabase Auth | 50.000 usuarios activos al mes, junto con la base de datos de Supabase | Ata el proyecto a Supabase |
| Firebase Auth | 50.000 usuarios activos al mes; el SMS se cobra por mensaje | Ata el proyecto a Google; el SMS es riesgo de costo |
| Clerk | 50.000 usuarios retenidos | Servicio de terceros con pantallas propias; riesgo de dependencia |

Cifras de blogs comparativos de 2026 ([TurboStarter](https://www.turbostarter.dev/blog/better-auth-vs-clerk-vs-nextauth-vs-supabase-auth), [Merginit](https://merginit.com/blog/13062026-free-auth-identity-providers-comparison)); confírmalas en la página de cada proveedor. Encaja con el requisito de independencia tecnológica: la sesión pasa por el puerto `SessionResolver`, así que se puede cambiar de proveedor escribiendo otro adaptador.

## Qué soporta hoy

- **Correo y contraseña**: contraseña de al menos 10 caracteres y **correo verificado obligatorio** antes de poder iniciar sesión.
- **Google**: inicio con cuenta de Google.
- **Sesiones** por cookie (web) y por `Authorization: Bearer <token>` (apps móviles y llamadas entre servidores).
- **Pospuesto**: verificación por SMS y validación de DNI (los puertos `Notifier` e `IdentityVerifier` ya existen; falta elegir proveedor).

## Cómo encaja en la arquitectura

```
 Interfaz  apps/api/src/interface/http/auth-routes.ts   traduce Fastify <-> Request/Response estándar
 Puerto    SessionResolver (core, módulo accounts)      token -> sesión {userId, role} o null
 Adaptador packages/adapters/auth                       Better Auth configurado + BetterAuthSessionResolver
 Adaptador packages/adapters/notifications              correo por SMTP, plantillas en español, consola (desarrollo)
 Tablas    packages/adapters/db-postgres                user, session, account, verification (+ migración)
 Cableado  apps/api/src/composition-root.ts             único lugar que los conecta
```

Las tablas viven en el adaptador de PostgreSQL porque es dueño de las migraciones; el adaptador de autenticación solo recibe la base de datos y las tablas. `listings.owner_id` es clave foránea de `user.id`.

## Rutas de autenticación

Las sirve Better Auth bajo `/auth`. Las verificadas por las pruebas de integración:

| Ruta | Qué hace |
|---|---|
| `POST /auth/sign-up/email` `{email, password, name}` | Crea la cuenta y envía el correo de verificación |
| `GET /auth/verify-email?token=...` | Enlace del correo; confirma el correo |
| `POST /auth/sign-in/email` `{email, password}` | Inicia sesión. La respuesta trae el token en la cabecera `set-auth-token` (y la cookie de sesión) |
| `GET /auth/get-session` | Sesión actual |

Para Google, la librería ofrece `POST /auth/sign-in/social` con `{provider: "google", callbackURL}` y recibe a Google en `/auth/callback/google` (ruta confirmada en el código; **el flujo con Google no se probó**, ver abajo). Recuperación de contraseña, cierre de sesión y demás rutas: documentación de Better Auth.

Las apps guardan el token de `set-auth-token` y lo envían como `Authorization: Bearer`; el resto de la API (`docs/08-api.md`) lo entiende sin cambios.

## Variables de entorno

| Variable | Obligatoria | Qué es |
|---|---|---|
| `AUTH_SECRET` | Para activar el inicio de sesión | Al menos 32 caracteres aleatorios (`openssl rand -base64 48`). **Secreto**: nunca en el repositorio |
| `AUTH_BASE_URL` | En producción si hay `AUTH_SECRET` | URL pública de la API. En Azure, la plantilla Bicep la calcula sola |
| `AUTH_TRUSTED_ORIGINS` | Cuando exista la web | Orígenes de la web, separados por comas |
| `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` | Para Google (ambos o ninguno) | Credenciales OAuth. El secreto es **secreto** |
| `SMTP_URL` y `MAIL_FROM` | Para correo en producción (ambos o ninguno) | `smtps://usuario:clave@host:465` (codifica los caracteres especiales de la clave) y el remitente. `SMTP_URL` es **secreto** |

Qué pasa según la configuración:

| Situación | Resultado |
|---|---|
| Producción sin `AUTH_SECRET` | Inicio de sesión desactivado, todos anónimos, con un aviso en el registro. La API arranca igual |
| `AUTH_SECRET` corto, o Google o SMTP a medias | La API **no arranca** y dice qué falta |
| Producción con `AUTH_SECRET` pero sin SMTP | El registro por correo queda **desactivado** (no se aceptan cuentas sin verificar); Google sí funciona |
| Desarrollo sin `AUTH_SECRET` | Tokens fijos `dev-seller` y `dev-buyer` (nunca en producción) |
| Desarrollo con `AUTH_SECRET` y sin SMTP | Los correos se imprimen en el registro (con el enlace de verificación) |

## Guía paso a paso (lo haces tú, una sola vez)

Nunca pegues secretos en el chat, en un commit ni en un issue. Van en un archivo `.env` local (que Git ignora) y en los **secretos** de GitHub.

### Dónde se guarda cada valor en GitHub

| Tipo | Dónde | Cómo |
|---|---|---|
| **Secreto del entorno** | Repositorio → Settings → Environments → `staging` | Si no existe, *New environment* con el nombre `staging`. Luego *Add environment secret*: nombre y valor |
| **Variable del repositorio** | Repositorio → Settings → Secrets and variables → Actions → pestaña **Variables** | *New repository variable*: nombre y valor |

### Paso 1. Secreto de sesiones (`AUTH_SECRET`)
1. En una terminal, genera un valor aleatorio:
   ```bash
   openssl rand -base64 48
   ```
   Si no tienes `openssl` (por ejemplo en Windows) y tienes Node:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   ```
2. Copia el resultado (unos 64 caracteres).
3. Guárdalo como **secreto del entorno `staging`** con el nombre `AUTH_SECRET`.
4. Para probar en tu computadora, ponlo también en tu `.env` (copia `.env.example`): `AUTH_SECRET=...`.
5. Si algún día lo cambias, las sesiones activas dejan de ser válidas y la gente tendrá que iniciar sesión de nuevo. Usa uno distinto para producción.

### Paso 2. Google (`GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`)
Es gratis. Las pantallas de Google cambian de nombre con frecuencia; si algo no coincide, busca "Google Auth Platform" en el buscador de la consola.
1. Entra a https://console.cloud.google.com con la cuenta de Google que será la dueña del proyecto.
2. En la barra superior abre el selector de proyectos → **Nuevo proyecto** → nombre `kuntur-autos` → **Crear**. Asegúrate de que quede seleccionado.
3. En el buscador de arriba escribe **Google Auth Platform** y ábrelo. Si es la primera vez, pulsa **Comenzar**.
4. Completa el asistente: nombre de la aplicación `Kuntur Autos`, correo de asistencia (el tuyo), público **Externo**, correo de contacto, acepta la política y **Crear**.
5. Menú **Público (Audience)**: mientras la app esté en modo *Testing*, solo pueden entrar las cuentas que agregues en **Usuarios de prueba** (**+ Add users**). Agrega tu Gmail y el de quien vaya a probar.
6. Menú **Clientes (Clients)** → **Crear cliente**:
   - Tipo de aplicación: **Aplicación web**.
   - Nombre: `Kuntur Autos staging`.
   - **Orígenes de JavaScript autorizados**: déjalo vacío (el inicio de sesión lo hace nuestro servidor).
   - **URI de redireccionamiento autorizados** → **Agregar URI**: `http://localhost:3000/auth/callback/google` (para probar en tu computadora).
   - **Crear**.
7. Google muestra el **ID de cliente** y el **secreto del cliente**. **Cópialos ahora**: según las guías, el secreto solo se muestra al crearlo (si lo pierdes, creas otro).
8. Guárdalos: `GOOGLE_CLIENT_ID` como **variable del repositorio**, `GOOGLE_CLIENT_SECRET` como **secreto del entorno `staging`**, y ambos en tu `.env` local.
9. Cuando exista la dirección pública de la API (la imprime el flujo **Infraestructura Azure** como `googleRedirectUri`), vuelve a **Clientes**, abre el cliente y agrega ese URI: `https://<tu-api>/auth/callback/google`.
10. Reglas del URI: debe coincidir **exactamente** (mayúsculas, puerto, sin barra final); `https` salvo `localhost`; sin comodines. Si no, Google responde `redirect_uri_mismatch`.
11. Para abrirlo al público: **Público → Publicar aplicación**. Con permisos básicos (correo y perfil) normalmente no pide una verificación larga, pero confírmalo en la consola.

Fuentes de los pasos y reglas: [guía de la nueva interfaz](https://var.gg/en/blog/gcp-oauth-consent-client-id), [ayuda de Google Cloud](https://support.google.com/cloud/answer/15549257).

### Paso 3. Correo (`SMTP_URL` y `MAIL_FROM`)
Sirve cualquier proveedor SMTP. Con la dirección `no-responder@...` que uses, el proveedor exige que seas dueño de ese remitente; para enviar a cualquier persona suele hacer falta un **dominio propio verificado**. Mientras no tengas dominio, puedes probar enviando solo a tu propio correo.

**Opción A: Resend (recomendada para empezar).** Plan gratis: 3.000 correos al mes y 100 al día.
1. Crea la cuenta en https://resend.com.
2. **API Keys** → **Create API Key** → nombre `kuntur-staging`, permiso **Sending access** → cópiala (se muestra una sola vez).
3. Datos SMTP de Resend ([documentación](https://resend.com/docs/send-with-smtp)): servidor `smtp.resend.com`, puerto `465` (TLS directo), usuario `resend`, contraseña = tu API key.
4. Arma la URL con el usuario y la clave codificados (evita que un carácter especial la rompa):
   ```bash
   node -e "console.log('smtps://'+encodeURIComponent('resend')+':'+encodeURIComponent('TU_API_KEY')+'@smtp.resend.com:465')"
   ```
5. `MAIL_FROM` para probar: `Kuntur Autos <onboarding@resend.dev>`. Esa dirección de pruebas, según mi conocimiento general y no lo verifiqué, solo entrega al correo con el que abriste la cuenta de Resend: confírmalo en su documentación.
6. Para usuarios reales: **Domains → Add Domain**, copia los registros DNS (SPF y DKIM) que te muestra al panel de tu registrador de dominio y espera a que diga *Verified*. Luego `MAIL_FROM` pasa a `Kuntur Autos <no-responder@tudominio.pe>`.

**Opción B: Brevo.** Plan gratis: 300 correos al día según la mayoría de fuentes (confírmalo).
1. Crea la cuenta en https://www.brevo.com.
2. Menú de tu cuenta (arriba a la derecha) → **SMTP & API** → pestaña **SMTP**: ahí ves el servidor `smtp-relay.brevo.com`, el puerto y tu **login**.
3. **Generate a new SMTP key**, ponle un nombre y cópiala.
4. Agrega y verifica un remitente en la sección de remitentes de Brevo (te envían un código al correo). Si exige dominio propio, no lo verifiqué: pregúntalo en su ayuda.
5. URL: `smtps://LOGIN:CLAVE@smtp-relay.brevo.com:465`, codificando `LOGIN` y `CLAVE` como en el paso 4 de Resend.
6. Una persona reportó que Brevo daba tiempo de espera agotado desde un servicio en la nube; pruébalo desde Azure antes de depender de él.

**Guardar:** `SMTP_URL` como **secreto del entorno `staging`**; `MAIL_FROM` como **variable del repositorio**; ambos en tu `.env` local.

### Paso 4. Aplicar los cambios
Requiere haber hecho antes la configuración de Azure y Neon de [`06-ci-cd.md`](06-ci-cd.md).
1. En GitHub: pestaña **Actions** → en la lista de la izquierda **Infraestructura Azure** → **Run workflow** → deja la imagen por defecto → **Run workflow**.
2. Cuando termine, abre el registro de ese flujo: al final aparece `googleRedirectUri`. Agrégalo en el cliente de Google (paso 2.9).
3. Prueba contra la API pública (reemplaza la dirección):
   ```bash
   curl -i -X POST https://<tu-api>/auth/sign-up/email \
     -H 'content-type: application/json' -H 'origin: https://<tu-api>' \
     -d '{"email":"tu@correo.com","name":"Tu nombre","password":"una-clave-larga-123"}'
   ```
   Debe llegarte el correo de verificación. Abre el enlace y luego inicia sesión con `POST /auth/sign-in/email`.

### Resumen de nombres

| Nombre | Tipo en GitHub | Viene de |
|---|---|---|
| `AUTH_SECRET` | Secreto del entorno `staging` | Paso 1 |
| `GOOGLE_CLIENT_ID` | Variable del repositorio | Paso 2 |
| `GOOGLE_CLIENT_SECRET` | Secreto del entorno `staging` | Paso 2 |
| `SMTP_URL` | Secreto del entorno `staging` | Paso 3 |
| `MAIL_FROM` | Variable del repositorio | Paso 3 |
| `AUTH_TRUSTED_ORIGINS` | Variable del repositorio (vacía hasta que exista la web) | — |

## Probar en local

Con `docker compose up db` y las migraciones (`pnpm db:migrate`):
```bash
AUTH_SECRET=$(openssl rand -base64 48) \
DATABASE_URL=postgres://kuntur:kuntur@localhost:5432/kuntur \
pnpm --filter @kuntur/api start
```
Registra una cuenta con `POST /auth/sign-up/email`: el enlace de verificación aparece en el registro de la API (o llega a tu correo si configuraste `SMTP_URL` y `MAIL_FROM`).

**Verificado en local:** con `AUTH_SECRET` y credenciales de Google de prueba, `POST /auth/sign-in/social` devuelve una URL de `accounts.google.com` con `client_id`, `scope` (`email profile openid`) y `redirect_uri` igual a `<AUTH_BASE_URL>/auth/callback/google`. Lo que **no** se ha probado es el inicio de sesión real con Google (requiere credenciales reales y un navegador):
```bash
curl -s -X POST http://localhost:3000/auth/sign-in/social \
  -H 'content-type: application/json' -H 'origin: http://localhost:3000' \
  -d '{"provider":"google","callbackURL":"http://localhost:3000/auth/get-session"}'
```
La respuesta trae una `url`. Al aceptar en Google vuelves a `/auth/callback/google` y terminas en `/auth/get-session`, que muestra tu sesión.

**Guía del flujo completo, paso a paso (staging): `docs/11-google-login.md`.**

## Seguridad

- Correo verificado obligatorio; contraseña de al menos 10 caracteres.
- El rol no se elige al registrarse: todos nacen `buyer`. Roles como `advisor` o `admin` se asignan en la base de datos. Una prueba lo verifica.
- Un token desconocido o vencido equivale a anónimo; las rutas protegidas responden 401.
- El envío del correo no se espera, para que el tiempo de respuesta no revele si una cuenta existe.
- Las plantillas escapan el HTML y rechazan enlaces que no sean `http(s)`.
- Los secretos solo viven en variables de entorno y en los secretos del entorno de GitHub, y llegan a Azure como secretos de la Container App.
- `pnpm audit` pasó limpio. `better-auth` traía una alerta moderada de `esbuild` por una herramienta de desarrollo; se resolvió con una sustitución de versión en `package.json` (`pnpm.overrides`).

## Qué está verificado y qué no

Verificado con pruebas automáticas (PostgreSQL real en memoria y Better Auth real): registro; que no se pueda iniciar sesión sin verificar el correo; verificación con el enlace recibido; inicio de sesión y token Bearer; publicar con ese token; contraseña incorrecta y tokens inventados (401); rol no elegible; contraseñas cortas rechazadas; registro por correo desactivado sin proveedor de correo; configuración (`loadConfig`) y que los tokens de desarrollo no funcionan en producción.

**No verificado:**
- **El flujo con Google**: necesita credenciales reales y un navegador.
- **El envío real de correos por SMTP**: las pruebas usan un transporte simulado.
- Recuperación de contraseña, cierre de sesión, cookies en un navegador, límites de intentos de la librería.
- La migración `0001` y la sesión en Neon y Azure (solo se probó con PGlite).
- CORS: se configurará cuando exista la web (`AUTH_TRUSTED_ORIGINS`).

## Pendiente
- SMS y validación de DNI (elegir proveedor y crear cuenta).
- CORS y el uso de cookies desde la web de Next.js.
- Dominio propio, para el remitente de correo y las URL públicas.
- Pantalla de inicio de sesión (llega con la web).

## Cómo cambiar de proveedor de autenticación
Escribe un adaptador que implemente `SessionResolver` y entregue un manejador `Request → Response` para `/auth/*`; cámbialo en `composition-root.ts`. El núcleo, las rutas de negocio y las pruebas de la API no cambian.
