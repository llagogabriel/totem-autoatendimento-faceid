FROM node:22-alpine

WORKDIR /app

# Copiar package.json
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm install

# Copiar código
COPY . .

# Expor porta
EXPOSE 3000

# Seed database na inicialização
RUN npm run seed || true

# Iniciar servidor
CMD ["npm", "start"]
