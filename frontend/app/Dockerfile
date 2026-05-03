FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Plantilla nginx con placeholder para el puerto
RUN rm /etc/nginx/conf.d/default.conf && \
    printf 'server {\n    listen __PORT__;\n    root /usr/share/nginx/html;\n    index index.html;\n    location / {\n        try_files $uri $uri/ /index.html;\n    }\n}\n' \
    > /etc/nginx/conf.d/default.conf.tpl

# Script de arranque: sustituye __PORT__ y lanza nginx
RUN printf '#!/bin/sh\nset -e\nsed "s/__PORT__/$PORT/" /etc/nginx/conf.d/default.conf.tpl > /etc/nginx/conf.d/default.conf\nexec nginx -g "daemon off;"\n' \
    > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
