# Decisiones tomadas

Fuente: las respuestas del dueño del proyecto a la ronda de preguntas. Fecha: 2026-11-08.

| Tema | Decisión |
|---|---|
| Nombre de la marca | **Kuntur Autos** (pendiente de verificar en INDECOPI y dominio) |
| Rol de la empresa | Intermediaria y persona legal: recibe los pagos y presenta el auto con su asesor |
| Repositorio | `kuntur-autos`, público, en la cuenta RodrigoR4mirez |
| Modelo de negocio | Marketplace abierto: particulares y concesionarios publican |
| Quién vende | Particulares y concesionarios |
| Historial del auto por placa | Proveedor de datos autorizado (API) + documentos del vendedor verificados por el equipo |
| Configurador | Por fases: asistente por pasos con imágenes primero, 3D después |
| Visibilidad sin registro | Fotos, precio y datos básicos |
| Entrevista | Asesor de la plataforma en un punto de encuentro |
| Pasarela de pagos | Culqi, detrás de un puerto intercambiable |
| Identidad | Correo + celular con código SMS, inicio con Google y validación de DNI |
| Alcance | Todo el Perú desde el inicio |
| Backend | TypeScript + PostgreSQL |
| Web | Next.js |
| API HTTP | Fastify |
| Acceso a datos | Drizzle ORM |
| Sesiones | Librería de autenticación en nuestro servidor |
| Hosting de pruebas | Azure Container Apps + Neon (PostgreSQL) + GitHub Container Registry. Ver `07-hosting.md` |
| Entornos | Staging automático en cada merge a `main`; producción después, con aprobación manual |
| CI/CD | GitHub Actions: CI, seguridad (CodeQL, dependencias, secretos, Trivy), despliegue con OIDC. Ver `06-ci-cd.md` |
| Documentación | Viva y obligatoria: se actualiza en el mismo commit que el cambio; las indicaciones del dueño pasan a `CLAUDE.md` o a skills |
| Publicar anuncios | Cualquier persona con sesión puede publicar; el dueño sale siempre de la sesión y el anuncio nace como borrador que pasa por revisión |
| Autenticación | Better Auth (gratis, en nuestra base de datos) detrás del puerto `SessionResolver`. Por ahora **correo y Google**; SMS y DNI pospuestos. Correo verificado obligatorio. Sin `AUTH_SECRET` en producción, todos son anónimos. Ver `09-autenticacion.md` |
| Correo transaccional | SMTP estándar (proveedor intercambiable: Brevo, Resend, etc.); proveedor aún por elegir |
| Plano del producto | La placa se muestra solo desde el nivel `deposit_paid` (decisión por defecto, a confirmar) |
| Móvil | PWA primero; luego app con Expo / React Native |
| Ingresos | Cobro por publicar o destacar anuncios |
| Hosting | Nube administrada con contenedores Docker |
| Depósito de entrevista | S/ 10 configurable; se devuelve si asiste, se retiene si no asiste; si falla vendedor o asesor, se devuelve siempre |
| Diseño | Sin marca todavía: se propone una dirección visual |
| Equipo | Una persona con Claude como equipo principal |
| Catálogo | Propio, curado, con listas cerradas |
| Avisos | Correo, WhatsApp, SMS y notificaciones push |
| Moderación | Reglas automáticas + revisión humana de lo sospechoso |
| MVP | Fase 1: búsqueda, registro, publicar, ficha. Fase 2: depósito y entrevista. Fase 3: configurador |

## Matiz importante
El dueño pidió "todo el Perú desde el inicio". Las papeletas se consultan en SAT Lima (solo Lima) y SUTRAN (nacional); los asesores y entrevistas son presenciales. Hay que decidir cómo se cubren las ciudades fuera de Lima (ver "Pendientes").

## Pendientes por decidir
1. **Pago final del auto — resuelto (2026-11-08).** La empresa actúa como intermediaria y persona legal: recibe los pagos (depósito y, si corresponde, pago final), presenta el auto con su propio asesor y es la contraparte del comprador. Implica constituir la empresa, emitir comprobantes electrónicos y firmar contratos de mandato o consignación con los vendedores. Queda solo la revisión con abogado y contador (punto 6).
2. **Cobertura fuera de Lima — criterio asignado a Claude.** Lima con asesores propios. Otras ciudades: videollamada guiada primero y aliados locales cuando haya volumen. Las papeletas se consultan por la fuente que corresponda (SAT Lima, SUTRAN) a través del proveedor de historial.
3. **Proveedor concreto de datos por placa.** Candidato a evaluar: Verifik (API comercial de consulta de placas en Perú). Cotizar y revisar cobertura de papeletas, SOAT y gravámenes, y sus términos de uso. No se automatizarán portales con captcha.
4. **Precios de publicación** (normal, destacado) y vigencia del anuncio.
5. **Dominio y registro de la marca** `Kuntur Autos` en INDECOPI. Verificar que `kunturautos.pe`, `.com.pe` y `.com` estén libres.
6. **Revisión legal** con un abogado peruano: protección de datos personales, términos y condiciones, libro de reclamaciones y custodia de depósitos. Este documento no es asesoría legal.
7. **Modelos 3D** para la Fase 3: fuente, licencias y presupuesto.

## Hechos del mercado que respaldan el producto
- Kavak suspendió operaciones en Perú desde el 1 de enero de 2024.
- Neoauto es el portal con más presencia y cobra a concesionarios por publicar.
- Se proyectan unas 600 mil transferencias de seminuevos en 2025.
- Se reporta que el 90% de las transferencias son entre particulares y el 40% presenta alguna irregularidad.
Las cifras vienen de prensa y blogs. Verifícalas antes de usarlas en material comercial.
