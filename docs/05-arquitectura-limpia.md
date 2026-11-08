# Arquitectura limpia: cómo está organizado el código

Objetivo: que el código se entienda rápido, se pueda cambiar una pieza sin romper las demás y cada regla de negocio se pruebe sin base de datos, sin servidor y sin internet.

## Decisiones técnicas (2026-11-08)

| Pieza | Elección | Dónde vive |
|---|---|---|
| Web | Next.js | `apps/web` (pendiente) |
| API HTTP | Fastify | `apps/api` |
| Base de datos | PostgreSQL con Drizzle ORM | `packages/adapters/db-postgres` (hecho: esquema, migración, repositorios, catálogo inicial) |
| Sesiones | Librería de autenticación en nuestro servidor (por ejemplo Better Auth) | `packages/adapters/auth` (pendiente) |
| Validación | Zod | `packages/contracts` |
| Pruebas | Vitest | junto al código |

Ninguna de estas elecciones aparece dentro del negocio. Cada una se puede reemplazar escribiendo un adaptador nuevo.

## Las capas y la regla única

```
 interfaz (HTTP, web, móvil)   →   aplicación (casos de uso)   →   dominio (reglas)
          ↑                                  ↓
   composition root  ←——  adaptadores (PostgreSQL, Culqi, SMS...) implementan los puertos
```

La regla: **las dependencias apuntan hacia adentro**. El dominio no sabe que existe la aplicación; la aplicación no sabe que existe HTTP ni PostgreSQL. Lo de afuera conoce lo de adentro, nunca al revés.

| Capa | Qué contiene | Qué NO puede hacer |
|---|---|---|
| **Dominio** (`modules/<m>/domain`) | Entidades, reglas e invariantes como funciones puras. Devuelven `Result`. | Leer o escribir datos, usar fechas del sistema, importar nada externo |
| **Aplicación** (`modules/<m>/application`) | Casos de uso: orquestan el dominio a través de puertos. Definen los puertos (`application/ports`). | Saber de HTTP, SQL o proveedores concretos |
| **Adaptadores** (`packages/adapters/*`) | Implementan los puertos: PostgreSQL, Culqi, proveedor de SMS | Contener reglas de negocio |
| **Interfaz** (`apps/*/src/interface`) | Controladores delgados: validan entrada, llaman un caso de uso, traducen el resultado | Decidir reglas de negocio |
| **Composition root** (`apps/*/src/composition-root.ts`) | Único archivo que elige adaptadores concretos y los conecta con los casos de uso | Nada más |

## Mapa del repositorio

```
packages/core/src/
  shared/                  núcleo compartido: ids, dinero, Result, puertos comunes (reloj, ids, avisos, archivos)
  modules/
    catalog/               catálogo cerrado: marcas, modelos, carrocerías, colores
    listings/              anuncios: ciclo de vida, vehículo, crear borrador, enviar a revisión
    storefront/            vitrina: qué ve cada visitante según su nivel de acceso y cómo se calcula (determineAccessLevel)
    accounts/              usuarios, sesión y su puerto SessionResolver, verificación de identidad (puertos)
    appointments/          citas con el asesor (modelo y puerto)
    payments/              pasarela de pagos (puerto)
    search/                búsqueda y match (puerto)
    vehicle-history/       historial por placa (puerto)
      <módulo>/domain/        reglas puras
      <módulo>/application/   casos de uso y ports/
      <módulo>/index.ts       API pública del módulo
  in-memory/               implementaciones en memoria y datos de ejemplo (pruebas y desarrollo local)
packages/contracts/        esquemas Zod de entrada y salida
packages/adapters/         un paquete por proveedor: system (reloj, UUID), db-postgres (PostgreSQL con Drizzle); luego auth, payments-culqi...
packages/contract-tests/   suites de contrato: cualquier implementación de un puerto debe pasarlas
apps/api/src/
  interface/http/          rutas, presentadores, errores
  app.ts                   arma Fastify con los casos de uso
  composition-root.ts      elige adaptadores: PostgreSQL si hay DATABASE_URL; memoria solo en desarrollo; en producción exige la base
  main.ts                  arranque
```

## Reglas que verifica `pnpm boundaries`

