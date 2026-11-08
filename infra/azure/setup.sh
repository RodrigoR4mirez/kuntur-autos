#!/usr/bin/env bash
# Prepara Azure para desplegar Kuntur Autos (una sola vez). Se ejecuta en Azure Cloud Shell (Bash).
# Es seguro repetirlo: reutiliza lo que ya existe. No guarda ni imprime contraseñas.
#
# Qué hace:
#   1. Comprueba que tu suscripción esté activa.
#   2. Registra los servicios de Azure que usamos (Container Apps y registros).
#   3. Crea el grupo de recursos donde vivirá todo (borrarlo apaga todo y detiene los cobros).
#   4. Crea una identidad para GitHub y le permite entrar SOLO a ese grupo, sin contraseñas (OIDC).
#   5. Imprime los 5 valores que debes guardar como variables en GitHub.
set -euo pipefail

REPO="${REPO:-RodrigoR4mirez/kuntur-autos}"
RG="${RG:-rg-kuntur-staging}"
LOCATION="${LOCATION:-brazilsouth}"
IDENTITY_NAME="${IDENTITY_NAME:-kuntur-github-staging}"
CONTAINERAPP_NAME="${CONTAINERAPP_NAME:-kuntur-api-staging}"

echo "==> 1/5 Comprobando la suscripción"
STATE=$(az account show --query state -o tsv)
SUB=$(az account show --query id -o tsv)
TENANT=$(az account show --query tenantId -o tsv)
NAME=$(az account show --query name -o tsv)
echo "    Suscripción: $NAME (estado: $STATE)"
if [ "$STATE" != "Enabled" ]; then
  echo "ERROR: la suscripción está en estado '$STATE', no 'Enabled'. No sigas y cuéntame qué dice el portal."
  exit 1
fi

echo "==> 2/5 Registrando servicios de Azure (puede tardar unos minutos)"
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.OperationalInsights --wait

echo "==> 3/5 Creando el grupo de recursos $RG en $LOCATION"
az group create --name "$RG" --location "$LOCATION" --output none

echo "==> 4/5 Creando la identidad para GitHub (sin contraseñas)"
APP_ID=$(az ad app list --display-name "$IDENTITY_NAME" --query "[0].appId" -o tsv)
if [ -z "$APP_ID" ]; then
  APP_ID=$(az ad app create --display-name "$IDENTITY_NAME" --query appId -o tsv)
fi
if ! az ad sp show --id "$APP_ID" --output none 2>/dev/null; then
  az ad sp create --id "$APP_ID" --output none
fi
SP_ID=$(az ad sp show --id "$APP_ID" --query id -o tsv)

# GitHub podrá entrar solo desde este repositorio y solo desde el entorno "staging".
PARAMS=$(printf '{"name":"github-staging","issuer":"https://token.actions.githubusercontent.com","subject":"repo:%s:environment:staging","audiences":["api://AzureADTokenExchange"]}' "$REPO")
EXISTS=$(az ad app federated-credential list --id "$APP_ID" --query "[?name=='github-staging'] | length(@)" -o tsv)
if [ "$EXISTS" = "0" ]; then
  az ad app federated-credential create --id "$APP_ID" --parameters "$PARAMS" --output none
fi

# Permiso mínimo: solo sobre este grupo de recursos, no sobre toda la cuenta.
SCOPE="/subscriptions/$SUB/resourceGroups/$RG"
HAS=$(az role assignment list --assignee "$SP_ID" --scope "$SCOPE" --role Contributor --query "length(@)" -o tsv)
if [ "$HAS" = "0" ]; then
  sleep 20 # Azure tarda unos segundos en reconocer la identidad recién creada.
  az role assignment create --assignee-object-id "$SP_ID" --assignee-principal-type ServicePrincipal \
    --role Contributor --scope "$SCOPE" --output none
fi

echo "==> 5/5 Listo. Guarda estos 5 valores como VARIABLES del repositorio en GitHub:"
echo
echo "AZURE_CLIENT_ID=$APP_ID"
echo "AZURE_TENANT_ID=$TENANT"
echo "AZURE_SUBSCRIPTION_ID=$SUB"
echo "AZURE_RESOURCE_GROUP=$RG"
echo "AZURE_CONTAINERAPP_NAME=$CONTAINERAPP_NAME"
echo
echo "No son secretos (son identificadores). Las contraseñas no existen: GitHub entra con un permiso temporal."
