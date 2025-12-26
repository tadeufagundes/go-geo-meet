# API Reference - Go Geo Meet

Base URL: `https://us-central1-gogeo-synapse.cloudfunctions.net/api/v1/meet`

---

## Autenticação

Endpoints marcados com 🔒 requerem token Firebase Auth no header:
```
Authorization: Bearer <firebase-id-token>
```

---

## Sessions

### POST /sessions 🔒
Cria nova sessão de aula.

**Request:**
```json
{
  "turmaId": "turma-123",
  "turmaName": "Matemática 7A",
  "scheduledAt": "2025-12-10T14:00:00Z"
}
```

**Response (201):**
```json
{
  "id": "session-abc123",
  "jitsiRoomName": "GoGeo-MAT7A-xyz789",
  "jitsiRoomPassword": "Xk9mP2nQ",
  "joinUrl": "https://meet.jit.si/GoGeo-MAT7A-xyz789",
  "status": "scheduled"
}
```

### GET /sessions 🔒
Lista sessões do professor autenticado.

### GET /sessions/:id
Detalhes de uma sessão.

### PATCH /sessions/:id/start 🔒
Inicia a sessão (status → 'live').

### PATCH /sessions/:id/end 🔒
Encerra a sessão (status → 'completed').

---

## Attendance

### POST /sessions/:id/join
Registra entrada do aluno.

**Request:**
```json
{ "alunoName": "João Silva" }
```

**Response:**
```json
{
  "success": true,
  "attendanceId": "att-xyz",
  "jitsiRoomName": "GoGeo-MAT7A-xyz789"
}
```

### POST /sessions/:id/leave
Registra saída do aluno.

---

## Feedback

### POST /sessions/:id/feedback
Toggle status de dúvida.

**Request:**
```json
{
  "alunoId": "aluno-123",
  "alunoName": "João",
  "isConfused": true
}
```

### GET /sessions/:id/feedback
Lista alunos com dúvida.

**Response:**
```json
{
  "confusedCount": 3,
  "students": [
    { "alunoId": "a1", "alunoName": "Maria", "since": "2025-12-10T14:15:00Z" }
  ]
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 500 | Erro interno |
