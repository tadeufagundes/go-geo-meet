# Fluxograma — GoGeoMeet

Abaixo está um fluxograma em Mermaid que descreve o fluxo principal de agendamento e participação em reuniões. Abra este ficheiro no VS Code e utilize uma extensão de Mermaid (ex.: "Markdown Preview Mermaid Support") para visualizar.

```mermaid
flowchart TD
  A[Usuário abre o app] --> B{Criar nova reunião ou entrar em uma existente?}
  B -->|Criar| C[Formulário de criação]
  B -->|Entrar| D[Lista de reuniões / Entrada direta]
  C --> E[Selecionar local e hora]
  E --> F[Enviar convites / Tornar pública]
  D --> G[Selecionar reunião / Inserir código]
  F --> G
  G --> H[Negociação de sinalização (WebRTC)]
  H --> I[Reunião em andamento]
  I --> J[Partilhar localização, áudio e vídeo]
  I --> K[Gerir participantes / Moderar]
  J --> L[Encerrar reunião]
```

## ER Diagram (Modelo de Dados)

Abaixo está o diagrama ER em Mermaid que descreve os principais modelos e suas relações. Abra este ficheiro no VS Code com uma extensão Mermaid (ex.: "Markdown Preview Mermaid Support") para visualizar graficamente.

```mermaid
erDiagram
    User {
        String id PK "ID do Usuário"
        String email UK "Email"
        String name "Nome"
        Role role "Papel (Professor, Aluno)"
    }

    Turma {
        String id PK "ID da Turma"
        String subject "Matéria"
        String name "Nome da Turma"
        String teacherId FK "ID do Professor"
    }

    TurmaAluno {
        String turmaId PK, FK "ID da Turma"
        String alunoId PK, FK "ID do Aluno"
    }

    AulaAgendada {
        String id PK "ID da Aula"
        String turmaId FK "ID da Turma"
        DateTime scheduledAt "Horário Agendado"
        String jitsiRoomName "Nome da Sala Jitsi"
    }

    AttendanceLog {
        String id PK "ID do Log de Presença"
        String alunoId FK "ID do Aluno"
        String aulaAgendadaId FK "ID da Aula"
        DateTime joinedAt "Horário de Entrada"
        DateTime leftAt "Horário de Saída"
    }

    SilentFeedback {
        String id PK "ID do Feedback"
        String alunoId FK, UK "ID do Aluno"
        String aulaAgendadaId FK, UK "ID da Aula"
        Boolean isConfused "Está com Dúvida?"
    }

    ||--o{ Turma : ensina
    User }o--o{ TurmaAluno : está matriculado em
    Turma ||--|{ TurmaAluno : possui
    Turma ||--o{ AulaAgendada : possui
    AulaAgendada ||--o{ AttendanceLog : registra
    User ||--o{ AttendanceLog : pertence a
    AulaAgendada ||--o{ SilentFeedback : recebe
    User ||--o{ SilentFeedback : fornece
```

Sinta-se à vontade para me enviar o conteúdo final que deseja colocar em cada ficheiro que eu atualizo-los imediatamente.