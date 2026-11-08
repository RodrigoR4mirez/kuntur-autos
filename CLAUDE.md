# Kuntur Autos — reglas del proyecto

Marketplace de autos de segunda mano (y nuevos) para todo el Perú. Web primero (PWA), luego iOS/Android con Expo/React Native. El diseño debe soportar después otras verticales (alquiler y venta de departamentos) sin reescribir el núcleo.

Lee primero: `docs/00-decisiones.md` (decisiones tomadas) y `docs/01-arquitectura.md`.

## Reglas innegociables
1. **Independencia tecnológica.** Ninguna librería, framework, base de datos o proveedor externo se importa desde `packages/core`. El núcleo solo define *puertos* (interfaces); los proveedores viven en `packages/adapters/*`.
2. **`packages/core` es TypeScript puro.** Sin React, sin Node-específico, sin ORM. Debe poder ejecutarse en servidor, web y móvil.
3. **Contratos primero.** Toda entrada/salida entre capas se valida con esquemas en `packages/contracts`. Los tipos se derivan de los esquemas.
4. **Genérico por vertical.** Un anuncio es un `Listing` con una extensión por vertical (`VehicleDetails` hoy, `PropertyDetails` mañana). No pongas campos de autos en `Listing`.
5. **Privacidad por nivel de acceso.** Los campos visibles dependen del nivel (anónimo, registrado, depósito pagado, compra cerrada). Se aplica en el servidor, nunca solo en la UI.
6. **Rendimiento como requisito.** LCP < 2,5 s, INP < 200 ms, CLS < 0,1. Un build que rompa el presupuesto falla en CI.
7. **Sin secretos en el repositorio.** Variables de entorno; `.env.example` sin valores reales.
8. **Cada cambio lleva pruebas.** Núcleo con pruebas unitarias; adaptadores con pruebas de contrato; flujos críticos con Playwright.

## Comandos
- `pnpm check`: typecheck, formato, regla de dependencias y pruebas. Debe pasar antes de cada commit.
- `pnpm boundaries`: verifica que `core` no importe nada externo y el orden apps → adapters → contracts → core.
- `pnpm tokens`: regenera `packages/design-tokens/tokens.css`.
- Los paquetes se consumen como TypeScript fuente (sin paso de build); la API corre con `node src/main.ts`. Los imports llevan extensión `.ts`.

## Flujo por funcionalidad
Plan → implementar → pruebas → `/simplify` → `/code-review` → `/security-review` → revisión humana.

## Convenciones
- Idioma de la interfaz: español (Perú). Código y commits en inglés. Documentación en español.
- Moneda: PEN y USD, guardadas en la unidad menor (céntimos) como enteros.
- Fechas en UTC en base de datos; se muestran en hora de Lima.
- Un puerto = un archivo en `packages/core/src/ports/`.
