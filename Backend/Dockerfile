FROM node:24.15.0-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24.15.0-bookworm-slim AS production
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s CMD node -e "fetch('http://localhost:8000/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]

FROM production AS worker
USER root
COPY --from=docker:28.1.1-cli /usr/local/bin/docker /usr/local/bin/docker
USER node
EXPOSE 9091
HEALTHCHECK --interval=15s --timeout=5s CMD node -e "fetch('http://localhost:9091/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/queue/worker.js"]
