# Imagen base ligera de Nginx
FROM nginx:alpine

# Copiar todo el contenido de la carpeta public (HTML, CSS, JS, EPUB, PDF, imágenes)
COPY ./public /usr/share/nginx/html

# Exponer el puerto 8080 (Cloud Run usa este puerto por defecto)
EXPOSE 8080

# Configuración de Nginx: mantenerlo en primer plano
CMD ["nginx", "-g", "daemon off;"]
