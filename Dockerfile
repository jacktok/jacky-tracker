FROM node:20-alpine AS base
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Rebuild native modules for Alpine Linux
RUN npm rebuild bcrypt --build-from-source

# Remove dev dependencies
RUN npm prune --production

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "server.js"]


