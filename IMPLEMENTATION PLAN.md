Go Geo Meet - Plano de Implementação
Visão Geral
Desenvolver o Go Geo Meet como uma aplicação web independente que integra o Jitsi público para videoconferência, com funcionalidades pedagógicas personalizadas (feedback silencioso, presença automática, sorteador de alunos).

Decisões Arquiteturais
Stack Tecnológica
Camada	Tecnologia	Justificativa
Frontend	React + Vite + TypeScript	Alinhado com ecossistema Go Geo 3
Estilização	TailwindCSS + lucide-react	Identidade visual padronizada
Backend	Firebase Cloud Functions	Custo baixo, escalável, já usado no ecossistema
Banco de Dados	Firestore	Tempo real, integração nativa com Firebase
Videoconferência	Jitsi Meet (público)	Custo zero, API robusta
Autenticação	Firebase Auth	Reutiliza credenciais do ecossistema
Jitsi - Opções de Integração
Frontend Go Geo Meet
Integração Jitsi
IFrame API
External API
Mais simples
Customização visual limitada
Controle total
Acesso a eventos
Escolha: External API - Permite capturar eventos de entrada/saída de participantes e personalizar a interface.

Estrutura do Projeto
Go Geo Meet (Jistsi)/
├── frontend/                    # Aplicação React
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Botões, Cards, Modals
│   │   │   ├── jitsi/          # Wrapper do Jitsi
│   │   │   │   └── JitsiMeet.tsx
│   │   │   ├── teacher/        # Componentes do professor
│   │   │   │   ├── TeacherPanel.tsx
│   │   │   │   ├── ParticipantsList.tsx
│   │   │   │   └── StudentPicker.tsx
│   │   │   └── student/        # Componentes do aluno
│   │   │       └── FeedbackButton.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── TeacherDashboard.tsx
│   │   │   ├── TeacherRoom.tsx
│   │   │   └── StudentRoom.tsx
│   │   ├── hooks/
│   │   │   ├── useJitsi.ts     # Hook para API do Jitsi
│   │   │   └── useFeedback.ts  # Hook para feedback silencioso
│   │   ├── services/
│   │   │   ├── api.ts          # Cliente HTTP
│   │   │   ├── sessionService.ts
│   │   │   └── feedbackService.ts
│   │   ├── types/
│   │   │   └── index.ts        # Tipos TypeScript
│   │   └── firebase.ts
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                     # Cloud Functions
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── sessionController.ts
│   │   │   ├── attendanceController.ts
│   │   │   └── feedbackController.ts
│   │   ├── middlewares/
│   │   │   └── auth.ts
│   │   ├── utils/
│   │   │   └── roomNameGenerator.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                      # Tipos partilhados (opcional)
│   └── types.ts
│
├── docs/
│   ├── INTEGRATION.md          # Guia de integração
│   └── API.md                  # Documentação da API
│
├── GoGeoMeet_PRD.md            # Já existente
├── GoGeoMeet_Flowchart.md      # Já existente
└── schema.prisma               # Já existente (referência)
Modelo de Dados (Firestore)
Collection: classSessions
interface ClassSession {
  id: string;
  turmaId: string;           // Referência à turma
  teacherId: string;         // UID do professor
  jitsiRoomName: string;     // Nome único da sala (ex: "GoGeo-xyz123")
  jitsiRoomPassword: string; // Senha gerada automaticamente
  status: 'scheduled' | 'live' | 'completed';
  scheduledAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
Collection: attendanceLogs
interface AttendanceLog {
  id: string;
  sessionId: string;
  alunoId: string;
  alunoName: string;         // Desnormalizado para performance
  joinedAt: Timestamp;
  leftAt?: Timestamp;
}
Collection: silentFeedback
interface SilentFeedback {
  id: string;                // Composto: `${sessionId}_${alunoId}`
  sessionId: string;
  alunoId: string;
  alunoName: string;         // Desnormalizado para polling
  isConfused: boolean;
  updatedAt: Timestamp;
}
API Endpoints (Blueprint)
1. Sessões de Aula
POST /api/v1/meet/sessions
Cria uma nova sessão de aula.

Request:

{
  "turmaId": "turma-abc123",
  "scheduledAt": "2025-12-06T14:00:00Z"
}
Response (201):

{
  "id": "session-xyz789",
  "jitsiRoomName": "GoGeo-MAT7A-a1b2c3",
  "jitsiRoomPassword": "Xk9mP2nQ",
  "joinUrl": "https://meet.jit.si/GoGeo-MAT7A-a1b2c3#config.prejoinPageEnabled=false",
  "status": "scheduled"
}
GET /api/v1/meet/sessions/:sessionId
Obtém detalhes de uma sessão (para aluno entrar).

PATCH /api/v1/meet/sessions/:sessionId/start
Inicia a sessão (professor).

PATCH /api/v1/meet/sessions/:sessionId/end
Encerra a sessão (professor).

2. Presença (Attendance)
POST /api/v1/meet/sessions/:sessionId/join
Registra entrada do aluno.

Request:

{
  "alunoName": "João Silva"
}
POST /api/v1/meet/sessions/:sessionId/leave
Registra saída do aluno.

3. Feedback Silencioso
POST /api/v1/meet/sessions/:sessionId/feedback
Toggle do status de dúvida do aluno.

Request:

{
  "isConfused": true
}
GET /api/v1/meet/sessions/:sessionId/feedback
Lista alunos com dúvida (polling do professor).

Response:

{
  "confusedCount": 3,
  "students": [
    { "alunoId": "aluno-1", "alunoName": "Maria", "since": "2025-12-06T14:15:00Z" },
    { "alunoId": "aluno-2", "alunoName": "Pedro", "since": "2025-12-06T14:18:00Z" }
  ]
}
Componentes React Principais
1. JitsiMeet (Wrapper)
// components/jitsi/JitsiMeet.tsx
interface JitsiMeetProps {
  roomName: string;
  password?: string;
  displayName: string;
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (participantId: string) => void;
  onMeetingEnd?: () => void;
  role: 'teacher' | 'student';
}
2. TeacherPanel
// components/teacher/TeacherPanel.tsx
// Painel lateral do professor com:
// - Lista de participantes
// - Contador de alunos com dúvida
// - Botão de sortear aluno
// - Botão de encerrar aula
3. FeedbackButton
// components/student/FeedbackButton.tsx
// Botão toggle para indicar dúvida
// Estados: normal | confused
// Visual: ícone de interrogação com animação quando ativo
Integração com o Ecossistema
Opção A: Embed via IFrame (LARA App)
<!-- No LARA App (student.html ou teacher.html) -->
<iframe 
  src="https://meet.gogeo.com/room/session-xyz?token=JWT_TOKEN"
  width="100%"
  height="600"
  allow="camera; microphone; display-capture"
></iframe>
Opção B: Componente React (Ecossistema Go Geo 3)
// No ecossistema-go-geo-3
import { GoGeoMeetRoom } from '@gogeo/meet';
<GoGeoMeetRoom
  sessionId="session-xyz"
  role="student"
  onLeave={() => navigate('/turmas')}
/>
Fluxo de Autenticação
Firebase Auth
Go Geo Meet
App (LARA/Ecossistema)
Firebase Auth
Go Geo Meet
App (LARA/Ecossistema)
Login do usuário
Token JWT
Abre sala com token
Valida token
Usuário autenticado
Carrega interface
Fases de Implementação
Fase 1: MVP Básico (1-2 semanas)
 Setup do projeto (Vite + React + TypeScript)
 Integração básica com Jitsi (embed)
 Backend: criar sessão, iniciar, encerrar
 Registro de presença (join/leave)
 UI básica para professor e aluno
Fase 2: Features de Engajamento (1 semana)
 Feedback silencioso (botão + polling)
 Painel do professor com lista de participantes
 Sorteador de alunos
 Indicador visual de dúvidas
Fase 3: Integração (1 semana)
 Componente exportável para embed
 Documentação de integração
 Testes com LARA App
 Testes com Ecossistema Go Geo 3
Verificação
Testes Automatizados
Unit tests para controllers (Jest)
Component tests (Vitest + Testing Library)
Postman collection para API
Testes Manuais
Professor cria sessão
Aluno entra na sessão
Presença registrada automaticamente
Aluno clica em "tenho dúvida"
Professor vê indicador de dúvida
Professor sorteia aluno
Professor encerra sessão
Relatório de presença gerado
User Review Required
IMPORTANT

Decisão: Projeto Separado O Go Geo Meet será desenvolvido como projeto independente na pasta Go Geo Meet (Jistsi) com seu próprio Firebase project ou usando o mesmo projeto do ecossistema?

Opção A: Mesmo Firebase project (gogeo-synapse) - dados unificados
Opção B: Novo Firebase project - isolamento total
IMPORTANT

Decisão: Nome do Domínio/Hosting Qual será o domínio para o Go Geo Meet?

Opção A: meet.gogeo.com (subdomínio próprio)
Opção B: gogeo-synapse.web.app/meet (rota no hosting existente)
Opção C: Desenvolver localmente primeiro, decidir depois