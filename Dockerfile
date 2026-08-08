FROM node:18-alpine

# Instalar dependencias necesarias para compilar paquetes nativos
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar primero package.json para aprovechar la cache de Docker
COPY package*.json ./

RUN npm install

# Copiar el resto del código
COPY . .

CMD ["npm", "start"]

