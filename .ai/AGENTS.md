# 🤖 AGENTS.md - Contexto para Agentes de IA

## Persona

Você é um desenvolvedor sênior trabalhando no **Go Geo Meet** - uma plataforma de videoconferência integrada ao ecossistema Go Geo, usando Jitsi público (custo zero).

Seu código deve ser limpo, type-safe e seguir os padrões definidos na CONSTITUICAO.md.

---

## ⚠️ Restrições Críticas

Este projeto usa **Firebase Blaze** com Cloud Functions. Porém, para manter custos baixos:

- ✅ Cloud Functions são permitidas, mas devem ser eficientes
- ✅ Jitsi público (meet.jit.si) para videoconferência - custo zero
- ⚠️ Evitar operações pesadas no Firestore
- ⚠️ Manter bundle size pequeno no frontend

---

## 🛠️ Tech Stack

| Camada                 | Tecnologia                        |
| ---------------------- | --------------------------------- |
| **Framework Frontend** | Vite + React 18.x                 |
| **Linguagem**          | TypeScript 5.x (Strict Mode)      |
| **Styling**            | TailwindCSS 3.x                   |
| **Icons**              | Lucide React                      |
| **State**              | React Hooks (useState, useEffect) |
| **Auth**               | Firebase Auth                     |
| **Database**           | Firestore                         |
| **Video**              | Jitsi Meet API (público)          |
| **Hosting**            | Firebase Hosting                  |
| **Backend**            | Cloud Functions (Express)         |

---

## 📁 Estrutura de Pastas

```
Go Geo Meet (Jistsi)/
├── .ai/                    # 🤖 Contexto para IA
├── docs/                   # Documentação
│   ├── API.md
│   └── INTEGRATION.md
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   │   ├── GoGeoMeet.tsx     # Componente principal
│   │   │   ├── jitsi/            # Wrapper do Jitsi
│   │   │   ├── student/          # UI do aluno
│   │   │   └── teacher/          # UI do professor
│   │   ├── hooks/          # React Hooks customizados
│   │   │   ├── useAuth.ts
│   │   │   ├── useFeedback.ts
│   │   │   ├── useJitsi.ts
│   │   │   └── useSessions.ts
│   │   ├── pages/          # Páginas da aplicação
│   │   │   ├── LoginPage.tsx
│   │   │   ├── StudentRoom.tsx
│   │   │   ├── TeacherDashboard.tsx
│   │   │   └── TeacherRoom.tsx
│   │   ├── schemas/        # ⭐ Zod Schemas (validação)
│   │   │   ├── session.schema.ts
│   │   │   ├── attendance.schema.ts
│   │   │   ├── feedback.schema.ts
│   │   │   ├── user.schema.ts
│   │   │   └── index.ts
│   │   ├── services/       # Serviços (Firebase)
│   │   │   ├── sessionService.ts
│   │   │   ├── attendanceService.ts
│   │   │   └── feedbackService.ts
│   │   ├── types/          # TypeScript types
│   │   │   └── index.ts
│   │   ├── firebase.ts     # Configuração Firebase
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── CONSTITUICAO.md         # 📜 Documento de arquitetura
├── firestore.rules         # Regras de segurança
└── firebase.json           # Configuração Firebase
```

---

## 🔧 Comandos Permitidos

```bash
# Frontend
cd frontend && npm run dev      # Desenvolvimento
cd frontend && npm run build    # Build produção
cd frontend && npm run preview  # Preview do build

# Deploy
firebase deploy --only hosting  # Deploy frontend
firebase deploy --only firestore:rules  # Deploy regras

# Emuladores
firebase emulators:start        # Iniciar emuladores locais
```

---

## 🚫 Boundaries (NÃO Modificar sem Permissão)

Arquivos que você **NÃO deve modificar** sem autorização explícita:

- `firestore.rules` - Regras de segurança (impacta toda aplicação)
- `firebase.json` - Configuração do projeto
- `.env*` - Variáveis de ambiente
- `CONSTITUICAO.md` - Documento de arquitetura
- `schema.prisma` - Schema do banco (se usado)

---

## 📚 Referências Importantes

- **PRD**: `GoGeoMeet_PRD.md` - Requisitos do produto
- **Flowchart**: `GoGeoMeet_Flowchart.md` - Fluxo do sistema
- **Integração**: `docs/INTEGRATION.md` - Como integrar com outras apps
- **API**: `docs/API.md` - Endpoints disponíveis

---

## 🎯 Foco do Projeto

1. **Simplicidade**: Usar Jitsi público, sem servidor próprio
2. **Integração**: Fazer parte do ecossistema Go Geo
3. **Feedback Silencioso**: Alunos indicam dúvidas sem interromper
4. **Presença Automática**: Registro de entrada/saída
5. **Zero Custo de Video**: Jitsi público = gratuito
