// Infraestructura de staging en Azure: Container Apps (escala a cero) + Log Analytics.
// La base de datos es Neon (externa); su URL llega como parámetro secreto.
// Uso: az deployment group create -g <grupo> --template-file main.bicep --parameters image=... databaseUrl=...
targetScope = 'resourceGroup'

@description('Región de Azure. Por defecto, la del grupo de recursos (Brazil South es la más cercana a Perú).')
param location string = resourceGroup().location

@description('Nombre del entorno, usado para nombrar los recursos.')
param environmentName string = 'staging'

@description('Nombre de la Container App de la API.')
param appName string = 'kuntur-api-${environmentName}'

@description('Imagen de la API. Mejor con digest: ghcr.io/<dueño>/kuntur-autos-api@sha256:...')
param image string

@secure()
@description('Cadena de conexión de PostgreSQL (Neon). Se guarda como secreto de la app.')
param databaseUrl string

@secure()
@description('Secreto de sesiones (mínimo 32 caracteres). Vacío = inicio de sesión desactivado y todos anónimos.')
param authSecret string = ''

@description('URL pública de la API. Vacía = se calcula con el dominio de Container Apps.')
param authBaseUrl string = ''

@description('Orígenes de la web autorizados, separados por comas.')
param authTrustedOrigins string = ''

@description('ID de cliente de Google OAuth (no es secreto). Vacío = sin inicio con Google.')
param googleClientId string = ''

@secure()
@description('Secreto de cliente de Google OAuth.')
param googleClientSecret string = ''

@secure()
@description('URL SMTP del proveedor de correo, por ejemplo smtps://usuario:clave@smtp.proveedor.com:465.')
param smtpUrl string = ''

@description('Remitente de los correos, por ejemplo Kuntur Autos <no-responder@tudominio.pe>.')
param mailFrom string = ''

@description('Página temporal de prueba del inicio con Google. Solo staging: "true" la activa.')
param loginTestPage string = 'false'

@description('Puerto en el que escucha la API dentro del contenedor.')
param targetPort int = 3000

@description('Réplicas mínimas. 0 = escala a cero y no consume cuota cuando nadie usa la API.')
@minValue(0)
param minReplicas int = 0

@minValue(1)
param maxReplicas int = 2

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-kuntur-${environmentName}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource managedEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: 'cae-kuntur-${environmentName}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

// El dominio de la app es <nombre>.<dominio del entorno>; se calcula aquí para no depender de un paso manual.
var computedBaseUrl = empty(authBaseUrl) ? 'https://${appName}.${managedEnvironment.properties.defaultDomain}' : authBaseUrl

var appSecrets = concat(
  [
    {
      name: 'database-url'
      value: databaseUrl
    }
  ],
  empty(authSecret)
    ? []
    : [
        {
          name: 'auth-secret'
          value: authSecret
        }
      ],
  empty(googleClientSecret)
    ? []
    : [
        {
          name: 'google-client-secret'
          value: googleClientSecret
        }
      ],
  empty(smtpUrl)
    ? []
    : [
        {
          name: 'smtp-url'
          value: smtpUrl
        }
      ]
)

var appEnv = concat(
  [
    {
      name: 'NODE_ENV'
      value: 'production'
    }
    {
      name: 'PORT'
      value: string(targetPort)
    }
    {
      name: 'DATABASE_URL'
      secretRef: 'database-url'
    }
    {
      name: 'LOGIN_TEST_PAGE'
      value: loginTestPage
    }
  ],
  empty(authSecret)
    ? []
    : [
        {
          name: 'AUTH_SECRET'
          secretRef: 'auth-secret'
        }
        {
          name: 'AUTH_BASE_URL'
          value: computedBaseUrl
        }
        {
          name: 'AUTH_TRUSTED_ORIGINS'
          value: authTrustedOrigins
        }
      ],
  empty(googleClientSecret)
    ? []
    : [
        {
          name: 'GOOGLE_CLIENT_ID'
          value: googleClientId
        }
        {
          name: 'GOOGLE_CLIENT_SECRET'
          secretRef: 'google-client-secret'
        }
      ],
  empty(smtpUrl)
    ? []
    : [
        {
          name: 'SMTP_URL'
          secretRef: 'smtp-url'
        }
        {
          name: 'MAIL_FROM'
          value: mailFrom
        }
      ]
)

resource api 'Microsoft.App/containerApps@2024-03-01' = {
  name: appName
  location: location
  properties: {
    managedEnvironmentId: managedEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
      }
      secrets: appSecrets
    }
    template: {
      containers: [
        {
          name: 'api'
          image: image
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: appEnv
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: targetPort
              }
              initialDelaySeconds: 5
              periodSeconds: 20
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: targetPort
              }
              initialDelaySeconds: 3
              periodSeconds: 10
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

output url string = 'https://${api.properties.configuration.ingress.fqdn}'
output appName string = api.name
output authBaseUrl string = computedBaseUrl
output googleRedirectUri string = '${computedBaseUrl}/auth/callback/google'
