#!/bin/sh
set -e

cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen ${PORT};
    listen [::]:${PORT} ipv6only=on;
    root /usr/share/nginx/html;
    index index.html;
    include /etc/nginx/mime.types;
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

exec nginx -g "daemon off;"
