# Construir desde la raíz del repositorio:
#   docker build -f apps/web/Dockerfile -t kuntur-web .
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/design-tokens/package.json packages/design-tokens/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @kuntur/web...
COPY tsconfig.base.json ./
COPY packages/design-tokens packages/design-tokens
COPY apps/web apps/web
RUN pnpm --filter @kuntur/web build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
# La web se ejecuta con `node` directamente: npm, npx, corepack y yarn no hacen falta en producción
# (traen dependencias propias con vulnerabilidades que no podemos actualizar desde el proyecto).
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/ingresar').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
