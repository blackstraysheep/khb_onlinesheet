FROM nginx:1.27-alpine

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/docker-entrypoint.d/10-generate-config.sh /docker-entrypoint.d/10-generate-config.sh
RUN chmod +x /docker-entrypoint.d/10-generate-config.sh

COPY index.html /usr/share/nginx/html/index.html
COPY html/ /usr/share/nginx/html/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY audio/ /usr/share/nginx/html/audio/
COPY audio_zundamon/ /usr/share/nginx/html/audio_zundamon/
