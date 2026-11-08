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

# Uso: bash setup.sh            (staging, por defecto)
#      ENVIRONMENT=production bash setup.sh   (producción: grupo, identidad y credencial propios)
REPO="${REPO:-RodrigoR4mirez/kuntur-autos}"
ENVIRONMENT="${ENVIRONMENT:-staging}"
case "$ENVIRONMENT" in staging|production) ;; *) echo "ERROR: ENVIRONMENT debe ser staging o production."; exit 1;; esac
RG="${RG:-rg-kuntur-$ENVIRONMENT}"
LOCATION="${LOCATION:-brazilsouth}"
IDENTITY_NAME="${IDENTITY_NAME:-kuntur-github-$ENVIRONMENT}"
CONTAINERAPP_NAME="${CONTAINERAPP_NAME:-kuntur-api-$ENVIRONMENT}"
echo "==> Entorno: $ENVIRONMENT (grupo $RG, identidad $IDENTITY_NAME)"

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

# GitHub envía como "subject" la forma con los IDs internos de dueño y repositorio
# (repo:<dueño>@<id-dueño>/<repo>@<id-repo>:environment:staging). Azure exige que coincida exacto.
# Los IDs se leen de la API pública de GitHub (el repositorio es público, no hace falta token).
REPO_INFO=$(curl -fsSL "https://api.github.com/repos/$REPO")
read -r OWNER_LOGIN OWNER_ID REPO_NAME REPO_ID <<< "$(printf '%s' "$REPO_INFO" | python3 -c '
import json, sys
d = json.load(sys.stdin)
print(d["owner"]["login"], d["owner"]["id"], d["name"], d["id"])')"
SUBJECT="repo:${OWNER_LOGIN}@${OWNER_ID}/${REPO_NAME}@${REPO_ID}:environment:${ENVIRONMENT}"
echo "    Subject que usará la credencial: $SUBJECT"
CRED_NAME="github-$ENVIRONMENT"
PARAMS=$(printf '{"name":"%s","issuer":"https://token.actions.githubusercontent.com","subject":"%s","audiences":["api://AzureADTokenExchange"]}' "$CRED_NAME" "$SUBJECT")
EXISTS=$(az ad app federated-credential list --id "$APP_ID" --query "[?name=='$CRED_NAME'] | length(@)" -o tsv)
if [ "$EXISTS" = "0" ]; then
  # Si ya existe una credencial con ese nombre, no se modifica: revísala en el portal (ver docs/06-ci-cd.md).
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

echo "==> 5/5 Listo para el entorno $ENVIRONMENT."
echo
if [ "$ENVIRONMENT" = "staging" ]; then
  echo "Variables del REPOSITORIO en GitHub (staging usa estas):"
  echo "AZURE_CLIENT_ID=$APP_ID"
  echo "AZURE_TENANT_ID=$TENANT"
  echo "AZURE_SUBSCRIPTION_ID=$SUB"
else
  echo "Variables del entorno 'production' en GitHub (sobrescriben las del repositorio):"
  echo "AZURE_CLIENT_ID=$APP_ID"
  echo "AZURE_TENANT_ID=$TENANT"
  echo "AZURE_SUBSCRIPTION_ID=$SUB"
fi
echo
echo "Los nombres del grupo y de la app son fijos ($RG y $CONTAINERAPP_NAME); ya no se configuran como variables."
echo "No son secretos (son identificadores). Las contraseñas no existen: GitHub entra con un permiso temporal."
