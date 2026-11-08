# API HTTP

Servidor Fastify en `apps/api`. Los controladores son delgados: validan con `packages/contracts`, llaman a un caso de uso y traducen el resultado. La forma de las respuestas de error es siempre la misma:

```json
{ "error": { "code": "listing_not_found", "message": "No encontramos ese anuncio." } }
```

`code` es estable y sirve para programar; `message` está en español para mostrarlo a la persona.

## Autenticación

Las rutas protegidas esperan `Authorization: Bearer <token>`. El token se convierte en sesión con el puerto `SessionResolver`.

| Situación | Resultado |
|---|---|
| Sin cabecera, con formato incorrecto o token desconocido o vencido | La persona es **anónima**. Las rutas públicas responden igual; las protegidas devuelven 401 |
| Token válido | Sesión con `userId` y `role` |

**Estado actual del proveedor de autenticación:**
- **Producción:** todavía no hay proveedor real conectado (llegará con Better Auth). Mientras tanto `NullSessionResolver` hace que **todos sean anónimos**: las rutas protegidas devuelven 401 y nadie puede publicar.
- **Desarrollo** (fuera de producción): tokens fijos `dev-seller` (usuario `demo-owner`) y `dev-buyer` (usuario `demo-buyer`). Hay una prueba que garantiza que no funcionan en producción.

## Rutas

| Método y ruta | Sesión | Qué hace | Respuestas |
|---|---|---|---|
| `GET /health` | no | Estado del servicio | 200 |
| `GET /catalog/brands` | no | Marcas | 200 |
| `GET /catalog/brands/:id/models` | no | Modelos de una marca | 200, 400 id inválido, 404 marca desconocida |
| `GET /catalog/options` | no | Carrocerías y colores | 200 |
| `GET /listings/:id` | opcional | Ficha de un anuncio **publicado**, con los campos que permite el nivel de acceso | 200, 400, 404 |
| `POST /listings` | **sí** | Crea un borrador. El dueño es la persona de la sesión | 201 `{id, status}`, 400 forma inválida, 401, 422 regla de negocio |
| `POST /listings/:id/submit` | **sí** | Envía el borrador a revisión (solo su dueño) | 200 `{id, status}`, 401, 403 no es el dueño, 404, 409 estado no permitido |

### Nivel de acceso en `GET /listings/:id`
Se calcula en el servidor para cada petición (`determineAccessLevel`):

| Nivel | Cuándo | Campos extra |
|---|---|---|
| `anonymous` | Sin sesión | Título, precio, ubicación, marca, modelo, año, kilometraje |
| `registered` | Con sesión | Versión, carrocería, color, transmisión, combustible |
| `deposit_paid` | Cita de ese anuncio con depósito pagado (agendada o realizada) | Placa |
| `closed` | Compra cerrada (llega con la Fase 2) | — |

La respuesta nunca incluye el dueño ni su contacto, y solo sale una lista blanca de campos (`listing-presenter.ts`).

### `POST /listings`
Cuerpo (todo obligatorio; `versionId` puede ser `null`):

```json
{
  "title": "Kia Rio 2020 único dueño",
  "price": { "amountMinor": 3500000, "currency": "PEN" },
  "department": "Lima",
  "city": "Surco",
  "vehicle": {
    "brandId": 2, "modelId": 20, "versionId": null, "bodyTypeId": 2, "colorId": 3,
    "year": 2020, "mileageKm": 30000,
    "transmission": "manual", "fuel": "gasoline", "plate": "abc-123"
  }
}
```

- **Campos desconocidos se rechazan (400)**, por ejemplo `ownerId` o `status`: nadie elige su propio dueño ni publica sin revisión.
- La placa se acepta con o sin guion y en cualquier caja; se guarda normalizada (`ABC123`).
- El dinero va en céntimos, como entero.
- Códigos 422: `invalid_title` (5 a 100 caracteres), `invalid_price` (mayor que cero), `invalid_year`, `invalid_mileage`, `invalid_plate`.

## Cómo agregar una ruta
Sigue los pasos de `05-arquitectura-limpia.md`. En la API: esquema en `packages/contracts`, ruta delgada en `apps/api/src/interface/http`, pruebas con `app.inject` en `app.test.ts`, y **esta tabla actualizada en el mismo commit**.
