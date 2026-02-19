# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy sources
COPY . .

# Dockerfile
ARG VITE_API_URL="http://localhost:3000"
ARG VITE_GAMEY_URL="http://localhost:4000"

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GAMEY_URL=$VITE_GAMEY_URL

RUN npm install

RUN npm run build

# Production image
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]