1. `core` no importa nada externo, solo rutas relativas.
2. `shared` no depende de ningún módulo.
3. Un módulo usa a otro **solo por su `index.ts`**, nunca por archivos internos.
4. `domain` no depende de `application`.
5. `contracts` solo depende de `core`.
6. Solo las apps dependen de adaptadores, y dentro de una app solo `composition-root.ts`.
7. `core` no tiene dependencias en su `package.json`.

Si una regla se rompe, el comando falla con el archivo y el motivo, y el CI no deja fusionar.

## Patrones que se repiten (aprende uno, entiendes todos)

**Caso de uso = una función que recibe dependencias y devuelve una función.**
```ts
export function submitListingForReview(deps) {
  return async ({ listingId, requesterId }) => { /* ... */ };
}
```
Se construye en un lugar y se llama en otro. En las pruebas se le pasan repositorios en memoria.

**Errores esperados = `Result`, no excepciones.**
```ts
const r = await submit({ listingId, requesterId });
if (!r.ok) r.error.code; // 'listing_not_found' | 'not_owner' | 'invalid_transition'
```
Las excepciones quedan para fallos inesperados. La interfaz traduce cada código a su respuesta HTTP.

**Puerto = una interfaz pequeña que pertenece a quien la usa.** `ListingRepository` está en `listings/application/ports`. El adaptador de PostgreSQL la implementa, pero no la define.

**Privacidad en el dominio.** `projectVehicleListing` decide qué campos ve cada nivel de acceso. Es una función pura probada nivel por nivel, y la API además publica solo una lista blanca de campos.

## Cómo agregar una funcionalidad (lista de pasos)

1. Escribe la regla en `domain/` como función pura. Escribe sus pruebas primero.
2. Si necesita datos o un proveedor, define o amplía un puerto en `application/ports/`.
3. Escribe el caso de uso en `application/` y pruébalo con las implementaciones en memoria.
4. Exporta lo público desde el `index.ts` del módulo.
5. Si entra o sale por HTTP, agrega el esquema en `contracts` y una ruta delgada en `interface/http`.
6. Si usa un proveedor real, escribe el adaptador en `packages/adapters/<nombre>` y conéctalo en `composition-root.ts`.
7. Corre `pnpm check`.

## Cómo se prueba

| Nivel | Qué prueba | Cómo | Velocidad |
|---|---|---|---|
| Dominio | Reglas e invariantes | Funciones puras, sin dobles | milisegundos |
| Casos de uso | Flujos y errores | Repositorios en memoria, reloj fijo, ids secuenciales | milisegundos |
| HTTP | Códigos de respuesta, forma del JSON, que no se filtre el dueño | `app.inject` de Fastify, sin abrir puertos | milisegundos |
| Adaptadores | Que cumplan el puerto | **Suites de contrato** compartidas (`packages/contract-tests`) contra memoria, PostgreSQL en memoria (PGlite) y un PostgreSQL real si hay `DATABASE_URL` (CI). Las pruebas destructivas solo aceptan `localhost` | segundos |
| Flujos críticos | Registro, publicación, depósito | Playwright (Fase 2) | segundos |

Las pruebas del dominio, los casos de uso, la API y las suites de contrato con PGlite corren en menos de un segundo, sin Docker. El núcleo se mide con umbral de cobertura (90 % líneas, 85 % ramas) en `pnpm test:coverage`.

## Qué falta

- **Proveedor real de autenticación** (Better Auth: correo, Google, SMS) implementando `SessionResolver` en `packages/adapters/auth`, y enlazar `listings.owner_id` con la tabla de usuarios. Hasta entonces, en producción todos son anónimos (ver `08-api.md`).
- **Proveedores reales de SMS y de validación de DNI** detrás de los puertos `Notifier` e `IdentityVerifier` (hace falta elegir proveedor y crear cuenta).
- Repositorio de citas en PostgreSQL (llega con el depósito, Fase 2); hoy `determineAccessLevel` usa uno en memoria vacío, lo que es correcto mientras no se puedan crear citas.
- Subida de fotos, búsqueda con filtros sobre PostgreSQL (el puerto y el índice parcial ya existen), moderación y panel de administración.
- `apps/web` con Next.js.
- Curar el catálogo inicial (versiones, modelos faltantes): hoy es una muestra de 12 marcas y 70 modelos.
