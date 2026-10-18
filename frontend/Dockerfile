# Stage 1: Building the app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Running the app
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
RUN addgroup -S -g 10001 nexus && adduser -S -u 10001 -G nexus nexus

# We only need the public folder and the build output
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

RUN chown -R nexus:nexus /app
USER nexus

EXPOSE 3000

CMD ["npm", "start"]
