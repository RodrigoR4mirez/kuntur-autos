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

## Configurar Google (una vez, lo haces tú)

1. En la consola de Google Cloud (gratis), crea un proyecto y configura la **pantalla de consentimiento de OAuth** con el nombre Kuntur Autos y tu correo de soporte.
2. En **Credenciales**, crea un **ID de cliente OAuth** de tipo *Aplicación web*.
3. En **URI de redireccionamiento autorizados** agrega `<AUTH_BASE_URL>/auth/callback/google`. Para desarrollo: `http://localhost:3000/auth/callback/google`. Debe coincidir exactamente.
4. Copia el ID y el secreto: `GOOGLE_CLIENT_ID` como variable del repositorio y `GOOGLE_CLIENT_SECRET` como secreto del entorno `staging` de GitHub.
5. Mientras la app esté en modo de prueba, solo entran las cuentas que agregues como usuarios de prueba; para abrirla al público hay que publicar la pantalla de consentimiento (Google puede pedir verificación).

## Configurar el correo (una vez, lo haces tú)

Cualquier proveedor SMTP sirve; cambiar de uno a otro es cambiar `SMTP_URL`.
- **Resend**: 3.000 correos al mes y 100 al día gratis ([comparativa](https://agentdeals.dev/email-comparison-2026)).
- **Brevo**: la mayoría de fuentes dicen 300 correos al día gratis, pero otra lista 100 al día: confírmalo en su página.
- Para enviar a cualquier persona con buena entrega, los proveedores suelen exigir un **dominio propio verificado** (registros SPF y DKIM). Aún no hay dominio; eso está por verificar con el proveedor que elijas.

## Probar en local

Con `docker compose up db` y las migraciones (`pnpm db:migrate`):
```bash
AUTH_SECRET=$(openssl rand -base64 48) \
DATABASE_URL=postgres://kuntur:kuntur@localhost:5432/kuntur \
pnpm --filter @kuntur/api start
```
Registra una cuenta con `POST /auth/sign-up/email`: el enlace de verificación aparece en el registro de la API.

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
