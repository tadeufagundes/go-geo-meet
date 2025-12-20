# 🔄 WORKFLOWS.md - Fluxos de Desenvolvimento

## 📋 Nova Feature

### Checklist

1. **Planejamento**

   - [ ] Definir escopo da feature
   - [ ] Identificar components/hooks/services necessários
   - [ ] Verificar se afeta Firestore Rules

2. **Implementação**

   - [ ] Criar types em `src/types/`
   - [ ] Criar service em `src/services/`
   - [ ] Criar hook em `src/hooks/`
   - [ ] Criar componentes em `src/components/`
   - [ ] Adicionar à página correspondente

3. **Testes**

   - [ ] Testar localmente com emuladores
   - [ ] Verificar console do browser
   - [ ] Testar em diferentes navegadores

4. **Deploy**
   - [ ] Build sem erros
   - [ ] Deploy para Firebase Hosting

### Comandos

```bash
# 1. Iniciar desenvolvimento
cd frontend
npm run dev

# 2. Testar build
npm run build

# 3. Preview local do build
npm run preview

# 4. Deploy
firebase deploy --only hosting
```

---

## 🚀 Deploy

### Deploy Completo

```bash
# 1. Build do frontend
cd frontend
npm run build

# 2. Deploy de tudo
cd ..
firebase deploy

# Ou deploy seletivo:
firebase deploy --only hosting          # Apenas frontend
firebase deploy --only firestore:rules  # Apenas rules
firebase deploy --only firestore:indexes # Apenas indexes
firebase deploy --only functions        # Apenas functions
```

### Deploy Rápido (Apenas Frontend)

```bash
cd frontend && npm run build && cd .. && firebase deploy --only hosting
```

---

## 🔥 Emuladores Firebase

### Iniciar Emuladores

```bash
# Todos os emuladores
firebase emulators:start

# Emuladores específicos
firebase emulators:start --only firestore,auth

# Com UI
firebase emulators:start --inspect-functions
```

### Conectar Frontend aos Emuladores

O arquivo `src/firebase.ts` já deve ter a lógica:

```typescript
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";

if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, "localhost", 8080);
  connectAuthEmulator(auth, "http://localhost:9099");
}
```

---

## 🐛 Debugging

### Console do Browser

1. Abrir DevTools (F12)
2. Verificar aba **Console** para erros
3. Verificar aba **Network** para requisições falhas
4. Usar breakpoints na aba **Sources**

### Debugging Firebase

```typescript
// Adicionar logs temporários
console.log("[SessionService] Creating session:", input);

// Verificar estado do Firestore
import { enableLogging } from "firebase/firestore";
enableLogging(true);
```

### Problemas Comuns

| Problema                    | Solução                                    |
| --------------------------- | ------------------------------------------ |
| Firestore permission denied | Verificar `firestore.rules`                |
| Jitsi não carrega           | Verificar se `meet.jit.si` está acessível  |
| Auth não funciona           | Verificar configuração no Firebase Console |
| Build falha                 | Executar `npm install` novamente           |

---

## 🔒 Atualizar Firestore Rules

### Processo Seguro

1. **Editar** `firestore.rules` localmente
2. **Testar** com emuladores
   ```bash
   firebase emulators:start --only firestore
   ```
3. **Validar** as regras
   ```bash
   firebase firestore:rules --dry-run
   ```
4. **Deploy**
   ```bash
   firebase deploy --only firestore:rules
   ```

### Template de Regras

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Collection rules
    match /meetSessions/{sessionId} {
      allow read: if true;
      allow create: if isAuthenticated()
        && request.resource.data.teacherId == request.auth.uid;
      allow update: if isAuthenticated()
        && resource.data.teacherId == request.auth.uid;
      allow delete: if false;
    }
  }
}
```

---

## 📦 Adicionar Dependência

### Processo

```bash
# 1. Navegar para frontend
cd frontend

# 2. Adicionar dependência
npm install <pacote>

# 3. Para dev dependencies
npm install -D <pacote>

# 4. Testar se não quebrou nada
npm run build
```

### Dependências Recomendadas

```bash
# UI
npm install lucide-react clsx tailwind-merge

# Forms
npm install react-hook-form @hookform/resolvers zod

# State
npm install zustand

# Date
npm install date-fns
```

---

## 🔄 Git Workflow

### Branches

```
main          → Produção (deploy automático)
develop       → Desenvolvimento
feature/*     → Novas features
fix/*         → Correções
```

### Fluxo

```bash
# 1. Criar branch
git checkout -b feature/nova-funcionalidade

# 2. Fazer commits
git add .
git commit -m "feat(scope): descrição"

# 3. Push
git push -u origin feature/nova-funcionalidade

# 4. Criar Pull Request no GitHub

# 5. Após merge, atualizar local
git checkout main
git pull
```

---

## 📊 Monitoramento

### Firebase Console

- **Authentication** → Usuários cadastrados
- **Firestore** → Dados em tempo real
- **Hosting** → Status dos deploys
- **Usage** → Cotas e limites

### Verificar Cotas

```
Firebase Console → Usage and billing → Usage
```

### Limites Firebase Spark (Free)

| Recurso           | Limite                  |
| ----------------- | ----------------------- |
| Firestore reads   | 50k/dia                 |
| Firestore writes  | 20k/dia                 |
| Firestore deletes | 20k/dia                 |
| Storage           | 1 GB                    |
| Hosting           | 10 GB transferência/mês |

---

## 🆘 Troubleshooting

### "Module not found"

```bash
rm -rf node_modules
npm install
```

### "Firebase error: permission denied"

1. Verificar se usuário está autenticado
2. Verificar firestore.rules
3. Verificar se está usando emuladores em dev

### "Jitsi API not loading"

1. Verificar conexão com internet
2. Verificar se meet.jit.si está online
3. Limpar cache do browser

### "Build failed"

1. Verificar erros de TypeScript
2. Executar `npm run build` localmente
3. Verificar se todas dependências estão instaladas
