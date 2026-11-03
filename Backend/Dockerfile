# Node 24 on Alpine 3.24. Debian bookworm and trixie slim images still ship
# unfixed high/critical findings in util-linux, ncurses, perl, and related
# libraries. The API process only needs the Node binary, which on this image
# does not link those libraries. Dev dependencies stay in the build stage.
FROM node:24.22.2-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:24.22.2-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24.22.2-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
# Refresh Alpine security fixes, then remove npm, corepack, and the package
# manager. The apk database stays so image scanners can still see OS packages.
RUN set -eux; \
    apk upgrade --no-cache; \
    rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /opt/yarn-v1.22.22 \
           /usr/local/include \
           /usr/local/share/man \
           /usr/local/share/doc \
           /root/.npm \
           /tmp/*; \
    rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
          /usr/local/bin/yarn /usr/local/bin/yarnpkg \
          /sbin/apk
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s CMD ["node", "-e", "fetch('http://127.0.0.1:8000/health/ready').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "dist/index.js"]

FROM production AS worker
USER root
COPY --from=docker:29.9.2-cli /usr/local/bin/docker /usr/local/bin/docker
USER node
EXPOSE 9091
HEALTHCHECK --interval=15s --timeout=5s CMD ["node", "-e", "fetch('http://127.0.0.1:9091/health/ready').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "dist/queue/worker.js"]
