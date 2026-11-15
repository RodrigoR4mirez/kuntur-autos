# Marca: Kuntur Autos

Estado: **borrador v1**. El logotipo, los colores y la tipografía son una propuesta de trabajo. Antes de imprimir merchandise o registrar la marca, un diseñador gráfico debe afinar el logotipo, y hay que consultar el registro de INDECOPI y el dominio. La búsqueda web no encontró negocios de autos con este nombre en Perú, pero eso no prueba que esté libre.

Guía visual (privada, solo tu cuenta puede abrirla): https://claude.ai/artifact/FgpP7dASQzzvK8w8XemFvk

## Idea
*Kuntur* es el cóndor en quechua. Es un ave que ve de lejos, vuela alto y se asocia con los Andes. Para un marketplace de autos, comunica **visión clara antes de comprar**: ver el historial real del auto desde arriba, sin sorpresas.

## Posicionamiento
"El auto con historial claro." Kuntur Autos no solo publica anuncios: verifica la placa y presenta el auto con un asesor propio. La promesa es confianza, en un mercado donde se reporta que el 40% de las transferencias tiene alguna irregularidad.

## Voz
Clara, directa, cercana, sin jerga financiera. Tuteo respetuoso. Dice lo que pasa y qué sigue. Ejemplos:
- Botón: "Agendar visita", no "Proceder con la reserva".
- Error: "No pudimos verificar la placa. Revisa que tenga 6 caracteres e inténtalo de nuevo."
- Depósito: "Pagas S/ 10 para reservar tu visita. Te los devolvemos cuando asistas."

## Logotipo
`brand/logo/kuntur-mark.svg`. Una **K** formada por un fuste vertical y tres plumas de ala que se abren hacia arriba (el cóndor), con una pata dorada abajo que evoca una carretera. Reglas:
- Área de respeto: la mitad del ancho del fuste en todos los lados.
- Tamaño mínimo: 24 px en pantalla.
- Versión en un solo color para sellos, grabado y bordado.
- No deformar, no girar, no cambiar los colores de las plumas.

## Color
| Rol | Nombre | Hex | Uso |
|---|---|---|---|
| Texto, fondo oscuro | Noche Andina | `#0D1B2A` | Texto principal, modo oscuro |
| Primario | Cielo Kuntur | `#1F4FD8` | Enlaces, selección, acciones secundarias |
| Primario sobre oscuro | Cielo claro | `#7FA2FF` | Primario en modo oscuro |
| Acción principal | Rocoto | `#BF3417` | Botones principales (CTA) |
| Verificado / destacado | Oro Inca | `#E0A82E` | Sello "Verificado por Kuntur", anuncios destacados |
| Fondo | Fondo | `#F4F6FA` | Fondo claro con matiz azul |
| Éxito / alerta / error | Semánticos | `#17784A` / `#F2B33D` / `#B3261E` | Estados |

Contrastes calculados (WCAG): blanco sobre Cielo 6,63; blanco sobre Rocoto 5,65; Noche sobre Oro 8,13; Noche sobre Fondo 16,08; Rocoto sobre Fondo 5,22. Todos superan 4,5 (nivel AA).
El rojo Rocoto reemplaza al rojo de la bandera para no confundirlo con símbolos patrios.

## Tipografía
- **Bricolage Grotesque**: títulos. Carácter propio sin perder legibilidad.
- **Figtree**: texto y formularios. Amplia y legible en pantallas pequeñas.
- **JetBrains Mono**: placas, precios y datos en columnas.
Las tres están en Google Fonts. La web debe servirlas con `font-display: swap` y solo los pesos en uso.

## Recurso visual propio: la placa
La **placa** (por ejemplo `KNT-482`) es el elemento gráfico de la marca. Aparece en las tarjetas de auto, en el sello de verificación y en el merchandise. Se escribe en JetBrains Mono sobre fondo blanco con borde Noche Andina.

## Sello "Verificado por Kuntur"
Insignia dorada que solo aparece si el auto pasó: consulta de placa con proveedor autorizado, documentos revisados por el equipo y visita del asesor. Si falta uno, no se muestra.

