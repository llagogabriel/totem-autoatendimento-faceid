# Backend - Totem de Acesso com Reconhecimento Facial

Backend profissional que simula a comunicação com a empresa terceira responsável pelos dados biométricos.

## 🎯 Funcionalidades

- ✅ Cadastro de pessoas (CPF, Nome, Foto)
- ✅ Comparação de rostos com técnicas de visão computacional
- ✅ Autorização/Revogação de acesso
- ✅ Logs de tentativas de acesso
- ✅ Health check
- ✅ CORS configurável

## 🚀 Instalação

```bash
cd backend
npm install
```

## ⚙️ Configuração

Editar `.env`:

```env
PORT=3000                           # Porta do servidor
NODE_ENV=development               # Ambiente
DB_PATH=./database.db              # Caminho do banco SQLite
SIMILARITY_THRESHOLD=99            # Threshold mínimo (%)
CORS_ORIGIN=http://localhost:5173 # Origem permitida (frontend)
```

## 🎬 Iniciar Servidor

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

## 🌱 Popular Banco com Dados de Teste

```bash
npm run seed
```

Isso cria 3 pessoas de teste:
- CPF: `123.456.789-00` - GABRIEL ALVES DE OLIVEIRA
- CPF: `987.654.321-00` - ANA SILVA SANTOS
- CPF: `111.222.333-44` - CARLOS PEREIRA COSTA

## 📡 Endpoints da API

### 1. Health Check
```
GET /api/saude
```

Resposta:
```json
{
  "status": "online",
  "timestamp": "2026-05-15T10:30:00.000Z",
  "ambiente": "development"
}
```

### 2. Buscar Pessoa
```
GET /api/pessoas/:cpf
```

Parâmetros:
- `cpf`: CPF da pessoa (ex: `123.456.789-00`)

Resposta:
```json
{
  "id": 1,
  "cpf": "123.456.789-00",
  "nome": "GABRIEL ALVES DE OLIVEIRA",
  "status": "inativo",
  "temFoto": true
}
```

### 3. Buscar Foto
```
GET /api/pessoas/:cpf/foto
```

Resposta:
```json
{
  "foto": "data:image/png;base64,iVBORw0KGgoAAAA..."
}
```

### 4. Comparar Rostos
```
POST /api/comparar
```

Body:
```json
{
  "cpf": "123.456.789-00",
  "fotoCapturaBase64": "data:image/jpeg;base64,/9j/4AAQSkZJ..."
}
```

Resposta (Aprovado):
```json
{
  "aprovado": true,
  "similaridade": 99.5,
  "threshold": 99,
  "mensagem": "Rosto reconhecido com sucesso"
}
```

Resposta (Rejeitado):
```json
{
  "aprovado": false,
  "similaridade": 85.3,
  "threshold": 99,
  "mensagem": "Similaridade abaixo do threshold (85.30% < 99%)"
}
```

### 5. Autorizar Acesso
```
PUT /api/autorizar/:cpf
```

Resposta:
```json
{
  "cpf": "123.456.789-00",
  "status": "ativo",
  "mensagem": "Pessoa autorizada com sucesso"
}
```

### 6. Revogar Acesso
```
PUT /api/revogar/:cpf
```

Resposta:
```json
{
  "cpf": "123.456.789-00",
  "status": "inativo",
  "mensagem": "Acesso revogado"
}
```

### 7. Buscar Logs
```
GET /api/logs?cpf=123.456.789-00&limite=50
```

Query Parameters (opcionais):
- `cpf`: Filtrar por CPF
- `limite`: Número máximo de registros (padrão: 50)

Resposta:
```json
{
  "total": 2,
  "logs": [
    {
      "id": 1,
      "cpf": "123.456.789-00",
      "resultado": "aprovado",
      "similaridade": 99.5,
      "data_hora": "2026-05-15T10:30:00.000Z"
    }
  ]
}
```

## 📊 Banco de Dados

### Tabela `pessoas`
```sql
CREATE TABLE pessoas (
  id INTEGER PRIMARY KEY,
  cpf TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  foto BLOB NOT NULL,
  status TEXT DEFAULT 'inativo' CHECK(status IN ('ativo', 'inativo')),
  data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Tabela `logs_acesso`
```sql
CREATE TABLE logs_acesso (
  id INTEGER PRIMARY KEY,
  cpf TEXT NOT NULL,
  resultado TEXT NOT NULL,
  similaridade REAL,
  data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(cpf) REFERENCES pessoas(cpf)
)
```

## 🔍 Algoritmo de Comparação Facial

O sistema utiliza:

1. **Hash Perceptual (pHash)**
   - Redimensiona imagem para 64x64 pixels
   - Converte para escala de cinza
   - Divide em 16 quadrantes
   - Calcula média de brilho por quadrante
   - Cria um hash binário

2. **Cálculo de Similaridade**
   - Compara bits do hash entre duas imagens
   - Retorna percentual de correspondência (0-100%)
   - Threshold padrão: **99%** (padrão comercial)

## 🔒 Segurança

- CORS habilitado apenas para frontend
- Validação de entrada em todos os endpoints
- Logs de todas as tentativas de acesso
- Status de acesso controlado (ativo/inativo)

## 🛠️ Desenvolvimento

Estrutura do projeto:

```
backend/
├── server.js                    # Entrada principal
├── package.json
├── .env                         # Configurações
├── .gitignore
├── database.db                  # SQLite (gerado)
│
├── src/
│   ├── models/
│   │   └── database.js         # Conexão SQLite
│   │
│   ├── services/
│   │   ├── faceRecognition.js  # Comparação de rostos
│   │   └── pessoasService.js   # Lógica de negócio
│   │
│   ├── routes/
│   │   └── api.js              # Endpoints
│   │
│   └── middleware/
│       └── errorHandler.js     # Tratamento de erros
│
└── scripts/
    └── seed.js                  # Populate BD
```

## 🎓 Próximas Melhorias

- [ ] Usar modelo deep learning (face-recognition.js)
- [ ] Autenticação JWT
- [ ] Rate limiting
- [ ] Integração com catraca (webhook/evento)
- [ ] Dashboard de administração
- [ ] Backup automático do BD
- [ ] Docker

---

**Desenvolvido para Totem de Acesso com Reconhecimento Facial**
