# 🔄 WORKFLOWS.md - Comandos Essenciais

## Web App (Alunos) - `frontend/`

```bash
cd frontend
npm install      # Instalar dependências
npm run dev      # Desenvolvimento local
npm run build    # Build produção
```

## Desktop App (Professores) - `desktop/`

```bash
cd desktop
npm install      # Instalar dependências
npm start        # Desenvolvimento local
npm run dist     # Build executável Windows
```

## Deploy

```bash
# Web App
cd frontend && npm run build && cd .. && firebase deploy --only hosting

# Firestore Rules
firebase deploy --only firestore:rules
```

## Troubleshooting

| Problema                    | Solução                              |
| --------------------------- | ------------------------------------ |
| Permission denied Firestore | Verificar `firestore.rules`          |
| Jitsi não carrega           | Verificar conexão com `meet.jit.si`  |
| Build falha                 | `rm -rf node_modules && npm install` |
