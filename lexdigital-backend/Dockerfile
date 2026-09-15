# Usamos una imagen oficial y ligera de Node.js
FROM node:20-slim

# Creamos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos solo las dependencias de producción
RUN npm ci --only=production

# Copiamos el resto del código del backend
COPY server.js ./

# Cloud Run inyecta dinámicamente la variable PORT (por defecto 8080)
ENV PORT=8080
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["npm", "start"]
