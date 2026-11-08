---
name: kuntur-azure-infra
description: Mapa de la infraestructura de Kuntur Autos en Azure (grupo, Container App, identidad OIDC, entorno de GitHub, variables y secretos) y cómo consultar su estado sin modificarlo. Úsala al revisar, diagnosticar o cambiar Azure, la credencial federada o los recursos de staging.
---

# Infraestructura Azure de Kuntur Autos

Lee `docs/10-runbook.md` (sección 1: estado actual) y `docs/06-ci-cd.md` (configuración y problemas frecuentes).

## Mapa

- Grupo de recursos: `rg-kuntur-staging` (Brazil South). Todo lo del proyecto vive ahí; borrarlo apaga todo.
- Entorno Container Apps: `cae-kuntur-staging`. Registros: `log-kuntur-staging` (30 días).
- Aplicación: `kuntur-api-staging`, con una revisión activa (modo Single).
- Identidad para GitHub: aplicación Entra `kuntur-github-staging` con la credencial federada `github-staging` (issuer `https://token.actions.githubusercontent.com`, audiencia `api://AzureADTokenExchange`, subject con IDs internos de GitHub: `repo:<dueño>@<id>/<repo>@<id>:environment:staging`).
- Rol de esa identidad: Contributor **solo** sobre `rg-kuntur-staging`.
- Secretos de la app (dentro de Azure): `database-url`, `auth-secret`, `google-client-secret`, `smtp-url`, según lo configurado.

## Consultas seguras (solo lectura)

```bash
RG=rg-kuntur-staging; APP=kuntur-api-staging
az containerapp show -n $APP -g $RG --query "{imagen:properties.template.containers[0].image, url:properties.configuration.ingress.fqdn, minReplicas:properties.template.scale.minReplicas}" -o json
az containerapp revision list -n $APP -g $RG -o table
az ad app federated-credential list --id <APP-ID> --query "[].{name:name,subject:subject,issuer:issuer}" -o table
```

El `APP-ID` está en la variable `AZURE_CLIENT_ID` del repositorio (no lo escribas en documentos ni commits).

## Cuidados

- Cambiar la credencial federada cuando ya existe: edítala en el portal (Entra ID → App registrations → kuntur-github-staging → Certificates & secrets → Federated credentials). `infra/azure/setup.sh` no la modifica.
- `minReplicas` debe seguir en 0 en staging (escala a cero). Subirlo genera cobros.
- Cambios de infraestructura solo por el flujo **Infraestructura Azure**, no a mano, salvo emergencia documentada.

## Diagnóstico habitual

- `AADSTS700213`: el subject no coincide. Compara la anotación del error con la credencial. Si coincide, espera unos minutos (propagación) y reintenta.
- "No valid subscriptions found" en Cloud Shell: la cuenta no tiene suscripción activa.
- La prueba de humo falla: revisa `/health` y los registros del Log stream antes de tocar nada.
