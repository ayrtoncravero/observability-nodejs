# 1. Utiliza una imagen base con Node.js
FROM node:18-alpine

# 2. Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copia los archivos package.json y package-lock.json
COPY package*.json ./

# 4. Instala las dependencias
RUN npm install --force

# 5. Copia el resto del código fuente de la aplicación
COPY . .

# 6. Compila el TypeScript
RUN npm run build

# 7. Expone el puerto en el que se ejecutará la aplicación
EXPOSE 3000

# 8. Define el comando para iniciar la aplicación
CMD ["node", "start"]