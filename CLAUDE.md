# Kuntur Autos — reglas del proyecto

Marketplace de autos de segunda mano (y nuevos) para todo el Perú. Web primero (PWA), luego iOS/Android con Expo/React Native. El diseño debe soportar después otras verticales (alquiler y venta de departamentos) sin reescribir el núcleo.

Lee primero: `docs/00-decisiones.md` (decisiones tomadas), `docs/01-arquitectura.md` (producto), `docs/05-arquitectura-limpia.md` (capas, módulos y cómo agregar una funcionalidad) `docs/06-ci-cd.md` (integración y despliegue), `docs/08-api.md` (rutas y errores de la API), `docs/09-autenticacion.md` (inicio de sesión y variables de entorno) y `docs/10-runbook.md` (procedimiento oficial de entrega).

## Reglas innegociables
1. **Independencia tecnológica.** Ninguna librería, framework, base de datos o proveedor externo se importa desde `packages/core`. El núcleo solo define *puertos* (interfaces); los proveedores viven en `packages/adapters/*`.
2. **`packages/core` es TypeScript puro.** Sin React, sin Node-específico, sin ORM. Debe poder ejecutarse en servidor, web y móvil.
3. **Contratos primero.** Toda entrada/salida entre capas se valida con esquemas en `packages/contracts`. Los tipos se derivan de los esquemas.
4. **Genérico por vertical.** Un anuncio es un `Listing` con una extensión por vertical (`VehicleDetails` hoy, `PropertyDetails` mañana). No pongas campos de autos en `Listing`.
5. **Privacidad por nivel de acceso.** Los campos visibles dependen del nivel (anónimo, registrado, depósito pagado, compra cerrada). Se aplica en el servidor, nunca solo en la UI.
6. **Rendimiento como requisito.** LCP < 2,5 s, INP < 200 ms, CLS < 0,1. Un build que rompa el presupuesto falla en CI.
7. **Sin secretos en el repositorio.** Variables de entorno; `.env.example` sin valores reales.
8. **Cada cambio lleva pruebas.** Núcleo con pruebas unitarias; adaptadores con pruebas de contrato; flujos críticos con Playwright.

## Arquitectura en una línea
Dominio (funciones puras) ← aplicación (casos de uso y puertos) ← adaptadores e interfaz. Las dependencias apuntan hacia adentro. Los módulos se usan entre sí solo por su `index.ts`. Los errores esperados son `Result`, no excepciones. Solo `composition-root.ts` conoce adaptadores concretos.

## Documentación viva (obligatoria)
Un cambio no está terminado hasta que su documentación en `docs/` está actualizada, en el mismo commit. Usa la skill `kuntur-docs-sync` para saber qué archivo tocar. Toda indicación nueva del dueño del proyecto ("siempre haz X") se convierte en una regla de este archivo o en una skill de `.claude/skills/`. Marca siempre lo que no pudiste verificar.

## Skills del proyecto (`.claude/skills/`)
- `kuntur-delivery`: **obligatoria** antes de tocar `.github/`, `infra/`, Docker, migraciones, secretos o desplegar. Define el camino seguro.
- `kuntur-azure-infra`: mapa de Azure, consultas de solo lectura y diagnóstico.
- `kuntur-architecture`: al crear o cambiar código (capas, módulos, puertos, adaptadores, rutas).
- `kuntur-ci-cd`: detalle de los flujos de GitHub, Docker y dependencias.
- `kuntur-docs-sync`: al terminar cualquier cambio, para actualizar los documentos correctos.

## Procedimiento oficial de entrega
Cualquier cambio de despliegue, infraestructura o base de datos sigue `docs/10-runbook.md`. No hay otro camino válido. Antes de dar algo por listo: `pnpm check` (incluye `pnpm delivery`).

## CI/CD en una línea
Todo cambio pasa por CI y seguridad antes de `main`; `main` publica una imagen escaneada y la despliega a staging con migración, prueba de humo y reversión. Acciones fijadas por SHA, Azure por OIDC, sin secretos guardados. Detalle en `docs/06-ci-cd.md`.

## Comandos
- `pnpm check`: typecheck, formato, regla de dependencias y pruebas. Debe pasar antes de cada commit.
- `pnpm boundaries`: verifica que `core` no importe nada externo y el orden apps → adapters → contracts → core.
- `pnpm delivery`: verifica que Dockerfile, documentación, parámetros de Bicep y versión de la imagen sean coherentes.
- `pnpm workflows`: verifica la política de seguridad de los flujos de GitHub (SHA, permisos, timeouts, sin inyección).
- `pnpm test:coverage`: pruebas con umbral de cobertura del núcleo (90 % líneas, 85 % ramas).
- `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:check`: migraciones, catálogo inicial y comprobación de la conexión (requieren `DATABASE_URL`).
- `node scripts/pin-action.mjs owner/repo`: SHA de la última versión estable de una acción.
- `pnpm tokens`: regenera `packages/design-tokens/tokens.css`.
- Los paquetes se consumen como TypeScript fuente (sin paso de build); la API corre con `node src/main.ts`. Los imports llevan extensión `.ts`. No uses sintaxis de TypeScript que no se pueda borrar (enums, parameter properties, namespaces): Node ejecuta el código sin compilar y `erasableSyntaxOnly` lo verifica.

## Flujo por funcionalidad
Plan → implementar → pruebas → `/simplify` → `/code-review` → `/security-review` → revisión humana.

## Convenciones
- Idioma de la interfaz: español (Perú). Código y commits en inglés. Documentación en español.
- Moneda: PEN y USD, guardadas en la unidad menor (céntimos) como enteros.
- Fechas en UTC en base de datos; se muestran en hora de Lima.
- Un puerto = un archivo en `packages/core/src/ports/`.
