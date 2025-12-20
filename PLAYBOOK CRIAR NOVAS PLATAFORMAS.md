# 🚀 PLAYBOOK - Iniciando Novo Projeto AI-First

> Guia completo para criar novos projetos otimizados para desenvolvimento com agentes de IA (Vibe Coding)

---

## 📋 Índice

1. [Checklist Inicial](#-checklist-inicial)
2. [Decisões de Arquitetura](#-decisões-de-arquitetura)
3. [Estrutura de Pastas](#-estrutura-de-pastas)
4. [Configuração da Pasta .ai/](#-configuração-da-pasta-ai)
5. [Stack Tecnológica Recomendada](#-stack-tecnológica-recomendada)
6. [Configuração do VS Code](#-configuração-do-vs-code)
7. [Templates de Arquivos](#-templates-de-arquivos)
8. [Integração com Ecossistema](#-integração-com-ecossistema)

---

## ✅ Checklist Inicial

Antes de começar qualquer projeto, responda estas perguntas:

### 1. Definição do Projeto

- [ ] Qual o objetivo principal da plataforma?
- [ ] Quem são os usuários? (alunos, professores, admins)
- [ ] Faz parte do ecossistema Go Geo Education?
- [ ] Precisa compartilhar dados com outras plataformas?

### 2. Restrições de Custo

- [ ] **Custo Zero?** (Firebase Spark) → Sem Cloud Functions
- [ ] **Baixo Custo?** (Firebase Blaze) → Cloud Functions limitadas
- [ ] **Sem restrição?** → Arquitetura completa

### 3. Complexidade

- [ ] **Simples** (< 10 telas) → Next.js básico, sem monorepo
- [ ] **Médio** (10-30 telas) → Next.js + features folders
- [ ] **Complexo** (30+ telas) → Monorepo com Turborepo

### 4. Integrações

- [ ] Compartilha Firebase com outras plataformas?
- [ ] Precisa de APIs externas?
- [ ] Real-time é necessário?

---

## 🏗️ Decisões de Arquitetura

### Árvore de Decisão

```
┌─────────────────────────────────────────────────────────────┐
│                    INÍCIO DO PROJETO                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   Precisa de custo zero?      │
              └───────────────────────────────┘
                      │               │
                     SIM             NÃO
                      │               │
                      ▼               ▼
         ┌────────────────┐  ┌────────────────┐
         │ Firebase Spark │  │ Firebase Blaze │
         │ Client-Side    │  │ Cloud Functions│
         │ First          │  │ Permitido      │
         └────────────────┘  └────────────────┘
                      │               │
                      ▼               ▼
              ┌───────────────────────────────┐
              │   Faz parte do ecossistema?   │
              └───────────────────────────────┘
                      │               │
                     SIM             NÃO
                      │               │
                      ▼               ▼
         ┌────────────────┐  ┌────────────────┐
         │ Mesmo Firebase │  │ Firebase       │
         │ Project        │  │ Separado       │
         │ Collections    │  │                │
         │ Compartilhadas │  │                │
         └────────────────┘  └────────────────┘
```

### Matriz de Decisão de Stack

| Cenário                    | Framework           | State              | Backend | Database       |
| -------------------------- | ------------------- | ------------------ | ------- | -------------- |
| **Custo Zero + Simples**   | Next.js             | Zustand            | ❌ None | Firestore SDK  |
| **Custo Zero + Complexo**  | Next.js + Turborepo | Zustand + TanStack | ❌ None | Firestore SDK  |
| **Com Backend + Simples**  | Next.js             | Zustand            | tRPC    | Firestore      |
| **Com Backend + Complexo** | Next.js + Turborepo | Zustand + TanStack | tRPC    | Firestore + CF |

---

## 📁 Estrutura de Pastas

### Template: Custo Zero (Sem Cloud Functions)

```
projeto/
├── .ai/                        # 🤖 Contexto para IA (OBRIGATÓRIO)
│   ├── AGENTS.md               # Persona, stack, boundaries
│   ├── ARCHITECTURE.md         # Diagramas mermaid
│   ├── CONVENTIONS.md          # Padrões de código
│   ├── WORKFLOWS.md            # Processos de trabalho
│   └── INTEGRATION.md          # Se fizer parte do ecossistema
│
├── src/                        # Código fonte
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Rotas autenticadas
│   │   ├── (public)/           # Rotas públicas
│   │   └── layout.tsx
│   │
│   ├── features/               # ⭐ VERTICAL SLICES
│   │   └── [feature-name]/
│   │       ├── components/     # Componentes React
│   │       ├── hooks/          # React hooks
│   │       ├── services/       # Lógica de negócio (Firestore)
│   │       ├── schemas/        # Zod schemas
│   │       └── index.ts        # Barrel export
│   │
│   ├── components/             # Componentes globais
│   │   └── ui/                 # shadcn/ui
│   │
│   └── lib/                    # Utilities
│       ├── firebase/           # Firebase config
│       ├── utils/              # Helpers
│       └── services/           # Services compartilhados
│
├── CONSTITUICAO.md             # 📜 Documento de arquitetura
├── firestore.rules             # Regras de segurança
└── package.json
```

### Template: Com Backend (Cloud Functions)

```
projeto/
├── .ai/                        # 🤖 Contexto para IA
│   └── ...
│
├── apps/
│   └── web/                    # Next.js App
│       ├── app/
│       └── features/
│
├── packages/
│   ├── shared/                 # Types + Schemas
│   ├── ui/                     # Componentes UI
│   └── api/                    # tRPC Router
│
├── functions/                  # Cloud Functions
│   └── src/
│
├── CONSTITUICAO.md
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 🤖 Configuração da Pasta .ai/

### Arquivos Obrigatórios

Crie TODOS estes arquivos no início do projeto:

#### 1. AGENTS.md (Template)

```markdown
# 🤖 AGENTS.md - Contexto para Agentes de IA

## Persona

Você é um desenvolvedor sênior trabalhando no **[NOME_DO_PROJETO]** - [DESCRIÇÃO_CURTA].
Seu código deve ser limpo, type-safe e seguir os padrões definidos na CONSTITUICAO.md.

## ⚠️ Restrições Críticas

[SE CUSTO ZERO:]
Este projeto opera no **Firebase Plano Spark** (gratuito). Você **NÃO PODE**:

- ❌ Usar Cloud Functions
- ❌ Usar Firebase Extensions
- ❌ Sugerir soluções que requeiram backend server

[SE COM BACKEND:]
Este projeto usa Cloud Functions. Lógica sensível deve ir para o backend.

## Tech Stack

| Camada    | Tecnologia                   |
| --------- | ---------------------------- |
| Framework | [Next.js 15.x / Vite / etc]  |
| Linguagem | TypeScript 5.x (Strict Mode) |
| ...       | ...                          |

## Estrutura de Pastas

[COPIAR ESTRUTURA REAL DO PROJETO]

## Comandos Permitidos

[LISTAR COMANDOS DO PACKAGE.JSON]

## Boundaries (NÃO Modificar)

🚫 **Arquivos que você NÃO deve modificar sem permissão:**

- `firestore.rules`
- `firebase.json`
- `.env*`
- `CONSTITUICAO.md`
```

#### 2. ARCHITECTURE.md (Template)

```markdown
# 🏗️ ARCHITECTURE.md - Diagrama de Sistema

## Visão Geral

\`\`\`mermaid
graph TB
[CRIAR DIAGRAMA DO SISTEMA]
\`\`\`

## Fluxo de Dados

\`\`\`mermaid
sequenceDiagram
[CRIAR FLUXO]
\`\`\`

## Firestore Collections

\`\`\`mermaid
erDiagram
[CRIAR ER DIAGRAM]
\`\`\`
```

#### 3. CONVENTIONS.md (Template)

```markdown
# 📏 CONVENTIONS.md - Padrões de Código

## Nomenclatura de Arquivos

| Tipo        | Padrão                  | Exemplo           |
| ----------- | ----------------------- | ----------------- |
| Componentes | `kebab-case.tsx`        | `user-card.tsx`   |
| Hooks       | `use-kebab-case.ts`     | `use-user.ts`     |
| Services    | `kebab-case.service.ts` | `user.service.ts` |
| Schemas     | `kebab-case.schema.ts`  | `user.schema.ts`  |

## Estrutura de Componentes

[DEFINIR PADRÃO]

## Imports Order

[DEFINIR ORDEM]
```

#### 4. WORKFLOWS.md (Template)

```markdown
# 🔄 WORKFLOWS.md - Fluxos de Desenvolvimento

## Nova Feature

[PASSOS PARA CRIAR NOVA FEATURE]

## Deploy

[COMANDOS DE DEPLOY]

## Debugging

[DICAS DE DEBUG]
```

---

## 🛠️ Stack Tecnológica Recomendada

### Tier 1: Essenciais (Sempre usar)

| Categoria     | Tecnologia      | Justificativa               |
| ------------- | --------------- | --------------------------- |
| **Framework** | Next.js 15+     | App Router, RSC, melhor DX  |
| **Linguagem** | TypeScript 5+   | Type safety absoluto        |
| **Styling**   | Tailwind CSS 4+ | Utility-first, zero runtime |
| **UI**        | shadcn/ui       | Acessível, customizável     |
| **Validação** | Zod             | Schema + Types unificados   |
| **Icons**     | Lucide React    | Tree-shakeable              |

### Tier 2: State & Data

| Categoria        | Tecnologia      | Quando usar              |
| ---------------- | --------------- | ------------------------ |
| **State Global** | Zustand         | Sempre                   |
| **Server State** | TanStack Query  | Quando há cache complexo |
| **Forms**        | React Hook Form | Formulários complexos    |

### Tier 3: Backend (Se permitido)

| Categoria     | Tecnologia            | Quando usar         |
| ------------- | --------------------- | ------------------- |
| **API**       | tRPC                  | Com Cloud Functions |
| **Auth**      | Firebase Auth         | Sempre              |
| **Database**  | Firestore             | Sempre              |
| **Functions** | Cloud Functions Gen 2 | Se Blaze            |

### Tier 4: Qualidade

| Categoria  | Tecnologia | Quando usar     |
| ---------- | ---------- | --------------- |
| **Lint**   | ESLint     | Sempre          |
| **Format** | Prettier   | Sempre          |
| **Test**   | Vitest     | Unit tests      |
| **E2E**    | Playwright | Testes críticos |

---

## 💻 Configuração do VS Code

### Extensions Recomendadas

Criar arquivo `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker",
    "streetsidesoftware.code-spell-checker-portuguese-brazilian"
  ]
}
```

### Settings

Criar arquivo `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### Snippets para IA

Criar arquivo `.vscode/ai-prompts.code-snippets`:

```json
{
  "New Feature Request": {
    "prefix": "ai-feature",
    "body": [
      "Crie uma nova feature chamada '$1' seguindo os padrões em:",
      "- `.ai/CONVENTIONS.md` para nomenclatura",
      "- `.ai/WORKFLOWS.md` para estrutura",
      "- `CONSTITUICAO.md` para arquitetura",
      "",
      "A feature deve:",
      "- $2"
    ]
  },
  "Debug Request": {
    "prefix": "ai-debug",
    "body": [
      "Preciso de ajuda para debugar o seguinte problema:",
      "",
      "**Erro:** $1",
      "**Arquivo:** $2",
      "**Comportamento esperado:** $3",
      "**Comportamento atual:** $4"
    ]
  }
}
```

---

## 📄 Templates de Arquivos

### CONSTITUICAO.md (Template Inicial)

```markdown
# 📜 CONSTITUIÇÃO - [NOME_DO_PROJETO] v1.0

**Versão:** 1.0  
**Data:** [DATA]  
**Autor:** Go Geo Team

---

## 🎯 Visão

[DESCRIÇÃO DO PROJETO]

---

## 💰 Política de Custos

[SE CUSTO ZERO:]

> Este projeto opera 100% no Firebase Plano Spark (gratuito).

[SE BLAZE:]

> Este projeto usa Firebase Blaze com orçamento limitado de R$ X/mês.

---

## 🏛️ Princípios Fundamentais

### Type Safety Absoluto

- TypeScript Strict Mode em 100% do código
- Zod para validação

### Performance por Design

- Lighthouse Score ≥ 95
- Core Web Vitals como KPIs

### Segurança

- Validação em client + Firestore Rules
- Zero trust

---

## 🛠️ Stack Tecnológica

[PREENCHER COM STACK ESCOLHIDA]

---

## 📁 Estrutura de Pastas

[PREENCHER COM ESTRUTURA]

---

## 📐 Padrões de Código

[COPIAR DE CONVENTIONS.md]
```

### firestore.rules (Template Inicial)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helpers
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Users
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // TODO: Adicionar regras conforme collections são criadas
  }
}
```

---

## 🔗 Integração com Ecossistema

### Se o projeto FAZ PARTE do ecossistema Go Geo:

1. **Usar MESMO projeto Firebase** que Synapse/Gamification
2. **Respeitar collections compartilhadas:**

   - `/students/{uid}` - XP, Coins, Level
   - `/shop/` - Itens e compras
   - `/rankings/` - Leaderboards

3. **Criar arquivo `.ai/INTEGRATION.md`** documentando:

   - Quais collections lê/escreve
   - Qual o `source` identifier (ex: `"presentation"`)
   - Dependências de dados

4. **Atualizar Firestore Rules** para a nova plataforma

### Se o projeto NÃO FAZ PARTE do ecossistema:

1. **Criar projeto Firebase separado**
2. **Não usar collections com nomes conflitantes**
3. **Documentar se há planos futuros de integração**

---

## 🚀 Comandos para Iniciar

### 1. Criar Projeto Next.js

```bash
npx create-next-app@latest nome-projeto --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd nome-projeto
```

### 2. Instalar Dependências Base

```bash
# UI
pnpm add @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react

# State
pnpm add zustand @tanstack/react-query

# Validation
pnpm add zod react-hook-form @hookform/resolvers

# Firebase
pnpm add firebase

# Dev
pnpm add -D @types/node
```

### 3. Criar Estrutura de Pastas

```bash
# Pasta .ai
mkdir -p .ai
touch .ai/AGENTS.md .ai/ARCHITECTURE.md .ai/CONVENTIONS.md .ai/WORKFLOWS.md

# Features
mkdir -p src/features
mkdir -p src/components/ui
mkdir -p src/lib/firebase src/lib/utils src/lib/services

# Docs
touch CONSTITUICAO.md
touch firestore.rules
```

### 4. Configurar Firebase

```bash
# Instalar Firebase CLI (se não tiver)
npm install -g firebase-tools

# Login
firebase login

# Inicializar (selecionar Firestore, Hosting, Auth)
firebase init
```

### 5. Preencher Documentos .ai/

Use os templates acima para preencher cada arquivo.

---

## ✅ Checklist Final

Antes de começar a desenvolver features, confirme:

- [ ] `.ai/AGENTS.md` preenchido com stack e restrições
- [ ] `.ai/ARCHITECTURE.md` com diagrama inicial
- [ ] `.ai/CONVENTIONS.md` com padrões definidos
- [ ] `.ai/WORKFLOWS.md` com processos documentados
- [ ] `CONSTITUICAO.md` com visão e princípios
- [ ] `firestore.rules` com regras básicas
- [ ] VS Code configurado com extensions e settings
- [ ] Firebase inicializado
- [ ] Estrutura de pastas criada
- [ ] Primeira feature de exemplo funcionando

---

**"Projetos bem documentados = IA que entrega resultados melhores."**
