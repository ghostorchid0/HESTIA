# Build the React client
FROM node:20-slim AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Production server image
FROM node:20-slim
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
COPY --from=client-builder /app/client/dist ./client/dist
RUN mkdir -p uploads
EXPOSE 5000
CMD ["node", "server.js"]
