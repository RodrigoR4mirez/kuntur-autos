# Runbook: cómo cambiar, desplegar y revertir Kuntur Autos

**Este es el único procedimiento oficial.** Cualquier persona o agente (Claude, otro chat, un humano) que vaya a tocar código, infraestructura, base de datos, secretos o despliegues debe seguir este documento. Si algo aquí no coincide con la realidad, corrige este documento en el mismo cambio.

Complementa: `11-google-login.md` (inicio de sesión con Google paso a paso), `06-ci-cd.md` (cómo funciona cada flujo), `09-autenticacion.md` (variables de inicio de sesión) y la skill `kuntur-delivery`.

## 1. Estado actual (no contiene secretos ni identificadores privados)

Staging está en vivo. Producción se pone en marcha con la sección 10.

| Recurso | Valor |
|---|---|
| Repositorio | `RodrigoR4mirez/kuntur-autos` (público) |
| Grupos de recursos Azure | `rg-kuntur-staging` y `rg-kuntur-production` (Brazil South) |
| Aplicaciones (Container Apps) | `kuntur-api-staging` y `kuntur-api-production` |
| Dirección pública de la API | `https://kuntur-api-staging.politerock-80f1ef72.brazilsouth.azurecontainerapps.io` |
| Entornos de GitHub | `staging` y `production` (secretos y variables propios) |
| Imagen | `ghcr.io/rodrigor4mirez/kuntur-autos-api` (pública) |
| Base de datos | Neon (PostgreSQL), en el secreto `DATABASE_URL` |
| Identidad para GitHub | aplicación `kuntur-github-staging`, credencial federada `github-staging` (OIDC) |

Los identificadores de Azure (suscripción, tenant, ID de cliente) están en las **variables del repositorio** de GitHub, no en este archivo.

Verificación rápida de que la tienda vive:
```bash
curl -s https://kuntur-api-staging.politerock-80f1ef72.brazilsouth.azurecontainerapps.io/health
# {"status":"ok"}
```

## 2. Antes de cualquier cambio (siempre)
1. Lee este runbook y la skill `kuntur-delivery`.
2. Trabaja en una rama, nunca directo en `main`.
3. Corre localmente: `pnpm check` (incluye formato, reglas de dependencias, política de flujos y **coherencia de entrega**). Debe pasar.
4. Abre un pull request. Deben pasar todas las comprobaciones de `main` (ver sección 6).
5. Fusiona solo cuando estén verdes.

## 3. Camino A: cambio de código de la API
1. Cambia el código y sus pruebas. Documenta según `kuntur-docs-sync`.
2. Pull request → comprobaciones verdes → fusionar a `main`.
3. Se ejecuta **Despliegue a staging** solo: CI, seguridad, imagen, migración, despliegue y prueba de humo.
4. Verifica:
   ```bash
   curl -s https://<url>/health                 # {"status":"ok"}
   curl -s https://<url>/catalog/brands         # lista de marcas
   ```
5. Si el despliegue falla, el propio flujo vuelve a la imagen anterior. Revisa la sección 7.

**No** despliegues con `az containerapp update` a mano salvo en una emergencia (ver sección 7).

## 4. Camino B: cambio de infraestructura (Bicep)
1. Cambia `infra/azure/main.bicep` y, si cambian parámetros, `.github/workflows/infra-azure.yml`.
2. Pull request → la comprobación **Infraestructura (validar Bicep)** debe pasar.
3. Fusiona.
4. En GitHub: **Actions → Infraestructura Azure → Run workflow**. **Deja el campo `image` vacío.** Con el campo vacío el flujo mantiene la versión que ya corre.
5. Revisa el paso **Vista previa de cambios (what-if)**: lista lo que se va a crear, cambiar o borrar. Si aparece un **borrado** que no esperabas, **no sigas**: avísame.
6. Si la vista previa es correcta, el paso **Aplicar** la hace.

**Cuidado:** cambiar un secreto (`AUTH_SECRET`, `DATABASE_URL`, `SMTP_URL`, `GOOGLE_CLIENT_SECRET`) **no** se aplica solo. Hay que ejecutar **Infraestructura Azure** después, para que la Container App reciba el nuevo valor.

## 5. Camino C: base de datos
- **Migraciones de esquema:** se aplican solas en cada despliegue (`pnpm db:seed` es idempotente). Deben ser **compatibles hacia atrás** (ver `06-ci-cd.md`).
- **Comprobar la conexión a mano:** **Actions → Base de datos staging → Run workflow**. Debe terminar con `Conexión correcta. Marcas: 12. Modelos: 70. Anuncios: N.`
- **Cambiar la base (otra URL de Neon):** actualiza el secreto `DATABASE_URL` del entorno `staging` → ejecuta **Base de datos staging** → ejecuta **Infraestructura Azure** (para que la app reciba la nueva URL).

