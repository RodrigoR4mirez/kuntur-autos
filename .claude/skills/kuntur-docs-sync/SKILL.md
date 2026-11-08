---
name: kuntur-docs-sync
description: Mantiene la documentación de Kuntur Autos al día. Úsala al terminar cualquier cambio de código, decisión, configuración, marca, flujo o fase: indica qué archivo de docs/ y qué regla de CLAUDE.md hay que actualizar en el mismo commit.
---

# Documentación viva de Kuntur Autos

La documentación en `docs/` es parte del producto: otros proyectos y personas deben poder entenderlo leyéndola. **Un cambio no está terminado hasta que su documento está actualizado, en el mismo commit.**

## Qué actualizar según el cambio

| Si cambiaste...                                                         | Actualiza                                                                                 |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Una decisión de producto, negocio o tecnología                          | `docs/00-decisiones.md` (tabla y pendientes)                                              |
| Niveles de acceso, proceso de compra, búsqueda, seguridad del producto  | `docs/01-arquitectura.md`                                                                 |
| Estructura del código, capas, patrones, reglas de dependencias, pruebas | `docs/05-arquitectura-limpia.md`, `CLAUDE.md`, `scripts/check-boundaries.mjs` y su prueba |
| Flujos de GitHub, Dockerfile, infraestructura, secretos, despliegue     | `docs/06-ci-cd.md`                                                                        |
| Proveedor de hosting o base de datos                                    | `docs/07-hosting.md` y `docs/06-ci-cd.md`                                                 |
| Marca, colores, tipografía, merchandise, tokens                         | `docs/04-marca.md`, `packages/design-tokens/tokens.json` y la guía visual (artefacto)     |
| Una fase completada o nueva                                             | `docs/02-roadmap-y-agentes.md` y el estado en `README.md`                                 |
| Un comando nuevo                                                        | `CLAUDE.md` (Comandos) y `README.md`                                                      |
| Una regla nueva del proyecto                                            | `CLAUDE.md` y la skill que corresponda en `.claude/skills/`                               |

## Cómo

1. Cambia el documento con el mismo detalle que ya tiene: tablas, comandos exactos, sin frases vagas.
2. Marca con claridad lo que **no pudiste verificar**. No escribas "funciona" si no lo probaste.
3. No dejes cifras que cambian (número de pruebas, versiones) en prosa si puedes evitarlo; si las pones, actualízalas.
4. Si el dueño del proyecto da una indicación nueva ("siempre haz X"), conviértela en regla de `CLAUDE.md` o en una skill; no la dejes solo en la conversación.
5. Termina con `pnpm check` y menciona en el commit qué documentos tocaste.
