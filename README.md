#  Totem de Acesso - Reconhecimento Facial

Sistema profissional de reconhecimento de pessoas e autorização de acesso usando visão computacional e comparação biométrica.

## Especificação do Projeto

## Validação do Projeto

(validacao.md)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Vue.js - Totem)                               │
│ http://localhost:5173                                    │
│ - TelaCPF → TelaConfirmacao → TelaCaptura               │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP Requests (CORS)
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Backend (Express.js - Simula Empresa Terceira)         │
│ http://localhost:3000                                    │
│ - Gerencia dados biométricos                            │
│ - Compara rostos (hash perceptual)                      │
│ - Autoriza acesso (status = 'ativo')                    │
└────────────────┬────────────────────────────────────────┘
                 │ SQL Queries
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Banco de Dados (SQLite)                                 │
│ database.db                                              │
│ - pessoas (id, cpf, nome, foto, status)                │
│ - logs_acesso (cpf, resultado, similaridade)           │
└─────────────────────────────────────────────────────────┘
```

## ✨ Fluxo da Aplicação

```
1. TELA CPF
   ├─ Usuário insere CPF
   └─ Backend valida se CPF existe
      ↓
2. TELA CONFIRMAÇÃO
   ├─ Exibe foto da pessoa registrada
   ├─ Usuário confirma identidade
   └─ "SIM, SOU EU" → Próxima tela
      ↓
3. TELA CAPTURA (Biometria)
   ├─ Ativa câmera
   ├─ Detecta rosto com face-api.js
   ├─ Captura imagem
   ├─ Envia para backend
   └─ Backend compara com foto registrada
      ↓
4. RESULTADO
   ├─ Se similaridade >= 70%
   │  ├─ Aprova ✅
   │  ├─ Autoriza acesso (status='ativo')
   │  └─ Redireciona após 3s
   │
   └─ Se similaridade < 70%
      ├─ Rejeita ❌
      └─ Oferece opção de tentar novamente
```

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Câmera conectada

### 1️⃣ Instalar Backend

```bash
cd backend
npm install
```

### 2️⃣ Popular Banco com Dados de Teste

```bash
npm run seed
```

Isso cria 3 pessoas:
- `123.456.789-00` - GABRIEL ALVES DE OLIVEIRA
- `987.654.321-00` - ANA SILVA SANTOS  
- `111.222.333-44` - CARLOS PEREIRA COSTA

### 3️⃣ Iniciar Backend

Em um terminal:

```bash
npm run dev
```

Backend rodará em `http://localhost:3000`

### 4️⃣ Instalar Frontend

Em outro terminal:

```bash
cd frontend
npm install
```

### 5️⃣ Iniciar Frontend

```bash
npm run dev
```

Frontend rodará em `http://localhost:5173`

## 🧪 Testando

1. Acesse `http://localhost:5173`
2. Digite um dos CPFs de teste
3. Confirme a identidade
4. Posicione o rosto na câmera
5. Aguarde a comparação
6. Veja o resultado

## 📊 Tecnologias

### Frontend
- **Vue.js 3** - Framework reativo
- **Vue Router** - Navegação entre telas
- **Tailwind CSS** - Styling
- **face-api.js** - Detecção de rostos
- **Axios** - Comunicação com API

### Backend
- **Express.js** - Servidor HTTP
- **SQLite** - Banco de dados
- **Sharp** - Processamento de imagens
- **CORS** - Compartilhamento de recursos

## 🔍 Algoritmo de Comparação Facial

O sistema utiliza **Hash Perceptual (pHash)**:

1. **Redimensiona** imagem para 64x64 pixels
2. **Converte** para escala de cinza
3. **Divide** em 16 quadrantes (4x4)
4. **Calcula** média de brilho por quadrante
5. **Compara** padrões entre duas imagens
6. **Retorna** percentual de similaridade (0-100%)

**Threshold (Limiar):** 70%
- Padrão da indústria comercial
- Configurável em `backend/.env`

## 📡 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/saude` | Health check |
| GET | `/api/pessoas/:cpf` | Busca dados da pessoa |
| GET | `/api/pessoas/:cpf/foto` | Busca foto da pessoa |
| POST | `/api/comparar` | Compara dois rostos |
| PUT | `/api/autorizar/:cpf` | Autoriza acesso |
| PUT | `/api/revogar/:cpf` | Revoga acesso |
| GET | `/api/logs` | Busca logs de acesso |

## 🗄️ Banco de Dados

### Tabela `pessoas`
```sql
id INTEGER PRIMARY KEY
cpf TEXT UNIQUE
nome TEXT
foto BLOB
status TEXT ('ativo'|'inativo')
data_atualizacao DATETIME
criado_em DATETIME
```

### Tabela `logs_acesso`
```sql
id INTEGER PRIMARY KEY
cpf TEXT
resultado TEXT ('aprovado'|'rejeitado')
similaridade REAL
data_hora DATETIME
```

## 🔐 Segurança

- CORS habilitado apenas para frontend
- Validação de entrada em todos endpoints
- Logs de todas as tentativas
- Status de acesso controlado (ativo/inativo)

## 🛠️ Estrutura do Projeto

```
totem-acesso/
├── frontend/                    # Vue.js - Totem
│   ├── src/
│   │   ├── views/              # Telas
│   │   │   ├── TelaCPF.vue     # Entrada de CPF
│   │   │   ├── TelaConfirmacao.vue
│   │   │   └── TelaCaptura.vue # Captura biométrica
│   │   ├── services/
│   │   │   └── api.js          # Cliente HTTP
│   │   ├── router/
│   │   │   └── index.js        # Rotas
│   │   └── App.vue
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── backend/                     # Express.js - API
│   ├── src/
│   │   ├── models/
│   │   │   └── database.js     # SQLite
│   │   ├── services/
│   │   │   ├── pessoasService.js
│   │   │   └── faceRecognition.js
│   │   ├── routes/
│   │   │   └── api.js          # Endpoints
│   │   └── middleware/
│   │       └── errorHandler.js
│   ├── scripts/
│   │   └── seed.js             # Popular BD
│   ├── server.js               # Entrada
│   ├── package.json
│   ├── .env
│   └── README.md
│
└── README.md (este arquivo)
```

## 🚦 Troubleshooting

### Erro: "Pessoa não encontrada"
- Certifique-se que rodou `npm run seed` no backend
- Use um dos CPFs de teste

### Erro: "Câmera não acessível"
- Verifique permissões do navegador
- Teste com `chrome://settings/content/camera`

### Erro: "Servidor indisponível"
- Verifique se backend está rodando em `http://localhost:3000`
- Verifique porta 3000 em uso: `lsof -i :3000`

### Erro: CORS
- Certifique-se que `CORS_ORIGIN` no backend está correto
- Frontend padrão: `http://localhost:5173`

## 📈 Próximas Melhorias

- [ ] Autenticação JWT
- [ ] Dashboard de administração
- [ ] Modelo de deep learning (ResNet, VGG)
- [ ] Rate limiting
- [ ] Integração com catraca (webhook/evento)
- [ ] Docker/Docker Compose
- [ ] Backup automático
- [ ] Cache de embeddings


---

**Desenvolvedor:** Sistema de Reconhecimento Facial  
**Versão:** 1.0.0  
**Data:** Maio de 2026