## Merchandise (propuesta)
| Pieza | Para quién | Diseño |
|---|---|---|
| Polo y chaleco del asesor | Equipo | Noche Andina, marca bordada en el pecho, placa en la manga |
| Credencial con cordón | Asesor | Foto, nombre y código QR que el cliente escanea para verificar al asesor |
| Gorra | Equipo y clientes | Noche Andina con la K en un solo color |
| Calco para parabrisas "Verificado por Kuntur" | Autos vendidos | Placa dorada sobre fondo transparente |
| Marco de placa | Autos vendidos | Negro con la marca en el borde inferior |
| Tarjeta de presentación | Asesores | Una cara con la K y otra con la placa del asesor |
| Llavero con forma de placa | Cliente que compra | Metal con "KNT" grabado y la fecha de entrega |
| Taza y bolsa de tela | Promoción | La K grande, un solo color |
| Carpeta de entrega | Compra cerrada | Contiene documentos, el informe de historial y la llave |

Producir primero lo que genera confianza en la visita: credencial, polo, calco y llavero.

## Diseño de paneles (2026-11-15, segunda versión)
Referencia dada por el dueño: interfaz clara con paneles redondeados, **negro fuerte**, barra lateral de iconos, pestañas en píldora, un panel grande con el auto y datos flotando encima, y un panel derecho de acciones. Adaptación a la marca:
- **Tokens nuevos** (`tokens.json`): `Negro Cóndor` `#070B11` (barra activa, botones oscuros, tarjeta del sello), `hielo` `#ECEEF2` (fondo de página) y `panel` `#D9DDE4` (panel gris del auto), más `radius-xl` 28 px. El lima de la referencia se sustituye por **Oro Inca** (iconos, sello, botón "Ingresar").
- **Rocoto** queda solo para el botón principal ("Vender mi auto"). Cielo Kuntur ya no domina la interfaz.
- **Tema claro forzado** (`data-theme="light"` en `layout.tsx`) para ser fiel a la referencia. Los tokens oscuros siguen definidos pero la web no los usa.
- **Estructura:** logo y barra superior (pestañas, ubicación, cuenta), barra lateral de iconos (en móvil pasa a barra inferior), tablero de paneles. Puntos de quiebre: 40 rem y 64 rem.
- **Ilustración del auto** (`car-art.tsx`): es **provisional**, dibujada para el proyecto; no es una foto de un anuncio. Se reemplaza al existir la subida de fotos. Hay que usar fotos propias o con licencia (no la imagen de referencia).

## Ficha del auto: sala de exhibición (2026-11-15)
Referencia del dueño: el auto al centro sobre una plataforma, tarjetas de cristal alrededor (kilometraje, año, motor, etc.) y un panel negro de reserva. `apps/web/src/components/showroom.tsx` + `showroom.css`; los datos se preparan en `lib/showroom.ts` (funciones puras con pruebas).
- **Escritorio:** tarjetas a izquierda y derecha del auto, historial (SOAT, revisión, mantenimiento, gravámenes, choques, llave) abajo, placa y reserva a la derecha. **Tablet y móvil:** el auto arriba y las tarjetas en cuadrícula.
- **Botón "Ver auto en detalle":** oculta las tarjetas (`visibility`, sin cambiar el tamaño de nada, para no generar salto de diseño) y acerca el auto. `aria-pressed` indica el estado.
- **Privacidad:** el servidor decide qué campos envía. Lo que el visitante no puede ver sale como "Ingresa para ver" con candado; la placa sale enmascarada hasta reservar la visita.
- **Honestidad:** SOAT, gravámenes, choques y dueños los declara el vendedor y los revisa un asesor; la ficha lo dice. El botón "Reservar visita" está **deshabilitado** hasta que exista el depósito.
- La ilustración del auto sigue siendo provisional (no hay fotos aún).

## Aplicación en la web (rediseño 2026-11-15, primera versión)
La landing (`apps/web/src/app/page.tsx`, estilos en `home.css`) aplica la marca así: fondo Noche Andina (claro u oscuro según el sistema), **Rocoto solo para el botón principal** ("Vender mi auto"), **Oro Inca solo para el sello** y la palabra clave del título, Cielo Kuntur en los números de los pasos y el degradado de la banda final. La **placa** es el centro de la ficha de ejemplo (JetBrains Mono, fondo blanco, borde Noche). Títulos en Bricolage Grotesque y texto en Figtree. La ficha del hero está rotulada "Ejemplo de ficha": no es un anuncio real. `apps/web/src/design.test.ts` verifica el contraste AA (claro y oscuro) de los pares de color usados y reglas básicas del CSS.

## Accesibilidad
Los tokens cumplen contraste AA. Los botones usan texto en negrita y tamaño mínimo de 44 px de alto en móvil. Nunca se usa el color como único indicador de estado.

## Archivos
- `brand/logo/kuntur-mark.svg`: logotipo.
- `packages/design-tokens/tokens.json`: fuente de verdad.
- `packages/design-tokens/tokens.css`: generado con `node build.mjs`.
