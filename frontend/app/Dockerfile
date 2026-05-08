FROM node:20-alpine AS build

WORKDIR /app

# Declare build args so Railway can inject them at build time
# Vite bakes VITE_* vars into the bundle during the build step
ARG VITE_API_BASE_URL
ARG VITE_INSFORGE_URL
ARG VITE_INSFORGE_ANON_KEY
ARG VITE_SENTRY_DSN

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_INSFORGE_URL=$VITE_INSFORGE_URL
ENV VITE_INSFORGE_ANON_KEY=$VITE_INSFORGE_ANON_KEY
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist

RUN npm install -g serve

EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:8080"]
