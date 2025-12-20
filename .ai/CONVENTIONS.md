# 📏 CONVENTIONS.md - Padrões de Código

## Nomenclatura de Arquivos

| Tipo            | Padrão                          | Exemplo                                   |
| --------------- | ------------------------------- | ----------------------------------------- |
| **Componentes** | `PascalCase.tsx`                | `GoGeoMeet.tsx`, `TeacherPanel.tsx`       |
| **Hooks**       | `use{Name}.ts`                  | `useAuth.ts`, `useSessions.ts`            |
| **Services**    | `{name}Service.ts`              | `sessionService.ts`, `feedbackService.ts` |
| **Types**       | `{name}.types.ts` ou `index.ts` | `types/index.ts`                          |
| **Schemas**     | `{name}.schema.ts`              | `session.schema.ts`                       |
| **Pages**       | `{Name}Page.tsx`                | `TeacherPage.tsx`, `StudentPage.tsx`      |
| **Utils**       | `{name}.ts`                     | `formatDate.ts`, `generateId.ts`          |

---

## Estrutura de Componentes

```tsx
// 1. Imports externos
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 2. Imports de tipos
import type { Session } from "@/types";

// 3. Imports de hooks/services
import { useSessions } from "@/hooks/useSessions";

// 4. Imports de componentes
import { Button } from "@/components/ui/Button";

// 5. Imports de utils/constants
import { formatDate } from "@/utils/formatDate";

// 6. Interface de Props
interface SessionCardProps {
  session: Session;
  onJoin?: (sessionId: string) => void;
}

// 7. Componente
export function SessionCard({ session, onJoin }: SessionCardProps) {
  // 7.1 Hooks primeiro
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 7.2 Handlers
  const handleJoin = () => {
    setIsLoading(true);
    onJoin?.(session.id);
  };

  // 7.3 Render
  return (
    <div className="session-card">
      <h3>{session.turmaName}</h3>
      <p>{formatDate(session.createdAt)}</p>
      <Button onClick={handleJoin} disabled={isLoading}>
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </div>
  );
}
```

---

## Ordem de Imports

```typescript
// 1. React e libs do React
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// 2. Libs externas
import { format } from "date-fns";
import { Loader2, Video, Users } from "lucide-react";

// 3. Types (com 'type' keyword)
import type { Session, Participant } from "@/types";

// 4. Hooks locais
import { useAuth } from "@/hooks/useAuth";
import { useSessions } from "@/hooks/useSessions";

// 5. Services
import { sessionService } from "@/services/sessionService";

// 6. Componentes
import { Button } from "@/components/ui/Button";
import { TeacherPanel } from "@/components/teacher/TeacherPanel";

// 7. Utils e constants
import { generateRoomName } from "@/utils/generateRoomName";
import { JITSI_DOMAIN } from "@/constants";
```

---

## Padrões TypeScript

### Interfaces vs Types

```typescript
// ✅ USE interface para objetos/entidades
interface Session {
  id: string;
  teacherId: string;
  turmaName: string;
  status: SessionStatus;
}

// ✅ USE type para unions, primitivos, e composições
type SessionStatus = "scheduled" | "live" | "ended";
type PartialSession = Partial<Session>;
type SessionWithParticipants = Session & { participants: Participant[] };
```

### Evitar `any`

```typescript
// ❌ NUNCA
function processData(data: any) { ... }

// ✅ SEMPRE
function processData(data: unknown) {
  if (isSession(data)) { ... }
}

// ✅ OU tipo específico
function processSession(session: Session) { ... }
```

### Null Checking

```typescript
// ❌ EVITAR
if (session != null) { ... }

// ✅ PREFERIR
if (session) { ... }

// ✅ OU Optional chaining
const name = session?.turmaName ?? 'Sem nome';
```

---

## Padrões de Hooks

### Estrutura de um Hook

```typescript
import { useState, useEffect, useCallback } from "react";
import { sessionService } from "@/services/sessionService";
import type { Session } from "@/types";

interface UseSessionsReturn {
  sessions: Session[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useSessions(teacherId: string): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await sessionService.getByTeacher(teacherId);
      setSessions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sessions, isLoading, error, refresh };
}
```

---

## Padrões de Services

### Estrutura de um Service

```typescript
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { Session, CreateSessionInput } from "@/types";

const COLLECTION = "meetSessions";

export const sessionService = {
  async create(input: CreateSessionInput): Promise<Session> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...input,
      status: "scheduled",
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...input } as Session;
  },

  async getById(id: string): Promise<Session | null> {
    const docSnap = await getDoc(doc(db, COLLECTION, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Session;
  },

  async getByTeacher(teacherId: string): Promise<Session[]> {
    const q = query(
      collection(db, COLLECTION),
      where("teacherId", "==", teacherId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Session)
    );
  },
};
```

---

## Padrões CSS (Tailwind)

### Classes Comuns

```tsx
// Layout
className = "flex items-center justify-between";
className = "grid grid-cols-1 md:grid-cols-2 gap-4";

// Espaçamento
className = "p-4 m-2 space-y-4";

// Cores (Go Geo Brand)
className = "bg-blue-600 text-white";
className = "bg-gray-900 text-gray-100"; // Dark mode

// Estados
className = "hover:bg-blue-700 transition-colors";
className = "disabled:opacity-50 disabled:cursor-not-allowed";

// Responsivo
className = "text-sm md:text-base lg:text-lg";
className = "hidden md:block";
```

### Variantes com cn()

```tsx
import { cn } from "@/lib/utils";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-colors",
        {
          "bg-blue-600 text-white hover:bg-blue-700": variant === "primary",
          "bg-gray-200 text-gray-800 hover:bg-gray-300":
            variant === "secondary",
          "bg-red-600 text-white hover:bg-red-700": variant === "danger",
        },
        className
      )}
      {...props}
    />
  );
}
```

---

## Git Commits

### Formato

```
<tipo>(<escopo>): <descrição breve>

<corpo opcional>

<footer opcional>
```

### Tipos

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta lógica)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas de build/config

### Exemplos

```bash
feat(sessions): adicionar sorteador de alunos
fix(feedback): corrigir toggle de dúvida não atualizando
docs(readme): adicionar instruções de deploy
refactor(hooks): extrair lógica de jitsi para useJitsi
```

---

## Comentários

```typescript
// ❌ EVITAR comentários óbvios
// Incrementa o contador
counter++;

// ✅ COMENTAR o "porquê", não o "quê"
// Jitsi precisa de delay para inicializar corretamente
await new Promise((resolve) => setTimeout(resolve, 500));

// ✅ TODO com contexto
// TODO: Implementar reconexão automática quando Jitsi cair

// ✅ FIXME para bugs conhecidos
// FIXME: Feedback não atualiza em tempo real no Safari
```