## 6. Comprobaciones obligatorias de `main`
| Comprobación | Qué garantiza |
|---|---|
| Validar (tipos, formato, dependencias, pruebas) | El código compila, cumple las reglas y pasa las pruebas con PostgreSQL real |
| Imagen Docker (construir y escanear) | La imagen se construye y no tiene vulnerabilidades altas o críticas con arreglo |
| Infraestructura (validar Bicep) | La plantilla compila |
| Análisis de código (CodeQL) | Sin hallazgos de seguridad en el código |
| Auditoría de dependencias de producción | Sin vulnerabilidades conocidas en producción |
| Búsqueda de secretos (gitleaks) | No hay contraseñas en el historial |
| Escaneo de configuración y archivos (Trivy) | Sin problemas de configuración |
| Revisión de dependencias nuevas | (solo PR) no entran dependencias con vulnerabilidades altas |

Y, en local, `pnpm check` cubre todo lo que se puede comprobar sin GitHub.

## 7. Qué hacer cuando algo falla

| Síntoma | Qué hacer |
|---|---|
| El despliegue falla en `Login` con `AADSTS700213` | El subject de la credencial no coincide. Compara la anotación con la credencial en Entra ID (`06-ci-cd.md`, tabla de problemas). **No** ejecutes `infra/azure/setup.sh` para "arreglarlo": no modifica una credencial que ya existe |
| La prueba de humo falla y la reversión automática también | Revierte a mano a la revisión anterior (abajo) y pásame el registro |
| `/health` no responde después de un cambio manual | Revisa los registros de la app en el portal (Container Apps → kuntur-api-staging → Log stream) |
| La API responde pero no lee la base | Ejecuta **Base de datos staging** y revisa `DATABASE_URL` |
| Un flujo se queda en "Waiting" | Otro flujo del mismo grupo está corriendo. Espera; no canceles el de infraestructura |

**Revertir a mano (emergencia), desde Cloud Shell en el portal:**
```bash
RG=rg-kuntur-staging; APP=kuntur-api-staging
az containerapp revision list -n $APP -g $RG -o table          # mira las revisiones
az containerapp revision show -n $APP -g $RG --revision <NOMBRE-ANTERIOR> \
  --query properties.template.containers[0].image -o tsv         # imagen de esa revisión
az containerapp update -n $APP -g $RG --image <IMAGEN-ANTERIOR>
```
Esto no está probado todavía en una cuenta real: confírmalo la primera vez con una revisión de prueba.

## 8. Qué NO hacer nunca
- No cambies la imagen de la app a una etiqueta móvil (`:staging`, `:latest`). Usa siempre `nombre@sha256:...`.
- No borres el grupo `rg-kuntur-staging` salvo que quieras apagar todo (es el botón de pánico).
- No pongas secretos en el repositorio, en issues, ni en el chat. Van en los secretos de GitHub.
- No hagas `force push` a `main`.
- No edites los flujos sin correr `pnpm workflows` y `pnpm delivery`.
- No cambies el nombre de las variables `AZURE_*` ni el de `staging` sin actualizar la credencial de Azure y este runbook.

## 9. Verificado y no verificado
- **Verificado en GitHub (por el propietario):** CI, seguridad, despliegue a staging, flujo de infraestructura en el segundo intento, y `/health` respondiendo en Azure.
- **Verificado localmente:** la coherencia de Dockerfile, documentación, Bicep y versión (`pnpm delivery`), con pruebas que la hacen fallar a propósito.
- **No verificado:** la reversión manual de la sección 7; el cambio de base de datos completo; la alerta de presupuesto de Azure; el flujo con Google y el envío real de correos.

## 10. Producción: primera puesta en marcha y uso normal

Detalle en `06-ci-cd.md`, sección "Producción". Resumen operativo:

**Primera vez (una sola vez):** entorno `production` con revisores; base de Neon separada; secretos propios; `ENVIRONMENT=production bash infra/azure/setup.sh`; variables de Azure dentro del entorno; **Infraestructura Azure** con `environment = production`; **Base de datos** con `environment = production`.

**Cada despliegue a producción:**
1. Confirma que el commit que quieres publicar terminó en verde en **Despliegue a staging** (copia su SHA completo de 40 caracteres).
2. **Actions → Despliegue a producción → Run workflow**, pega el SHA y ejecuta.
3. El flujo comprueba el commit y la aprobación de staging, resuelve el digest que staging probó y espera tu **aprobación** en el entorno `production`.
4. Tras desplegar, verifica `/health` y `/catalog/brands` en la URL de producción.
5. Si falla, el propio flujo revierte. Si no basta, sigue la sección 7.

**Nunca:** desplegar producción desde una rama que no sea `main`; saltarse la compuerta; reutilizar secretos de staging.

**Verificado:** la lógica de la compuerta tiene pruebas; el flujo de producción pasa el esquema de GitHub y las reglas de `pnpm workflows` y `pnpm delivery`. **No verificado:** ninguna ejecución real de producción todavía.
