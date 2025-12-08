# PRD: Go Geo Meet & Plataforma de Aulas Online Synapse

**Autor:** IA (Engenheiro)  
**Revisão:** Tadeu Fagundes (Arquiteto)  
**Versão:** 1.2  
**Data:** 09 de Outubro de 2025

---

## 1. Visão e Problema a ser Resolvido

**Visão:** Transformar a experiência de aulas online do Go Geo de um processo genérico e fragmentado para uma plataforma de ensino virtual totalmente integrada, profissional e de marca própria, que funcione de forma transparente para professores e alunos, pronta para escalar em um modelo de franquia.

**Problema:** Ferramentas de videoconferência genéricas (como o Jitsi público) carecem de funcionalidades pedagógicas essenciais, exigem configurações manuais complexas (como compartilhar áudio do sistema), quebram a imersão do aluno no ecossistema Synapse e não fornecem dados de presença confiáveis. Para uma franquia, essa falta de padronização e profissionalismo é um risco operacional e de marca.

## 2. Objetivos e Critérios de Sucesso

### Objetivos de Negócio:

- Aumentar o Valor Percebido: Oferecer uma plataforma de aulas online superior como um diferencial competitivo para a franquia Go Geo.
- Reduzir a Carga Operacional: Automatizar processos como criação de salas, controle de presença e configurações técnicas, diminuindo a necessidade de suporte técnico.
- Padronizar a Qualidade: Garantir que a experiência de ensino online seja consistente e de alta qualidade em todas as unidades da franquia.

### Critérios de Sucesso (MVP):

- Adoção: 100% das aulas online da unidade piloto serem ministradas através do Go Geo Meet no primeiro mês.
- Satisfação do Professor: Feedback qualitativo positivo, com ênfase na facilidade de uso do compartilhamento de áudio, do feedback silencioso e das salas simultâneas.
- Eficiência: Redução de 90% nas dúvidas e tickets de suporte relacionados a "como iniciar a aula" ou "como compartilhar um vídeo com som".
- Integridade dos Dados: Dados de presença precisos e automáticos para mais de 95% dos alunos em todas as sessões.

## 3. Escopo do Produto (MVP)

O MVP será dividido em duas componentes principais que funcionam em conjunto: o aplicativo do professor e a experiência integrada do aluno.

### 3.1. Go Geo Meet (Aplicativo Desktop do Professor)

Uma aplicação desktop (Windows & macOS) que serve como o centro de comando do professor para as aulas ao vivo.

#### Funcionalidade 1: Apresentação de Tela com Áudio Integrado

- **Descrição:** Um único e proeminente botão na interface do professor, "Apresentar Tela com Áudio". Ao ser clicado, ele inicia o compartilhamento da tela e do áudio do sistema de forma nativa e sincronizada. A interface deve fornecer um feedback visual claro (ex: uma borda colorida na tela) indicando que a apresentação está ativa. Não há necessidade de qualquer software ou configuração externa.

#### Funcionalidade 2: Painel de Controle do Professor

- **Descrição:** Uma interface auxiliar (overlay ou painel lateral) com ferramentas pedagógicas focadas em engajamento.

  - Painel de Feedback Silencioso: Uma área discreta no painel do professor que exibe, em tempo real, quais alunos sinalizaram dúvida. A exibição deve ser tanto individual (um ícone de '❓' ao lado do nome do aluno na lista de participantes) quanto agregada (um contador 'Alunos com dúvida: 3'). O feedback é 100% privado e visível apenas para o professor.
  - Sorteador de Aluno: Um botão "Sortear Aluno" que seleciona aleatoriamente um dos participantes presentes na chamada e exibe seu nome em destaque, permitindo que o professor direcione perguntas e aumente o engajamento.
  - Gerenciamento de Salas Simultâneas (Breakout Rooms): Habilitar e garantir o bom funcionamento da funcionalidade nativa do Jitsi. O professor poderá criar salas menores para atividades em grupo, mover alunos entre elas (ou permitir que escolham), e encerrá-las, trazendo todos de volta à sala principal.

#### Funcionalidade 3: Integração Profunda com Synapse

- **Descrição:** Automação completa do ciclo de vida da aula.

  - Criação Automática de Salas: O app consulta a API Synapse ao iniciar. Se uma aula está agendada, ele automaticamente cria a sala com um nome padronizado e não adivinhável (ex: GoGeo-MAT7A-20251009-xyz seguido de um hash aleatório).
  - Segurança por Padrão: Todas as salas são criadas com uma senha forte e aleatória e com a sala de espera (lobby) ativada. O link de convite gerado para os alunos já contém as credenciais necessárias.
  - Relatório de Presença (Automático): O app monitora continuamente os eventos de entrada e saída de participantes e envia esses dados em tempo real para um endpoint da API Synapse, alimentando o sistema de presença sem qualquer intervenção manual.

