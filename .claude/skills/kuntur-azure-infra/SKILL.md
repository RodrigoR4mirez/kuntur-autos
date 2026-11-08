---
name: kuntur-azure-infra
description: Mapa de la infraestructura de Kuntur Autos en Azure para staging y producción (grupos, Container Apps, identidades OIDC, entornos de GitHub, secretos) y consultas de solo lectura para diagnosticar. Úsala al revisar o cambiar Azure, una credencial federada, un entorno o un despliegue fallido.
---

# Infraestructura Azure de Kuntur Autos

Procedimiento: `docs/10-runbook.md`. Configuración: `docs/06-ci-cd.md` (sección Producción).

## Mapa (nombres fijos)

|                              | Staging                         | Producción                      |
| ---------------------------- | ------------------------------- | ------------------------------- |
| Grupo de recursos            | `rg-kuntur-staging`             | `rg-kuntur-production`          |
| Container App                | `kuntur-api-staging`            | `kuntur-api-production`         |
| Réplicas mínimas             | 0                               | 1                               |
| Entorno de GitHub            | `staging`                       | `production` (con revisores)    |
| Identidad (aplicación Entra) | `kuntur-github-staging`         | `kuntur-github-production`      |
| Credencial federada          | `github-staging`                | `github-production`             |
| Rol de la identidad          | Contributor solo sobre su grupo | Contributor solo sobre su grupo |

Comunes: región Brazil South; entorno de Container Apps `cae-kuntur-<entorno>`; registros `log-kuntur-<entorno>`. Los identificadores (suscripción, tenant, ID de cliente) están en las variables de GitHub, nunca en documentos.

Cada credencial federada usa el subject `repo:<dueño>@<id>/<repo>@<id>:environment:<entorno>` (IDs internos de GitHub) e issuer `https://token.actions.githubusercontent.com`, audiencia `api://AzureADTokenExchange`.

## Consultas seguras (solo lectura)

```bash
ENV=staging   # o production
RG=rg-kuntur-$ENV; APP=kuntur-api-$ENV
az containerapp show -n $APP -g $RG --query "{imagen:properties.template.containers[0].image, url:properties.configuration.ingress.fqdn, minReplicas:properties.template.scale.minReplicas}" -o json
az containerapp revision list -n $APP -g $RG -o table
az ad app federated-credential list --id <APP-ID> --query "[].{name:name,subject:subject}" -o table
```

`<APP-ID>` es la variable `AZURE_CLIENT_ID` del entorno correspondiente. No lo escribas en documentos.

## Cuidados

- Cambiar una credencial federada existente: en el portal (Entra ID → App registrations → la app → Certificates & secrets → Federated credentials). `setup.sh` no la modifica.
- Staging debe seguir con `minReplicas` 0. Producción con 1. Cambiarlo a mano genera cobros o arranques lentos.
- Cambios de infraestructura solo por **Infraestructura Azure**, no a mano, salvo emergencia documentada.

## Diagnóstico habitual

- `AADSTS700213`: el subject no coincide con el de la credencial. Compara la anotación del error letra por letra.
- "No valid subscriptions found" en Cloud Shell: la cuenta no tiene suscripción activa.
- Prueba de humo fallida: revisa `/health` y el Log stream antes de tocar nada.
