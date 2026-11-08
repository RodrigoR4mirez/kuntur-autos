# Kuntur Autos

Marketplace de autos de segunda mano para todo el Perú. Web (PWA) primero; luego iOS y Android con Expo / React Native.

## Documentación
- [`CLAUDE.md`](CLAUDE.md): reglas del proyecto para Claude Code.
- [`docs/00-decisiones.md`](docs/00-decisiones.md): decisiones tomadas y pendientes.
- [`docs/01-arquitectura.md`](docs/01-arquitectura.md): arquitectura, niveles de acceso, búsqueda y seguridad.
- [`docs/02-roadmap-y-agentes.md`](docs/02-roadmap-y-agentes.md): fases, qué agente y qué modelo usar en cada paso.
- [`docs/03-diseno-y-rendimiento.md`](docs/03-diseno-y-rendimiento.md): diseño, tokens y presupuesto de rendimiento.
- [`docs/05-arquitectura-limpia.md`](docs/05-arquitectura-limpia.md): capas, módulos, patrones y cómo agregar una funcionalidad.
- [`docs/06-ci-cd.md`](docs/06-ci-cd.md): integración y entrega continua, seguridad, despliegue y configuración única.
- [`docs/07-hosting.md`](docs/07-hosting.md): dónde se despliega para pruebas y por qué.
- [`docs/08-api.md`](docs/08-api.md): rutas HTTP, autenticación, niveles de acceso y errores.
- [`docs/04-marca.md`](docs/04-marca.md): marca, colores, tipografía y merchandise.
- [`docs/prompts/00-master-prompt.md`](docs/prompts/00-master-prompt.md): prompt para iniciar cada sesión.

## Estado
**Fase 0 completada** y avance de la Fase 1: arquitectura limpia con módulos, vitrina con niveles de acceso, catálogo, adaptador de PostgreSQL con migraciones, y CI/CD con seguridad y despliegue a staging (pendiente de configurar la cuenta de Azure y de ejecutarse por primera vez en GitHub). También hay sesiones por puerto, publicar y enviar anuncios a revisión (con dueño tomado de la sesión) y niveles de acceso por depósito. Falta de la Fase 1: el proveedor real de autenticación (Better Auth, SMS y DNI), fotos, búsqueda con filtros, moderación y la web con Next.js.

## Cómo trabajar
Requisitos: Node 22 o superior y pnpm 10.

```bash
pnpm install
pnpm check      # typecheck + formato + dependencias + política de flujos + pruebas
pnpm test
pnpm --filter @kuntur/api start
docker compose up --build   # PostgreSQL + API (requiere Docker)
```
