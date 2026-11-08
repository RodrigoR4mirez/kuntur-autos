# Construir desde la raíz del repositorio:
#   docker build -f apps/api/Dockerfile -t kuntur-api .
FROM node:22-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/contracts/package.json packages/contracts/
COPY packages/adapters/system/package.json packages/adapters/system/
COPY packages/adapters/db-postgres/package.json packages/adapters/db-postgres/
COPY packages/adapters/auth/package.json packages/adapters/auth/
COPY packages/adapters/notifications/package.json packages/adapters/notifications/
COPY packages/design-tokens/package.json packages/design-tokens/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --prod --filter @kuntur/api...

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000
# La API se ejecuta con `node` directamente: npm, npx, corepack y yarn no hacen falta en producción.
# Se eliminan porque traen dependencias propias (por ejemplo brace-expansion, ip-address, pacote)
# con vulnerabilidades que Trivy reporta y que no podemos actualizar desde el proyecto.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*
COPY --from=deps /app/node_modules ./node_modules
# drizzle-kit (dependencia de better-auth) arrastra esbuild, con un binario de Go con vulnerabilidades.
# La API nunca usa drizzle-kit ni esbuild en ejecución (las migraciones usan drizzle-orm), así que se quitan.
RUN find /app/node_modules/.pnpm -maxdepth 1 -name '@esbuild+*' -exec rm -rf {} + \
 && find /app/node_modules/.pnpm -maxdepth 1 -name 'drizzle-kit@*' -exec rm -rf {} + || true
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=deps /app/packages/adapters/system/node_modules ./packages/adapters/system/node_modules
COPY --from=deps /app/packages/adapters/db-postgres/node_modules ./packages/adapters/db-postgres/node_modules
COPY --from=deps /app/packages/adapters/auth/node_modules ./packages/adapters/auth/node_modules
COPY --from=deps /app/packages/adapters/notifications/node_modules ./packages/adapters/notifications/node_modules
COPY package.json ./
COPY packages/core packages/core
COPY packages/contracts packages/contracts
COPY packages/adapters/system packages/adapters/system
COPY packages/adapters/db-postgres packages/adapters/db-postgres
COPY packages/adapters/auth packages/adapters/auth
COPY packages/adapters/notifications packages/adapters/notifications
COPY apps/api apps/api
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/api/src/main.ts"]
