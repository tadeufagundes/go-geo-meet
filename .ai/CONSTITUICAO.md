# 📜 CONSTITUIÇÃO - Go Geo Meet v1.0

**Versão:** 1.0  
**Data:** 2025-12-20  
**Autor:** Go Geo Team

---

## 🎯 Visão

O **Go Geo Meet** é uma plataforma de videoconferência integrada ao ecossistema Go Geo Education, utilizando Jitsi público para garantir custo zero em chamadas de vídeo.

### Objetivos

1. **Custo Zero** em videoconferência (Jitsi público)
2. **Feedback Silencioso** para alunos indicarem dúvidas
3. **Presença Automática** com registro de entrada/saída
4. **Integração** com outras plataformas Go Geo
5. **Simplicidade** na interface do professor e aluno

---

## 💰 Política de Custos

> Este projeto usa **Firebase Blaze** para Cloud Functions, mas o video é **100% gratuito** via Jitsi público.

### Custos Esperados

| Serviço                 | Custo                     |
| ----------------------- | ------------------------- |
| **Jitsi (meet.jit.si)** | Gratuito                  |
| **Firebase Hosting**    | ~$0 (dentro do free tier) |
| **Firestore**           | ~$0-5/mês (uso leve)      |
| **Cloud Functions**     | ~$0-5/mês (uso leve)      |

### Práticas para Manter Custos Baixos

- ✅ Usar Jitsi público ao invés de servidor próprio
- ✅ Limitar queries do Firestore
- ✅ Usar listeners em tempo real apenas quando necessário
- ✅ Cleanup de sessões antigas

---

## 🏛️ Princípios Fundamentais

### 1. Type Safety Absoluto

- TypeScript Strict Mode em **100%** do código
- ✅ Zod para validação de dados em `src/schemas/`
- Interfaces bem definidas em `src/types/`

### 2. Performance por Design

- Bundle size otimizado (code splitting)
- Lazy loading de componentes pesados
- Jitsi carregado apenas quando necessário

### 3. Segurança

- Validação em client + Firestore Rules
- Autenticação via Firebase Auth
- Nenhum dado sensível no frontend

### 4. Experiência do Usuário

- Interface simples e intuitiva
- Feedback visual imediato
- Funciona bem em conexões lentas

---

## 🛠️ Stack Tecnológica

### Web App (Alunos) - `frontend/`

| Tecnologia   | Versão | Uso          |
| ------------ | ------ | ------------ |
| React        | 18.x   | Framework UI |
| Vite         | 5.x    | Bundler      |
| TypeScript   | 5.x    | Linguagem    |
| TailwindCSS  | 3.x    | Styling      |
| Lucide React | latest | Ícones       |
| React Router | 6.x    | Navegação    |

### Desktop App (Professores) - `desktop/`

| Tecnologia | Versão | Uso              |
| ---------- | ------ | ---------------- |
| Electron   | 37.x   | Framework        |
| React      | 17.x   | UI               |
| TypeScript | 5.x    | Linguagem        |
| Jitsi SDK  | 7.x    | Videoconferência |

### Backend/Infra

| Tecnologia       | Versão | Uso                         |
| ---------------- | ------ | --------------------------- |
| Firebase Auth    | 10.x   | Autenticação                |
| Firestore        | 10.x   | Banco de dados              |
| Cloud Functions  | Gen 2  | Backend (quando necessário) |
| Firebase Hosting | -      | Hospedagem Web App          |

### External

| Serviço    | URL         | Uso              |
| ---------- | ----------- | ---------------- |
| Jitsi Meet | meet.jit.si | Videoconferência |

---

## 📁 Estrutura de Pastas

```
Go Geo Meet (Jistsi)/
├── .ai/                    # 📚 Documentação Central (LEIA PRIMEIRO)
│   ├── INDEX.md           # Índice de documentos
│   ├── CONSTITUICAO.md    # Princípios e stack
│   ├── PRD.md             # Requisitos do produto
│   ├── ARCHITECTURE.md    # Diagramas
│   ├── CONVENTIONS.md     # Padrões de código
│   └── INTEGRATION.md     # Integração Firebase
│
├── frontend/               # Web App (Alunos)
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Páginas
│   │   ├── services/       # Lógica de negócio
│   │   └── types/          # TypeScript types
│   └── package.json
│
├── desktop/                # Desktop App (Professores)
│   ├── app/               # Código Electron
│   ├── resources/         # Ícones e assets
│   ├── main.js            # Entry point
│   └── package.json
│
├── firestore.rules         # Regras de segurança
└── firebase.json           # Configuração Firebase
```

> **Nota:** A pasta `.vscode/` está no `.gitignore` por design. Cada desenvolvedor pode configurar localmente.

---

## 📐 Padrões de Código

### Nomenclatura

| Tipo        | Padrão           | Exemplo             |
| ----------- | ---------------- | ------------------- |
| Componentes | PascalCase.tsx   | `GoGeoMeet.tsx`     |
| Hooks       | use{Name}.ts     | `useJitsi.ts`       |
| Services    | {name}Service.ts | `sessionService.ts` |
| Types       | {name}.types.ts  | `session.types.ts`  |

### Imports

1. React e libs externas
2. Types (com keyword `type`)
3. Hooks locais
4. Services
5. Componentes
6. Utils

### Componentes

- Componentes funcionais apenas
- Props tipadas com interface
- Hooks no topo
- Handlers antes do return

---

## 🔐 Segurança

### Firestore Rules

Todas as regras estão em `firestore.rules`:

- `meetSessions` - Apenas teacher pode criar/atualizar suas próprias
- `meetAttendance` - Qualquer um pode registrar presença
- `meetFeedback` - Qualquer um pode dar feedback

### Firebase Auth

- Autenticação opcional para alunos (podem entrar com nome apenas)
- Obrigatória para professores criar sessões
- Tokens validados no backend

---

## 🔗 Integração com Ecossistema

Este projeto **FAZ PARTE** do ecossistema Go Geo Education.

### Projeto Firebase

- Usar o projeto `gogeo-synapse` existente
- Collections com prefixo `meet*` para isolamento

### Collections Próprias

- `meetSessions` - Sessões de aula
- `meetAttendance` - Registros de presença
- `meetFeedback` - Feedback silencioso

### Formas de Integração

1. **Componente React** - Para apps React
2. **IFrame** - Para apps HTML/LARA
3. **SDK JavaScript** - Para integração programática

Ver `docs/INTEGRATION.md` para detalhes.

---

## ✅ Definition of Done

Uma feature só está pronta quando:

- [ ] Código segue padrões do `CONVENTIONS.md`
- [ ] TypeScript sem erros (`npm run build` passa)
- [ ] Testado localmente
- [ ] Deploy para Firebase Hosting funciona
- [ ] Documentação atualizada (se necessário)

---

## 📚 Referências

- [GoGeoMeet_PRD.md](./GoGeoMeet_PRD.md) - Requisitos do produto
- [GoGeoMeet_Flowchart.md](./GoGeoMeet_Flowchart.md) - Fluxo do sistema
- [docs/INTEGRATION.md](./docs/INTEGRATION.md) - Guia de integração
- [docs/API.md](./docs/API.md) - Documentação da API
- [PLAYBOOK CRIAR NOVAS PLATAFORMAS.md](./PLAYBOOK%20CRIAR%20NOVAS%20PLATAFORMAS.md) - Template para novos projetos

---

**"Projetos bem documentados = IA que entrega resultados melhores."**
