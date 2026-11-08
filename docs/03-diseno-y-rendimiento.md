# Diseño y rendimiento

## Principios
- Confianza primero: es una compra grande y hay fraude en el mercado. La interfaz debe transmitir verificación, claridad y control.
- Las fotos son el producto. Galería rápida, grande y sin saltos de diseño.
- Móvil primero: gran parte del tráfico en Perú llega desde celulares.
- Accesibilidad WCAG 2.2 AA: contraste, teclado, foco visible, etiquetas.
- Todos los estados diseñados: vacío, cargando, error, éxito.

## Tokens de diseño
En `packages/design-tokens/` como JSON neutral (estructura del estándar W3C de tokens). Se transforman a variables CSS (web), objetos TypeScript (React Native) y, si hiciera falta, Swift/Kotlin.
Categorías: color (con modo claro y oscuro), tipografía, espaciado (múltiplos de 4), radios, sombras, movimiento, puntos de quiebre.

## Dirección visual propuesta (a validar)
Sin marca previa. Propuesta inicial: sobria y confiable, con un color de acento cálido para las acciones principales, tipografía sans-serif legible, mucho espacio y tarjetas con foto dominante. Se presentan 2 o 3 alternativas antes de fijar la marca.

## Presupuesto de rendimiento (falla el CI si se rompe)
| Métrica | Objetivo |
|---|---|
| LCP | menor de 2,5 s |
| INP | menor de 200 ms |
| CLS | menor de 0,1 |
| JavaScript inicial en páginas públicas | lo más bajo posible; medir y fijar un tope en la Fase 0 |
| Respuesta de la API de búsqueda | menor de 200 ms (p95) |

Técnicas: renderizado en servidor o estático en páginas públicas, imágenes AVIF/WebP con tamaños responsivos y carga diferida, fuentes con `font-display`, divisiones de código, caché en el borde, y el visor 3D cargado solo cuando se necesita.

## Configurador (Fase 3)
1. Asistente por pasos (marca, modelo, año, color, estado, presupuesto) con imágenes.
2. Vista previa 3D por tipo de carrocería, cambiando color. Modelos GLB comprimidos con Draco, cargados bajo demanda, con una imagen de respaldo para equipos lentos.
3. Al terminar, se guarda como "búsqueda deseada" y se muestran los autos que cumplen.
Riesgo principal: conseguir modelos 3D con licencia. Se decide en la Fase 2.