### 3.2. Experiência do Aluno (Integrado ao App Synapse)

A experiência de aula ao vivo será embutida diretamente na plataforma Synapse que o aluno já utiliza.

#### Funcionalidade 1: Acesso com Um Clique

- **Descrição:** No painel do app Synapse, o aluno verá um banner ou um botão claro: "Sua aula de Matemática está ao vivo. Entrar agora". Um único clique o autentica e o direciona para a sala correta.

#### Funcionalidade 2: Experiência de Marca ("White-Label")

- **Descrição:** A interface da videochamada é carregada dentro da moldura do app Synapse (web ou móvel). Todos os elementos visuais externos (logo do Jitsi, links, etc.) são removidos, garantindo uma imersão completa no ecossistema Go Geo.

#### Funcionalidade 3: Presença Precisa

- **Descrição:** A integração via API/SDK permite que o backend Synapse saiba com exatidão o momento em que o aluno entra e sai da aula, ou mesmo se sua conexão cai, garantindo dados de presença 100% confiáveis e auditáveis.

#### Funcionalidade 4: Ferramenta de Feedback Silencioso

- **Descrição:** Um botão não-intrusivo e sempre visível na interface do aluno (e.g., um ícone de interrogação '❓') que ele pode clicar a qualquer momento. O primeiro clique ativa o status "com dúvida", enviando um evento para a API. O segundo clique desativa o status. A interface deve dar um feedback visual ao aluno (ex: o botão fica azul) para que ele saiba que seu status está ativo.

## 4. O que está Fora do Escopo (Pós-MVP)

- Gravação de Aulas na Nuvem: A funcionalidade de gravar as aulas e disponibilizá-las no Synapse será avaliada em uma fase futura.
- Ferramentas Despriorizadas: A "fila de mão levantada" e o "cronômetro" foram considerados desnecessários para o MVP, dado o tamanho reduzido das turmas e o uso de ferramentas externas (ActivInspire) pelo professor.
- Ferramentas de Interação Avançada: Funcionalidades como enquetes, quizzes em tempo real e reações com emojis não fazem parte do MVP.
- Auto-hospedagem (Self-Hosting): O MVP utilizará a infraestrutura de mídia pública e gratuita do Jitsi para validar o produto com custo mínimo. A migração para servidores próprios é um passo estratégico futuro.

## 5. Arquitetura Técnica de Alto Nível

- **Frontend (Interface):** Nossa versão customizada do Jitsi Meet (React) será hospedada como arquivos estáticos no Firebase Hosting sob um domínio nosso (ex: jitsi.gogeo.com).
- **Aplicativo do Professor:** Uma aplicação Electron que encapsula e carrega a nossa interface hospedada no Firebase, adicionando o "Painel de Controle" e integrações com o sistema operacional.
- **Experiência do Aluno:** A interface do Jitsi será embutida no frontend do Synapse utilizando a API Externa do Jitsi (para web) e/ou os SDKs Móveis (para Android/iOS).
- **Servidores de Mídia (Processamento A/V):** Serão utilizados os servidores públicos e gratuitos do Jitsi Videobridge.
- **Backend (Lógica e Dados):** Toda a lógica de negócio será gerenciada pela nossa API Synapse (Firebase Cloud Functions).

### Fluxo de Dados - Feedback Silencioso

1. Aluno clica no botão '❓'. O App Synapse envia:

```
POST /api/class-sessions/{id}/feedback
{ "status": "confused" }
```

2. O App do Professor faz polling a cada 10-15 segundos no endpoint:

```
GET /api/class-sessions/{id}/feedback
```

3. A resposta contém a lista de alunos com status "confused", e a UI do professor é atualizada.

## 6. Riscos e Plano de Mitigação

### Risco 1 (Alto): Dependência da Infraestrutura Pública do Jitsi.
- **Descrição:** Instabilidade, queda de performance ou mudanças na política de uso do serviço gratuito podem impactar diretamente nossas aulas.
- **Mitigação:** Reconhecer isso como uma solução temporária para o MVP. Planejar estrategicamente a migração para uma infraestrutura auto-hospedada assim que o modelo de negócio da franquia se provar sustentável.

### Risco 2 (Médio): Manutenção do Código Customizado.
- **Descrição:** O projeto Jitsi evolui. Nossa versão customizada pode ficar desatualizada, perdendo melhorias e correções de segurança.
- **Mitigação:** Alocar tempo de desenvolvimento a cada 3-6 meses para sincronizar nosso código com a versão oficial do Jitsi, tratando isso como uma tarefa de manutenção planejada.

---

Se quiser, eu posso:

- Gerar user stories detalhadas e critérios de aceitação por funcionalidade.
- Montar um backlog inicial com estimativas de esforço (T-shirt sizing).
- Criar diagramas de sequência para os fluxos críticos (ex.: criação automática de sala, relatório de presença).

Diga qual próximo artefato prefere que eu gere.
