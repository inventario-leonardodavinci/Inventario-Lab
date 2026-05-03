FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

# Servir con nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Plantilla de config con $PORT dinámico (Railway)
RUN printf 'server {\n\
    listen ${PORT};\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/templates/default.conf.template

# Eliminar config estática por defecto
RUN rm /etc/nginx/conf.d/default.conf

EXPOSE ${PORT}

CMD ["nginx", "-g", "daemon off;"]
