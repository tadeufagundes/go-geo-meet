# Plano de Implementação Avançado: Go Geo Meet 2.0

Este documento detalha a estratégia para implementar as funcionalidades críticas solicitadas: Bloqueio de câmera, Breakout Rooms com Quadro Global e IA de Feedback.

## 1. Lockdown de Alunos (UI & Permissões)
*   **Objetivo:** Garantir que alunos não desliguem a câmera.
*   **Ação:** Implementar `configOverwrite` condicional no `GoGeoMeet.tsx`.
*   **Lógica:**
    ```typescript
    // No config do Jitsi para role === 'student'
    toolbarButtons: ['microphone', 'chat', 'raisehand', 'select-background'],
    prejoinPageEnabled: false,
    startWithVideoMuted: false, // Força câmera on ao entrar
    ```
*   **Script de Monitoramento:** Adicionar listener `api.addListener('videoMutedStatusChanged', ...)` para reativar a câmera caso o aluno use atalho de teclado.

## 2. Motor de Breakout Rooms (Orquestração via Supabase)
*   **Objetivo:** Criar salas menores e mover alunos dinamicamente.
*   **Arquitetura:** 
    *   `Table: meet_sessions_rooms` (PostgreSQL no Supabase)
    *   O professor gerencia o estado via Supabase Realtime Broadcast.
    *   Os apps dos alunos ouvem o canal `room:{sessionId}` e executam `api.executeCommand('joinBreakoutRoom', roomName)`.
*   **Persistência:** O professor pode encerrar todas as salas simultaneamente, enviando um sinal de broadcast para todos os clientes.

## 3. Quadro Global (Broadcast Persistente)
*   **Desafio:** Compartilhamento de tela em uma sala não aparece na outra.
*   **Solução:** 
    *   O professor compartilha a tela em uma "Main Room" que nunca é fechada.
    *   Os alunos, ao entrar em uma Breakout Room, mantêm um listener para o "Main Stream".
    *   A interface terá um modo "Picture-in-Picture" ou Split View:
        1. **Lado A:** Interação com o grupo (Breakout Room).
        2. **Lado B:** Quadro do Professor (Main Room - Somente visualização).

## 4. IA de Feedback de Áudio (LARA AI Listener)
*   **Infraestrutura:** Serviço externo em Node.js (Puppeteer/Playwright).
*   **Fluxo de Operação:**
    1.  **Ativação:** Professor clica em "Ativar IA".
    2.  **Deployment:** O servidor backend spawna um "Headless Participant" (ex: `LARA_BOT_01`) que entra na sala.
    3.  **Captura:** O bot captura o `MediaStream` de áudio.
    4.  **Processamento:** O áudio é enviado para o pipeline:
        - `OpenAI Whisper` (Transcrição rápida).
        - `GPT-4o` (Análise de entonação, gramática ou participação).
    5.  **Feedback:** O resultado é escrito no Firestore e aparece instantaneamente no dashboard do professor.

## 5. Cronograma Sugerido
- **Semana 1:** Lockdown de UI e Gerenciador de Breakout Rooms (Firebase).
- **Semana 2:** Lógica de Broadcast do Quadro (Dual-Stream).
- **Semana 3:** Backend do Bot de IA e Integração com Whisper API.

---
*Status: Planejamento pronto para execução.*
