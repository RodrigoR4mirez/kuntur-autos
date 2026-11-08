# Kuntur Autos

Marketplace de autos de segunda mano para todo el Perú. Web (PWA) primero; luego iOS y Android con Expo / React Native.

## Documentación
- [`CLAUDE.md`](CLAUDE.md): reglas del proyecto para Claude Code.
- [`docs/00-decisiones.md`](docs/00-decisiones.md): decisiones tomadas y pendientes.
- [`docs/01-arquitectura.md`](docs/01-arquitectura.md): arquitectura, niveles de acceso, búsqueda y seguridad.
- [`docs/02-roadmap-y-agentes.md`](docs/02-roadmap-y-agentes.md): fases, qué agente y qué modelo usar en cada paso.
- [`docs/03-diseno-y-rendimiento.md`](docs/03-diseno-y-rendimiento.md): diseño, tokens y presupuesto de rendimiento.
- [`docs/05-arquitectura-limpia.md`](docs/05-arquitectura-limpia.md): capas, módulos, patrones y cómo agregar una funcionalidad.
- [`docs/04-marca.md`](docs/04-marca.md): marca, colores, tipografía y merchandise.
- [`docs/prompts/00-master-prompt.md`](docs/prompts/00-master-prompt.md): prompt para iniciar cada sesión.

## Estado
**Fase 0 completada** y **arquitectura limpia lista** con una funcionalidad completa de punta a punta: `GET /listings/:id` (vitrina con niveles de acceso). Núcleo modular, API con Fastify, regla de dependencias verificada por script, 53 pruebas, Dockerfile, `compose.yaml` y CI. Falta el resto de la Fase 1: PostgreSQL, catálogo, autenticación y la web.

## Cómo trabajar
Requisitos: Node 22 o superior y pnpm 10.

```bash
pnpm install
pnpm check      # typecheck + formato + regla de dependencias + pruebas
pnpm test
pnpm --filter @kuntur/api start
docker compose up --build   # PostgreSQL + API (requiere Docker)
```
