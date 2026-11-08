---
name: kuntur-ci-cd
description: Integración y entrega continua de Kuntur Autos. Úsala al tocar .github/, apps/api/Dockerfile, compose.yaml, infra/, dependencias, secretos o cualquier despliegue; también al agregar una acción de GitHub o cambiar de proveedor de hosting.
---

# CI/CD de Kuntur Autos

Antes que nada lee `docs/10-runbook.md` y la skill `kuntur-delivery`: definen el camino oficial. Después lee `docs/06-ci-cd.md` (flujos, controles, configuración única, qué está verificado) y `docs/07-hosting.md` (por qué Azure Container Apps + Neon).

## Reglas

- Toda acción externa se fija por **SHA de commit** con la versión en un comentario. Obtén el SHA con `node scripts/pin-action.mjs owner/repo` y lee su `action.yml` en ese SHA antes de usar sus entradas.
- Cada flujo declara `permissions` al nivel superior y cada job tiene `timeout-minutes`.
- Nunca pongas `${{ }}` dentro de `run`: pásalo por `env`.
- `actions/checkout` siempre con `persist-credentials: false`.
- Nada de secretos en el repositorio ni en variables en claro. Azure se autentica con OIDC. `DATABASE_URL` vive como secreto del entorno `staging`.
- Las migraciones deben ser compatibles hacia atrás: se aplican **antes** de desplegar y no se revierten solas.
- Se despliega siempre una imagen por digest (`nombre@sha256:...`).
- Las pruebas destructivas de base de datos solo corren contra `localhost`.

## Verificación obligatoria antes de commit

1. `pnpm check` (incluye `pnpm workflows`, que impone las reglas de arriba, y `pnpm delivery`, que verifica la coherencia del Dockerfile, la documentación, Bicep y la versión de la imagen).
2. Valida los YAML nuevos contra el esquema oficial de GitHub Actions (el de SchemaStore) si cambió su estructura.
3. Si cambió el Dockerfile y no hay Docker, simula sus pasos y dilo; no digas que la imagen se construyó.

## Honestidad

Anota en `docs/06-ci-cd.md`, sección "Qué está verificado y qué no", todo lo que no pudiste comprobar. Los flujos no se ven corriendo hasta su primera ejecución en GitHub.

## Antes de terminar

Actualiza `docs/06-ci-cd.md` (y `docs/07-hosting.md` si cambia el proveedor) en el mismo commit. Usa la skill `kuntur-docs-sync`.
