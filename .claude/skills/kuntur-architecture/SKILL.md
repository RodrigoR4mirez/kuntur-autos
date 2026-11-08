---
name: kuntur-architecture
description: Reglas de arquitectura limpia de Kuntur Autos. Úsala al crear o modificar código en packages/core, packages/contracts, packages/adapters o apps/*: agregar una funcionalidad, un caso de uso, un puerto, un adaptador, una ruta HTTP o un módulo.
---

# Arquitectura limpia de Kuntur Autos

Lee primero `docs/05-arquitectura-limpia.md` (capas, mapa del código, patrones y lista de pasos).

## Reglas

- Las dependencias apuntan hacia adentro: dominio ← aplicación ← adaptadores e interfaz.
- `packages/core` no importa nada externo. Un módulo usa a otro **solo por su `index.ts`**. `domain` no importa `application`.
- Solo `composition-root.ts` conoce adaptadores concretos.
- Errores esperados: `Result`, no excepciones. Casos de uso: función que recibe dependencias y devuelve una función.
- Sin sintaxis de TypeScript que no se pueda borrar (enums, parameter properties): Node corre el código sin compilar.
- La visibilidad por nivel de acceso se decide en el servidor (`projectVehicleListing`) y la API responde con lista blanca de campos.

## Pasos para agregar una funcionalidad

1. Regla en `domain/` como función pura, con pruebas primero.
2. Puerto nuevo o ampliado en `application/ports/`.
3. Caso de uso en `application/`, probado con implementaciones en memoria (`@kuntur/core/in-memory`).
4. Exportar lo público desde el `index.ts` del módulo.
5. Si pasa por HTTP: esquema en `packages/contracts` y ruta delgada en `apps/api/src/interface/http`.
6. Si usa un proveedor real: adaptador en `packages/adapters/<nombre>`, **suite de contrato compartida** (`packages/contract-tests`) y conexión en `composition-root.ts`.
7. Ejecutar `pnpm check`.

## Antes de terminar

Si cambiaste una regla, un patrón o la estructura: actualiza `docs/05-arquitectura-limpia.md`, `CLAUDE.md` y, si aplica, `scripts/check-boundaries.mjs` con su prueba. Usa la skill `kuntur-docs-sync`.
