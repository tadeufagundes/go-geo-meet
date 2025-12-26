# Firestore Rules - Ecossistema Go Geo Compartilhado

> [!CAUTION] > **Este projeto usa o mesmo projeto Firebase da Synapse (gogeo-synapse).**
> As regras do Firestore são compartilhadas entre ambas as plataformas.

## Regras Compartilhadas

O arquivo `firestore.rules` neste diretório contém as regras de **todo o ecossistema Go Geo**, incluindo:

| Plataforma             | Coleções                                                                                                                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Synapse (Lara App)** | `users`, `accessCodes`, `levels`, `courses`, `lessons`, `studentProgress`, `weeklyRanking`, `auditLogs`, `securityLogs`, `notificationTokens`, `notificationPreferences`, `notificationHistory`, `achievements`, `missions`, `students` |
| **Go Geo Meet**        | `meetSessions`, `meetAttendance`, `meetFeedback`                                                                                                                                                                                        |

## Deploy das Regras

> [!IMPORTANT]
> Sempre faça deploy das regras a partir do diretório principal (**Lara app**) ou deste diretório.
> **NUNCA** faça deploy de regras parciais que não contenham todas as coleções.

### Comando de Deploy

```bash
firebase deploy --only firestore:rules
```

### Verificação Pós-Deploy

Após o deploy, verifique se o login funciona em ambas as plataformas:

- **Synapse:** https://gogeo-synapse.web.app
- **Go Geo Meet:** https://gogeo-meet.web.app

## Sincronização

Ambos os arquivos de regras devem estar sempre sincronizados:

- `Lara app/firestore.rules`
- `Go Geo Meet (Jistsi)/firestore.rules`

Se precisar adicionar novas regras para o Meet:

1. Edite AMBOS os arquivos
2. Faça deploy a partir de qualquer um dos diretórios

## Histórico de Incidentes

| Data       | Incidente               | Causa                                                            | Solução                                 |
| ---------- | ----------------------- | ---------------------------------------------------------------- | --------------------------------------- |
| 2025-12-22 | Login na Synapse falhou | Deploy de regras parciais do Meet sobrescreveu regras da Synapse | Mesclou regras e fez deploy consolidado |
