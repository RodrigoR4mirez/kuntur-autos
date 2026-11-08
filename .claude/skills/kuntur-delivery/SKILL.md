---
name: kuntur-delivery
description: Camino oficial para cambiar, desplegar, revertir o poner en producción Kuntur Autos (código, infraestructura, base de datos, secretos). Úsala antes de tocar .github/, infra/, Dockerfile, migraciones, variables o secretos, o cuando alguien pida desplegar, encender, promover a producción o revertir.
---

# Entrega de Kuntur Autos: el camino correcto

Procedimiento completo: `docs/10-runbook.md`. Esta skill decide el camino; el runbook da los pasos.

## Elige el camino

| Quiero...                     | Camino                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| Cambiar código de la API      | PR a `main` → staging automático (runbook 3)                                          |
| Cambiar infraestructura       | PR → **Infraestructura Azure**, `environment` correcto, `image` **vacío** (runbook 4) |
| Cambiar la base o migraciones | Compatibles hacia atrás; **Base de datos** para comprobar (runbook 5)                 |
| Publicar a producción         | Commit ya verde en staging → **Despliegue a producción** con su SHA (runbook 10)      |
| Revertir                      | Automático primero; a mano con la sección 7 del runbook                               |
| Solo comprobar                | Runbook 1 y 6. No cambia nada                                                         |

## Reglas que no se rompen

1. Nunca trabajes directo en `main`. Siempre rama y PR. Nunca `force push` a `main`.
2. Antes de decir que algo está listo: `pnpm check` completo (incluye `pnpm delivery` y `pnpm workflows`).
3. Producción solo despliega un commit que staging ya aprobó. No se reconstruye: se despliega el mismo digest.
4. Nunca una etiqueta móvil (`:staging`, `:latest`) en la app. Digest siempre.
5. Infraestructura con `image` vacío. Con valor, cambias la versión que corre.
6. Cambiar un secreto no se aplica solo: vuelve a ejecutar Infraestructura Azure del mismo entorno.
7. Staging y producción tienen secretos distintos. Nunca copies `AUTH_SECRET` ni `DATABASE_URL` de uno a otro.
8. No borres grupos de recursos sin confirmación explícita del propietario.
9. Ningún secreto en chat, commits ni documentación.
10. `infra/azure/setup.sh` solo crea lo que falta; no modifica credenciales existentes.

## Si no puedes verificar algo

Di qué no pudiste comprobar (sin acceso a GitHub o a Azure desde tu entorno). No inventes resultados de Actions ni de Azure.

## Al terminar

Actualiza `docs/10-runbook.md` y `docs/06-ci-cd.md` si cambió un flujo, y aplica `kuntur-docs-sync`.
