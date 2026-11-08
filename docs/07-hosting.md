# Decisión de hosting para pruebas (staging)

Estado: **decidido el 2026-11-08**. Entorno de pruebas: **Azure Container Apps + Neon PostgreSQL + GitHub Container Registry**.

## Requisitos
Gratis o casi gratis para pruebas; que corra contenedores Docker (API con Fastify y, después, Next.js); que soporte PostgreSQL; uso comercial permitido; despliegue desde GitHub Actions sin guardar contraseñas.

## Alternativas revisadas

| Opción | Hallazgo | Veredicto |
|---|---|---|
| **Vercel** | El plan gratuito (Hobby) es solo para uso personal y no comercial; el uso comercial exige el plan Pro ([política](https://vercel.com/docs/limits/fair-use-guidelines)) | Descartado para un marketplace |
| **Render** | Servicio gratis que se duerme a los 15 minutos; su PostgreSQL gratuito expira a los 30 días y no tiene copias de seguridad ([doc](https://render.com/docs/free)) | Alternativa sin tarjeta; la base no sirve |
| **Google Cloud Run** | Cuota mensual gratuita (2 millones de peticiones, 180.000 vCPU-s), escala a cero, requiere tarjeta ([precios](https://cloud.google.com/run/pricing)) | Buena alternativa equivalente |
| **Azure Container Apps** | Misma cuota mensual gratuita por suscripción y escala a cero ([precios](https://azure.microsoft.com/en-us/pricing/details/container-apps/)) | **Elegida** (preferencia del dueño) |
| **Azure Database for PostgreSQL** | Gratis solo 12 meses y solo para cuentas nuevas ([doc](https://learn.microsoft.com/en-ie/azure/postgresql/flexible-server/how-to-deploy-on-azure-free-account)) | No: vence |
| **Neon** | 1 GB por proyecto, 100 h de cómputo al mes, 10 ramas, sin cobro por exceso y sin borrar datos ([FAQ](https://neon.com/faqs/free-plan-limits-and-quotas)) | **Elegida** para la base |
| **Fly.io / Railway** | Sin plan gratuito real para cuentas nuevas | Descartadas |
| **Koyeb** | Una instancia gratis que se duerme tras una hora; las fuentes se contradicen en los límites | Descartada por incertidumbre |

## Por qué esta combinación
- Container Apps da la misma cuota gratuita que Cloud Run y permite autenticar desde GitHub con OIDC.
- Neon es PostgreSQL estándar y no vence, a diferencia de la base gratuita de Azure.
- GHCR es gratis para repositorios públicos y evita pagar Azure Container Registry.
- La imagen es un contenedor estándar, así que cambiar de nube es un cambio de infraestructura, no de código.

## Consecuencias y riesgos
- Azure exige tarjeta y suscripción: configura un **presupuesto con alertas** el primer día.
- Container Apps escala a cero: la primera petición tras un rato sin uso es lenta (arranque en frío). Neon también se duerme.
- Log Analytics y el tráfico saliente fuera de la cuota se cobran; el volumen de staging es bajo.
- Las cifras de las fuentes pueden cambiar. Revísalas antes de depender de ellas.

## Producción
Esta decisión es solo para staging. Para producción se debe reevaluar: plan de pago de Neon o PostgreSQL administrado, réplicas mínimas mayores que cero, región, copias de seguridad, dominio propio con TLS y un entorno `production` con aprobación manual.
