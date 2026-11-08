# Roadmap, agentes y modelos

Modelos: **Opus 5.5** (`claude-opus-5-5`) para arquitectura, seguridad y revisión final. **Sonnet 5.5** (`claude-sonnet-5-5`) para implementación diaria. **Haiku 5.5** (`claude-haiku-5-5`) para búsquedas rápidas, documentación y cambios pequeños.

## Fase 0 — Cimientos
| Paso | Agente / skill | Modelo |
|---|---|---|
| Confirmar decisiones pendientes y nombre | Modo plan | Opus |
| Crear `CLAUDE.md` con reglas (ya hay una versión) | `/init` | Sonnet |
| Monorepo, TypeScript, linter, formato, Docker, CI | general-purpose | Sonnet |
| Puertos del núcleo y modelo de dominio | Plan, luego general-purpose | Opus, luego Sonnet |
| Esquemas de `contracts` | general-purpose | Sonnet |
| Presupuesto de rendimiento en CI (Lighthouse) | general-purpose | Sonnet |

## Fase 1 — Búsqueda, registro, publicar y ficha
| Paso | Agente / skill | Modelo |
|---|---|---|
| Dirección visual y tokens de diseño | artifact-design + general-purpose | Opus (marca), Sonnet (tokens) |
| Componentes base (botón, campo, tarjeta de auto) | general-purpose | Sonnet |
| Catálogo (marcas, modelos, versiones) y datos semilla | general-purpose | Sonnet |
| Esquema de base de datos, migraciones e índices | Plan, luego general-purpose | Opus, luego Sonnet |
| Registro, sesión, Google, SMS, DNI | general-purpose | Sonnet |
| Publicar anuncio (fotos, ficha, placa, documentos) | general-purpose | Sonnet |
| Búsqueda con filtros y niveles de acceso | general-purpose | Sonnet |
| Moderación y panel de administración | general-purpose | Sonnet |
| Pruebas end-to-end | general-purpose + Playwright | Sonnet |
| Revisión por funcionalidad | `/simplify`, `/code-review`, `/security-review` | Opus para seguridad |
| Prueba de carga de la búsqueda | general-purpose | Sonnet |

## Fase 2 — Depósito y entrevista
| Paso | Agente / skill | Modelo |
|---|---|---|
| Máquina de estados del proceso de compra | Plan, luego general-purpose | Opus, luego Sonnet |
| Adaptador Culqi, webhooks e idempotencia | general-purpose | Sonnet |
| Agenda con asesores | general-purpose | Sonnet |
| Avisos por correo, SMS, WhatsApp y push | general-purpose | Sonnet |
| Revisión de seguridad de pagos | `/security-review` | Opus |
| Reglas de depósito configurables en el panel | general-purpose | Sonnet |

## Fase 3 — Configurador
| Paso | Agente / skill | Modelo |
|---|---|---|
| Asistente por pasos con imágenes | general-purpose | Sonnet |
| Motor de match (filtros obligatorios y deseables) | Plan, luego general-purpose | Opus, luego Sonnet |
| Visor 3D (React Three Fiber, modelos GLB con Draco) | general-purpose | Sonnet |
| Medición de rendimiento en móviles | Playwright | Sonnet |

## Fase 4 — Móvil
| Paso | Agente / skill | Modelo |
|---|---|---|
| Decidir qué se comparte con la web | Plan | Opus |
| App Expo | general-purpose + `react-native-best-practices` | Sonnet |
| Diseño iOS nativo | `mobile-app-design` | Sonnet |
| Pruebas en dispositivos reales | Kobiton u otro (requiere cuenta) | — |
| Publicación en App Store y Google Play | Tú, con cuentas de desarrollador | — |

## Fase 5 — Nueva vertical (departamentos)
Explore para medir qué del código es específico de autos, Plan para el diseño de `PropertyDetails`, general-purpose para implementarlo sin tocar `Listing`.

## Estado de herramientas en esta sesión
- Los plugins `figma-to-code` y `mobile-app-design` (UXKIN) fallaron al conectar sus servidores MCP (error de proxy 403). Los skills sí están disponibles; los servidores externos hay que reintentarlos o permitir sus hosts en el entorno.
