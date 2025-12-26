# Go Geo Meet

Plataforma de videoconferência integrada ao ecossistema Go Geo, usando Jitsi público (custo zero).

## Funcionalidades

- **Videoconferência**: Salas Jitsi com nome e senha gerados automaticamente
- **Feedback Silencioso**: Alunos podem indicar dúvidas sem interromper
- **Presença Automática**: Registro de entrada/saída dos participantes
- **Sorteador de Alunos**: Professor pode sortear aluno aleatoriamente
- **Painel do Professor**: Lista de participantes e indicadores de dúvida
- **Compartilhamento de Áudio**: Professor compartilha tela + áudio do sistema

## Arquitetura

| Componente                   | Usuário     | Descrição                          |
| ---------------------------- | ----------- | ---------------------------------- |
| **Web App** (`frontend/`)    | Alunos      | React + Vite, embarcado na Synapse |
| **Desktop App** (`desktop/`) | Professores | Electron, com painel de controle   |

## Estrutura

```
Go Geo Meet (Jistsi)/
├── frontend/           # Web App: React + Vite (Alunos)
├── desktop/            # Desktop App: Electron (Professores)
├── firebase.json       # Configuração Firebase
├── firestore.rules     # Regras de segurança
└── firestore.indexes.json
```

> [!CAUTION] > **Regras Firebase Compartilhadas:** Este projeto usa o mesmo projeto Firebase da Synapse.
> Antes de fazer deploy de regras, leia: [.ai/FIRESTORE_RULES.md](.ai/FIRESTORE_RULES.md)

## 📚 Documentação

> **TODA a documentação está consolidada na pasta `.ai/`**
>
> Para garantir 100% de aderência aos padrões, sempre leia: [.ai/INDEX.md](.ai/INDEX.md)

| Documento                                  | Descrição                      |
| ------------------------------------------ | ------------------------------ |
| [.ai/INDEX.md](.ai/INDEX.md)               | Índice central de documentação |
| [.ai/CONSTITUICAO.md](.ai/CONSTITUICAO.md) | Princípios e stack             |
| [.ai/PRD.md](.ai/PRD.md)                   | Requisitos do produto          |
| [.ai/CONVENTIONS.md](.ai/CONVENTIONS.md)   | Padrões de código              |

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

| Método | Endpoint                             | Descrição          |
| ------ | ------------------------------------ | ------------------ |
| POST   | `/api/v1/meet/sessions`              | Criar sessão       |
| GET    | `/api/v1/meet/sessions`              | Listar sessões     |
| GET    | `/api/v1/meet/sessions/:id`          | Detalhes da sessão |
| PATCH  | `/api/v1/meet/sessions/:id/start`    | Iniciar sessão     |
| PATCH  | `/api/v1/meet/sessions/:id/end`      | Encerrar sessão    |
| POST   | `/api/v1/meet/sessions/:id/join`     | Registrar entrada  |
| POST   | `/api/v1/meet/sessions/:id/leave`    | Registrar saída    |
| POST   | `/api/v1/meet/sessions/:id/feedback` | Toggle dúvida      |
| GET    | `/api/v1/meet/sessions/:id/feedback` | Listar dúvidas     |

## Configuração

1. Copiar `.env.example` para `.env` no frontend
2. Preencher credenciais Firebase
3. Usar mesmo projeto `gogeo-synapse`

## Stack

- **Frontend**: React, Vite, TypeScript, TailwindCSS, lucide-react
- **Backend**: Firebase Cloud Functions, Express, TypeScript
- **Banco**: Firestore
- **Video**: Jitsi Meet (público)
