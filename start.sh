#!/bin/bash

# Script para iniciar o Totem de Acesso com Reconhecimento Facial

echo "🚀 Iniciando Totem de Acesso..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js encontrado$(node --version)${NC}"
echo ""

# Verificar se porta 3000 está em uso
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Porta 3000 já está em uso${NC}"
fi

# Verificar se porta 5173 está em uso
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Porta 5173 já está em uso${NC}"
fi

echo ""
echo -e "${YELLOW}Configuração:${NC}"
echo "  Backend: http://localhost:3000"
echo "  Frontend: http://localhost:5173"
echo ""

# Perguntar se quer popular BD
read -p "Deseja popular o banco com dados de teste? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🌱 Populando banco de dados..."
    cd backend && npm run seed && cd ..
    echo ""
fi

echo -e "${GREEN}📌 Iniciando servidor backend e frontend...${NC}"
echo ""
echo "Pressione Ctrl+C para parar"
echo ""

# Iniciar backend e frontend em paralelo
(cd backend && npm run dev) &
BACKEND_PID=$!

sleep 2

(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Trap para limpar ao sair
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait
