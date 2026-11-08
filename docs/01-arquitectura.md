# Arquitectura

## Estilo
Arquitectura hexagonal (puertos y adaptadores) en un monorepo TypeScript.

```
apps/
  web/          PWA (SSR para páginas públicas, SEO)
  api/          API HTTP, jobs y webhooks
  mobile/       Expo / React Native (Fase posterior)
packages/
  core/         Dominio y casos de uso. TypeScript puro.
  contracts/    Esquemas de validación y tipos compartidos
  design-tokens/ Tokens de diseño en JSON neutral
  adapters/
    db-postgres/       implementa los repositorios
    search-postgres/   implementa SearchIndex (reemplazable)
    payments-culqi/    implementa PaymentGateway
    notifications/     correo, SMS, WhatsApp, push
    storage/           imágenes y documentos
    vehicle-history/   proveedor de historial por placa
infra/          Docker, CI, infraestructura como código
```

Regla de dependencias: `apps` → `adapters` → `core`. Nunca al revés. `core` no importa nada externo.

## Puertos del núcleo (`packages/core/src/ports/`)
`ListingRepository`, `UserRepository`, `SearchIndex`, `PaymentGateway`, `VehicleHistoryProvider`, `Notifier`, `FileStorage`, `IdentityVerifier`, `AppointmentRepository`, `Clock`, `IdGenerator`.

Cambiar Culqi por otra pasarela, o PostgreSQL por un buscador dedicado, significa escribir un adaptador nuevo y no tocar el núcleo.

## Modelo de dominio (resumen)
- `Listing` (genérico): id, vertical, owner, estado, precio, moneda, ubicación, fotos, fechas.
- `VehicleDetails` (extensión): marca, modelo, año, versión, carrocería, color, kilometraje, transmisión, combustible, placa, estado de uso.
- `PropertyDetails` (futuro): no se implementa ahora, pero el diseño lo admite sin migraciones destructivas.
- Catálogo cerrado: `Brand`, `Model`, `Version`, `BodyType`, `Color`, `Feature`.
- `User`, `SellerProfile`, `DealerProfile`, `IdentityVerification`.
- `VehicleHistoryReport` (resultado del proveedor, con fecha de consulta).
- `Appointment`, `Deposit`, `Payment`, `Dispute`.

## Niveles de acceso a un anuncio
| Nivel | Qué ve |
|---|---|
| Anónimo | Fotos, precio y datos básicos |
| Registrado | Ficha completa y resumen del historial legal |
| Depósito pagado | Agenda con asesor; el contacto del vendedor sigue oculto |
| Compra cerrada | Datos de contacto liberados según las reglas de producto |

La proyección de campos por nivel se hace en el servidor, en el caso de uso, con una función pura y probada en el núcleo.

## Proceso de compra (máquina de estados)
`interesado → depósito_pendiente → depósito_pagado → entrevista_agendada → entrevista_realizada → (depósito_reembolsado | depósito_retenido) → negociación → pago_final* → cerrada`

\* El pago final está pendiente de decisión (ver `00-decisiones.md`). Todas las transiciones son explícitas, auditables y reciben un único evento. Cada usuario ve en qué estado va su proceso.

Reglas del depósito (monto configurable desde el panel de administración):
- El comprador asiste: reembolso.
- El comprador no asiste sin avisar: se retiene.
- Falla el vendedor o el asesor: reembolso siempre.

## Búsqueda y "match" rápido
PostgreSQL como base inicial, detrás del puerto `SearchIndex`:
- Catálogo normalizado con claves numéricas; sin texto libre en los filtros.
- Índices compuestos sobre `(estado, marca, modelo, año, precio)` y parciales `WHERE estado = 'publicado'`.
- Paginación por cursor (keyset), no por `OFFSET`.
- Conteos de filtros (facetas) precalculados o en caché.
- Búsqueda de texto con `pg_trgm` solo para campos opcionales.
- Puntuación del match: filtros obligatorios descartan; filtros deseables ordenan.
- Si el volumen o la latencia lo exigen, se agrega un buscador dedicado como nuevo adaptador.
Objetivo: respuesta del servidor menor de 200 ms en el percentil 95 con 100 mil anuncios. Se mide con una prueba de carga antes de lanzar.

## Verificación por placa
`VehicleHistoryProvider` devuelve propietario declarado, gravámenes, papeletas, SOAT y revisión técnica según lo que ofrezca el proveedor. Se guarda cada informe con fecha y fuente. Si el proveedor falla, el anuncio muestra "historial no disponible", nunca datos antiguos como si fueran actuales.

## Seguridad
- Autenticación con sesiones seguras; Google como proveedor adicional.
- Roles: visitante, comprador, vendedor, concesionario, asesor, administrador.
- Validación de todas las entradas con los esquemas de `contracts`.
- Webhooks de pago con firma verificada e idempotencia.
- Subida de archivos con tipo y tamaño validados; documentos en almacenamiento privado.
- Datos personales cifrados en reposo, registro de auditoría y política de retención.
- Límite de peticiones en inicio de sesión, SMS y consultas de historial.

## Observabilidad y operación
Registro estructurado, trazas y métricas con OpenTelemetry (estándar abierto, intercambiable). Copias de seguridad automáticas de la base de datos. Entornos: local, staging y producción, desplegados con contenedores Docker.

## Hacia móvil
`core`, `contracts` y `design-tokens` se reutilizan tal cual. La app Expo solo agrega su capa de interfaz y adaptadores nativos (cámara, notificaciones push). La PWA cubre la web instalable desde el primer día.
