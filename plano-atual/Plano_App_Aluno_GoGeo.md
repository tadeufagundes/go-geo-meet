# Plano de Desenvolvimento: Go Geo Meet - Versão do Aluno

Este documento descreve as customizações necessárias para criar a versão exclusiva do aplicativo para alunos, focada em garantir o cumprimento das regras da aula e simplificar a experiência.

## 1. Simplificação da Interface (Kiosk Mode)

**Objetivo:** Evitar distrações e configurações incorretas.

- [ ] **Remover Menu de Configurações de Servidor:** O aluno não deve poder alterar o servidor (fixo em `meet.jit.si` ou servidor próprio futuro).
- [ ] **Remover Opções Avançadas:** Ocultar menus de "Opções de Desenvolvedor", "Ajuda" (que leva ao site do Jitsi) e outras configurações técnicas irrelevantes para a aula.
- [ ] **Auto-Entrada:** Se possível, configurar para que o aluno entre direto na sala ao clicar no link, sem passar por telas intermediárias desnecessárias.

## 2. Controle de Câmera e Participação

**Objetivo:** Garantir a metodologia de ensino (conversação face-a-face).

- [ ] **Câmera Sempre Aberta:**
  - Remover/Desabilitar o botão de "Parar Vídeo" na interface.
  - Forçar o início da chamada com o vídeo habilitado (`startWithVideoMuted: false`).
  - _Nota:_ O aluno ainda poderá ter problemas de hardware, mas a interface não permitirá desligar propositalmente.

## 3. Políticas e Regras

**Objetivo:** Reforçar o "contrato" de aula.

- [ ] **Popup de Regras na Entrada:**
  - Exibir um modal ou tela intermediária antes de entrar na sala com as regras:
    - "Câmera obrigatória ligada"
    - "Ambiente silencioso"
    - "Respeito com os colegas"
  - Botão "Concordo e Entrar".

## 4. Integração com Área do Aluno

**Objetivo:** Manter o aluno no ecossistema Go Geo.

- [ ] **Botões de Acesso Rápido:**
  - Adicionar botão "Minha Área" ou "Voltar para o Site" na barra de ferramentas ou no topo da janela.
  - Redirecionar para `gogeo.com.br/aluno` (exemplo) ao sair da chamada.

## 5. Bypass de Restrições de Servidor

**Objetivo:** Usar infraestrutura gratuita sem limites de API.

- [ ] **Uso do App Desktop:** Como confirmado, o uso do app desktop (Electron) contorna as restrições de "embed" do servidor público do Jitsi, permitindo uso gratuito ilimitado.

---

**Próximos Passos Técnicos:**

1. Criar branch `feat/student-mode`.
2. Modificar `interface_config.js` e `config.js` injetados para remover botões.
3. Alterar menus do Electron no `main.js`.
4. Implementar Modal de Regras no `Conference.js`.
