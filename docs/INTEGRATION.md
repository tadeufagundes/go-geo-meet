# Guia de Integração - Go Geo Meet

Este documento descreve como integrar o Go Geo Meet em outras aplicações do ecossistema Go Geo.

## Opções de Integração

### Opção 1: Componente React (Ecossistema Go Geo 3)

Para aplicações React, importe e use o componente diretamente:

```tsx
import { GoGeoMeet } from '@gogeo/meet';

function ClassRoom({ session }) {
  return (
    <GoGeoMeet
      sessionId={session.id}
      roomName={session.jitsiRoomName}
      displayName="João Silva"
      role="student"
      apiBaseUrl="https://us-central1-gogeo-synapse.cloudfunctions.net"
      onMeetingEnd={() => navigate('/dashboard')}
      height="600px"
    />
  );
}
```

### Opção 2: IFrame (LARA App / HTML)

Para aplicações não-React, use um iframe:

```html
<iframe
  src="https://gogeo-meet.web.app/student/room/GoGeo-MAT7A-abc123?name=João&sessionId=session-xyz"
  width="100%"
  height="600"
  allow="camera; microphone; display-capture; autoplay"
  style="border: none; border-radius: 8px;"
></iframe>
```

### Opção 3: JavaScript SDK

Para integração programática:

```html
<script src="https://gogeo-meet.web.app/sdk.js"></script>
<div id="meet-container"></div>

<script>
GoGeoMeet.init({
  container: '#meet-container',
  sessionId: 'session-xyz',
  roomName: 'GoGeo-MAT7A-abc123',
  displayName: 'João Silva',
  role: 'student',
  apiBaseUrl: 'https://us-central1-gogeo-synapse.cloudfunctions.net',
  onReady: () => console.log('Meeting ready'),
  onEnd: () => console.log('Meeting ended'),
});
</script>
```

---

## Props do Componente

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `sessionId` | string | Sim | ID da sessão (da API) |
| `roomName` | string | Sim | Nome da sala Jitsi |
| `displayName` | string | Sim | Nome do participante |
| `role` | 'teacher' \| 'student' | Sim | Papel do usuário |
| `apiBaseUrl` | string | Não | URL base da API |
| `authToken` | string | Não | Token Firebase Auth |
| `onMeetingEnd` | () => void | Não | Callback ao encerrar |
| `onError` | (err) => void | Não | Callback de erro |
| `height` | string \| number | Não | Altura (default: 100%) |
| `className` | string | Não | Classes CSS extras |

---

## Criar Sessão via API

Antes de usar o componente, crie uma sessão:

```javascript
const response = await fetch('/api/v1/meet/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  },
  body: JSON.stringify({
    turmaId: 'turma-123',
    turmaName: 'Matemática 7A',
  }),
});

const session = await response.json();
// { id: 'session-xyz', jitsiRoomName: 'GoGeo-MAT7A-abc', ... }
```

---

## Integração com LARA App

1. **Professor** inicia aula no `teacher.html`:
```javascript
// Botão "Iniciar Aula Online"
async function iniciarAulaOnline(turmaId, turmaNome) {
  const session = await criarSessaoMeet(turmaId, turmaNome);
  
  // Abrir em nova aba ou modal
  const url = `https://gogeo-meet.web.app/teacher/room/${session.jitsiRoomName}?sessionId=${session.id}`;
  window.open(url, '_blank');
}
```

2. **Aluno** entra na aula no `student.html`:
```javascript
// Mostrar botão quando aula está ao vivo
function mostrarBotaoEntrarAula(session) {
  const url = `https://gogeo-meet.web.app/student/room/${session.jitsiRoomName}?name=${encodeURIComponent(alunoNome)}&sessionId=${session.id}`;
  
  document.getElementById('aula-online-btn').href = url;
  document.getElementById('aula-online-container').style.display = 'block';
}
```

---

## Integração com Ecossistema Go Geo 3

1. Instalar dependência (quando publicada):
```bash
npm install @gogeo/meet
```

2. Usar nas páginas de turma:
```tsx
// Em pages/professor/TurmaPage.tsx
import { GoGeoMeet } from '@gogeo/meet';
import { useSession } from '@/hooks/useSessions';

function AulaOnline({ turmaId }) {
  const { session, startSession } = useSession(turmaId);
  
  if (!session || session.status !== 'live') {
    return <button onClick={startSession}>Iniciar Aula</button>;
  }
  
  return (
    <GoGeoMeet
      sessionId={session.id}
      roomName={session.jitsiRoomName}
      displayName={user.name}
      role="teacher"
    />
  );
}
```

---

## Permissões Necessárias

O navegador precisa de permissões para:
- Câmera
- Microfone
- Compartilhamento de tela (opcional)

Adicione ao iframe:
```html
allow="camera; microphone; display-capture; autoplay"
```
