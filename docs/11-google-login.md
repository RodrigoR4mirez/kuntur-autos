# Inicio de sesión con Google: pasos para staging

Procedimiento para que "Entrar con Google" funcione en staging. Requisitos: `AUTH_SECRET` ya guardado (ver `09-autenticacion.md`, paso 1) y la API desplegada.

## Lo que ya está verificado en local
Con credenciales de prueba, la API genera una URL de inicio de sesión de Google con:
- `client_id` tomado de `GOOGLE_CLIENT_ID`;
- `scope`: `email profile openid`;
- `redirect_uri`: `https://kuntur-api-staging.politerock-80f1ef72.brazilsouth.azurecontainerapps.io/auth/callback/google`.

**No verificado:** el inicio real con una cuenta de Google. Eso se prueba en el paso 4.

## 1. Google Cloud (gratis)
1. Entra a https://console.cloud.google.com y selecciona (o crea) el proyecto `kuntur-autos`.
2. Busca **Google Auth Platform**. Si aparece *Comenzar*, complétalo: nombre de la app `Kuntur Autos`, tu correo de asistencia, público **Externo**, tu correo de contacto. Crear.
3. Menú **Público (Audience)** → **Usuarios de prueba** → **Add users**: agrega tu Gmail. Mientras la app esté en *Testing*, solo entran estas cuentas.
4. Menú **Clientes (Clients)** → **Crear cliente**:
   - Tipo: **Aplicación web**. Nombre: `Kuntur Autos staging`.
   - **Orígenes de JavaScript autorizados:** vacío.
   - **URI de redireccionamiento autorizados** → Agregar URI. Pega **exactamente** esto:
     ```
     https://kuntur-api-staging.politerock-80f1ef72.brazilsouth.azurecontainerapps.io/auth/callback/google
     ```
   - Crear.
5. Google muestra el **ID de cliente** y el **secreto del cliente**. Cópialos en ese momento.

## 2. GitHub (dos valores)
1. **Variable del repositorio** (Settings → Secrets and variables → Actions → Variables): `GOOGLE_CLIENT_ID` = el ID de cliente.
2. **Secreto del entorno `staging`** (Settings → Environments → staging → Environment secrets): `GOOGLE_CLIENT_SECRET` = el secreto del cliente.
3. Confirma que el secreto `AUTH_SECRET` existe en el entorno `staging`. Sin él, la API no activa ninguna ruta `/auth/*`.

## 3. Aplicar en Azure
1. **Actions → Infraestructura Azure → Run workflow**.
2. `environment`: **staging**. `image`: **vacío**.
3. Espera a que quede en verde. El paso *Vista previa* debe mostrar que se actualiza la Container App (no que se borra nada). Si muestra un borrado, no sigas.

## 4. Probar
Desde Cloud Shell (o cualquier terminal con `curl`):
```bash
B=https://kuntur-api-staging.politerock-80f1ef72.brazilsouth.azurecontainerapps.io
curl -s -X POST $B/auth/sign-in/social \
  -H 'content-type: application/json' -H "origin: $B" \
  -d "{\"provider\":\"google\",\"callbackURL\":\"$B/auth/get-session\"}"
```
Copia el valor de `"url"` de la respuesta y ábrelo en el navegador.

Qué debes ver:
1. La pantalla de Google con el nombre **Kuntur Autos**. Puede aparecer una advertencia de *app no verificada*: es normal en modo prueba. Pulsa **Avanzado** → **Ir a Kuntur Autos**.
2. Eliges tu cuenta de prueba y aceptas los permisos (correo, nombre, perfil).
3. Te redirige a `.../auth/get-session` y muestra tu sesión en JSON, con tu correo y tu nombre.

## Problemas frecuentes
| Lo que ves | Causa | Qué hacer |
|---|---|---|
| `redirect_uri_mismatch` en Google | El URI registrado no coincide letra por letra | Corrige el URI del cliente en Google (sin barra final, con `https`) |
| `access_denied` o "no tienes acceso" | Tu cuenta no está en *Usuarios de prueba* | Agrégala en el paso 1.3 |
| `invalid_client` | El ID o el secreto no coinciden | Vuelve a copiar el secreto del cliente; actualiza el secreto y ejecuta **Infraestructura Azure** |
| `curl` responde 404 en `/auth/...` | Falta `AUTH_SECRET` | Guárdalo en el entorno y ejecuta **Infraestructura Azure** |
| La URL de inicio no contiene `accounts.google.com` | Falta `GOOGLE_CLIENT_ID` o `GOOGLE_CLIENT_SECRET` | Revisa los dos valores (paso 2) |
| Vuelve a la página de Google sin entrar | Cookies de terceros bloqueadas en el navegador | Prueba en una ventana normal o sin bloqueadores |

## Para abrirlo al público (después)
Mientras la app esté en *Testing*, solo entran los usuarios de prueba. Para abrirla: **Google Auth Platform → Público → Publicar aplicación**. Los permisos que usamos (correo, nombre, perfil) son básicos y normalmente no piden una revisión larga; confírmalo en la consola antes de publicar.

## Para desarrollo local (opcional)
Agrega también `http://localhost:3000/auth/callback/google` al cliente y usa `AUTH_BASE_URL=http://localhost:3000` en tu `.env`.

## Prueba desde el navegador (página temporal)

La prueba con `curl` no basta: el inicio debe empezar en el navegador para que llegue la cookie de vuelta. Por eso hay una página temporal, activa solo en staging.

**Activarla (una vez):**
1. Settings → Environments → `staging` → Environment variables → **Add variable**: nombre `LOGIN_TEST_PAGE`, valor `true`.
2. Actions → **Infraestructura Azure** → Run workflow: `environment` = staging, `image` vacío.
3. Abre `<URL de staging>/login-test`.

**Usarla:** pulsa **Entrar con Google**, elige tu cuenta de prueba y acepta. Debe aparecer tu sesión en JSON.

**Retirarla** cuando exista la web: pon `LOGIN_TEST_PAGE` en `false` y vuelve a ejecutar Infraestructura Azure, o bórrala del entorno.
