# Go Geo Meet

Plataforma de videoconferência integrada ao ecossistema Go Geo, usando Jitsi público (custo zero).

## Funcionalidades

- **Videoconferência**: Salas Jitsi com nome e senha gerados automaticamente
- **Feedback Silencioso**: Alunos podem indicar dúvidas sem interromper
- **Presença Automática**: Registro de entrada/saída dos participantes
- **Sorteador de Alunos**: Professor pode sortear aluno aleatoriamente
- **Painel do Professor**: Lista de participantes e indicadores de dúvida

## Estrutura

```
Go Geo Meet (Jistsi)/
├── frontend/           # React + Vite + TypeScript
├── backend/            # Cloud Functions
├── firebase.json       # Configuração Firebase
├── firestore.rules     # Regras de segurança
└── firestore.indexes.json
```

## Início Rápido

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run build
```

### Emuladores Firebase
```bash
firebase emulators:start
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/meet/sessions` | Criar sessão |
| GET | `/api/v1/meet/sessions` | Listar sessões |
| GET | `/api/v1/meet/sessions/:id` | Detalhes da sessão |
| PATCH | `/api/v1/meet/sessions/:id/start` | Iniciar sessão |
| PATCH | `/api/v1/meet/sessions/:id/end` | Encerrar sessão |
| POST | `/api/v1/meet/sessions/:id/join` | Registrar entrada |
| POST | `/api/v1/meet/sessions/:id/leave` | Registrar saída |
| POST | `/api/v1/meet/sessions/:id/feedback` | Toggle dúvida |
| GET | `/api/v1/meet/sessions/:id/feedback` | Listar dúvidas |

## Configuração

1. Copiar `.env.example` para `.env` no frontend
2. Preencher credenciais Firebase
3. Usar mesmo projeto `gogeo-synapse`

## Stack

- **Frontend**: React, Vite, TypeScript, TailwindCSS, lucide-react
- **Backend**: Firebase Cloud Functions, Express, TypeScript
- **Banco**: Firestore
- **Video**: Jitsi Meet (público)
