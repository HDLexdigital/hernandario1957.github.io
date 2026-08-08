# Imagen base ligera de Node.js
FROM node:18-alpine

# Instalar dependencias necesarias para compilar paquetes nativos
RUN apk add --no-cache python3 make g++

# Definir directorio de trabajo
WORKDIR /app

# Copiar primero los archivos de dependencias para aprovechar la cache
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Exponer el puerto que usará la aplicación (Cloud Run usa 8080 por defecto)
EXPOSE 8080

# Comando de inicio
CMD ["npm", "start"]
