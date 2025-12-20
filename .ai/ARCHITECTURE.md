# 🏗️ ARCHITECTURE.md - Diagrama de Sistema

## Visão Geral do Sistema

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        UI[React UI]
        Hooks[Custom Hooks]
        Services[Services Layer]
    end

    subgraph "External Services"
        Jitsi[Jitsi Meet API<br/>meet.jit.si]
    end

    subgraph "Firebase"
        Auth[Firebase Auth]
        Firestore[(Firestore)]
        Hosting[Firebase Hosting]
        Functions[Cloud Functions]
    end

    subgraph "Users"
        Teacher[👨‍🏫 Professor]
        Student[👨‍🎓 Aluno]
    end

    Teacher --> UI
    Student --> UI
    UI --> Hooks
    Hooks --> Services
    Services --> Auth
    Services --> Firestore
    Services --> Functions
    UI --> Jitsi
    Hosting --> UI
```

---

## Fluxo: Professor Inicia Aula

```mermaid
sequenceDiagram
    participant T as Professor
    participant UI as React UI
    participant SS as sessionService
    participant FS as Firestore
    participant J as Jitsi

    T->>UI: Clica "Iniciar Aula"
    UI->>SS: createSession(turmaId)
    SS->>FS: Cria documento em meetSessions
    FS-->>SS: sessionId + jitsiRoomName
    SS-->>UI: Session criada
    UI->>J: Conecta com roomName
    J-->>UI: Meeting iniciado
    UI-->>T: Exibe sala de aula
```

---

## Fluxo: Aluno Entra na Aula

```mermaid
sequenceDiagram
    participant S as Aluno
    participant UI as React UI
    participant AS as attendanceService
    participant FS as Firestore
    participant J as Jitsi

    S->>UI: Acessa link da aula
    UI->>FS: Busca sessão ativa
    FS-->>UI: Session data
    UI->>J: Conecta com roomName
    J-->>UI: Meeting joined
    UI->>AS: registerAttendance(sessionId, alunoId)
    AS->>FS: Cria documento em meetAttendance
    FS-->>AS: attendanceId
    UI-->>S: Na aula!
```

---

## Fluxo: Feedback Silencioso

```mermaid
sequenceDiagram
    participant S as Aluno
    participant UI as React UI
    participant FS as feedbackService
    participant DB as Firestore
    participant T as Professor

    S->>UI: Clica "Tenho Dúvida" 🤔
    UI->>FS: toggleFeedback(sessionId, alunoId, hasDoubt: true)
    FS->>DB: Atualiza meetFeedback
    DB-->>FS: OK

    Note over DB,T: Real-time listener
    DB->>T: Notifica mudança
    T-->>T: Vê indicador de dúvida

    S->>UI: Clica novamente (resolver)
    UI->>FS: toggleFeedback(sessionId, alunoId, hasDoubt: false)
    FS->>DB: Atualiza meetFeedback
```

---

## Firestore Collections

```mermaid
erDiagram
    meetSessions {
        string id PK
        string teacherId FK
        string turmaId
        string turmaName
        string jitsiRoomName
        string jitsiPassword
        string status "scheduled|live|ended"
        timestamp createdAt
        timestamp startedAt
        timestamp endedAt
    }

    meetAttendance {
        string id PK
        string sessionId FK
        string participantId
        string participantName
        string role "teacher|student"
        timestamp joinedAt
        timestamp leftAt
    }

    meetFeedback {
        string id PK
        string sessionId FK
        string participantId
        string participantName
        boolean hasDoubt
        string status "active|resolved"
        timestamp updatedAt
    }

    meetSessions ||--o{ meetAttendance : "has"
    meetSessions ||--o{ meetFeedback : "has"
```

---

## Componentes React

```mermaid
graph TB
    subgraph "App.tsx"
        Router[React Router]
    end

    subgraph "Pages"
        HP[HomePage]
        TP[TeacherPage]
        SP[StudentPage]
    end

    subgraph "Components"
        GM[GoGeoMeet]
        JW[JitsiWrapper]
        TP2[TeacherPanel]
        FB[FeedbackButton]
    end

    subgraph "Hooks"
        UA[useAuth]
        UJ[useJitsi]
        US[useSessions]
        UF[useFeedback]
    end

    Router --> HP
    Router --> TP
    Router --> SP
    TP --> GM
    SP --> GM
    GM --> JW
    GM --> TP2
    GM --> FB
    GM --> UA
    GM --> UJ
    GM --> US
    GM --> UF
```

---

## Integrações Externas

| Serviço              | URL           | Uso                           |
| -------------------- | ------------- | ----------------------------- |
| **Jitsi Meet**       | `meet.jit.si` | Videoconferência (custo zero) |
| **Firebase Auth**    | Google Cloud  | Autenticação de usuários      |
| **Firestore**        | Google Cloud  | Banco de dados NoSQL          |
| **Firebase Hosting** | Google Cloud  | Hospedagem do frontend        |

---

## Ports & Adapters

```
┌─────────────────────────────────────────────────────┐
│                    PRESENTATION                      │
│  React Components, Pages, Hooks                      │
├─────────────────────────────────────────────────────┤
│                    APPLICATION                       │
│  Services (sessionService, attendanceService, etc)   │
├─────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                    │
│  Firebase SDK, Jitsi API, Cloud Functions            │
└─────────────────────────────────────────────────────┘
```
