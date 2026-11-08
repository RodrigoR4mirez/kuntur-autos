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
      secrets: [
        {
          name: 'database-url'
          value: databaseUrl
        }
      ]
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
          env: [
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
          ]
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
