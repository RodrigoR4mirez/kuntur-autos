---
name: kuntur-delivery
description: Camino oficial y seguro para cualquier cambio de código, infraestructura, base de datos, secretos o despliegue de Kuntur Autos. Úsala SIEMPRE antes de tocar .github/, infra/, apps/api/Dockerfile, migraciones, variables o secretos, o cuando alguien pida "desplegar", "cambiar Azure", "revertir" o "encender la API".
---

# Entrega continua de Kuntur Autos: el camino seguro

Lee `docs/10-runbook.md`. Es el procedimiento oficial; esta skill te dice qué camino tomar.

## Decide primero qué tipo de cambio es

| Quiero...                                                     | Camino                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Cambiar código de la API                                      | Runbook, sección 3 (PR → `main` → despliegue automático)                 |
| Cambiar infraestructura (Bicep, recursos, secretos de la app) | Runbook, sección 4 (PR → Infraestructura Azure, campo `image` **vacío**) |
| Cambiar la base o sus migraciones                             | Runbook, sección 5                                                       |
| Revertir algo que falló                                       | Runbook, sección 7 (primero la reversión automática; luego a mano)       |
| Solo comprobar que todo está bien                             | Runbook, secciones 1 y 6 (no cambia nada)                                |

## Reglas que no se rompen

1. Nunca trabajes directo en `main`. Siempre rama y pull request.
2. Antes de decir que algo está listo: `pnpm check`. Debe pasar entero, incluido `pnpm delivery`.
3. No cambies la imagen de la app a una etiqueta móvil. Si necesitas una versión concreta, usa el digest (`nombre@sha256:...`).
4. Infraestructura: el campo `image` del flujo **vacío**. Si lo llenas, cambias la versión que corre.
5. Cambiar un secreto de la app exige volver a ejecutar **Infraestructura Azure** después.
6. Nunca borres `rg-kuntur-staging` sin confirmación explícita del propietario.
7. Nunca pegues secretos en el chat, en commits ni en documentación.
8. No ejecutes `infra/azure/setup.sh` sobre un entorno existente para "arreglar" algo: solo crea lo que falta y no modifica una credencial que ya existe.

## Antes de dar algo por hecho

- Actualiza `docs/10-runbook.md`, `docs/06-ci-cd.md` y la skill que corresponda (`kuntur-docs-sync`), en el mismo cambio.
- Separa en tu respuesta lo **verificado** (con comando o prueba que lo demuestre) de lo **no verificado**.
- Si no tienes acceso a GitHub o a Azure desde tu entorno, dilo: no inventes resultados de Actions ni de Azure.

## Si el usuario pide algo que va contra estas reglas

Explica el riesgo en una frase y propón el camino seguro del runbook. Pregunta antes de hacer algo irreversible.
