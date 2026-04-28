# Design Doc: "Dinheiro com Direção"

**Data:** 27 de abril de 2025  
**Versão:** 1.0 (MVP)  
**Status:** Aprovado  

---

## 1. Visão do Produto

### 1.1 Promessa
> Organize seu dinheiro, entenda seus padrões e descubra o próximo passo para crescer financeiramente, mesmo que você nunca tenha aprendido a cuidar das suas finanças.

### 1.2 Objetivo
Criar um assistente financeiro comportamental que permite ao usuário:
- Cadastrar renda, gastos, dívidas, contas e objetivos
- Receber diagnóstico financeiro automático
- Entender seu perfil e padrões de comportamento
- Acessar um mentor IA que responde dúvidas de forma contextualizada
- Organizar dinheiro em "caixinhas" (categorias)
- Acompanhar evolução mensal

### 1.3 Público-Alvo
Pessoas comuns (18+), sem conhecimento financeiro técnico, que:
- Ganham dinheiro mas não conseguem organizar
- Sentem que o dinheiro "desaparece"
- Têm dívidas e não sabem por onde começar
- Querem criar reserva e hábitos saudáveis

### 1.4 Tom de Linguagem
- **Simples, direto e acolhedor** — sem jargões financeiros
- **Educacional, não prescritivo** — oferece caminho, não força
- **Sem julgamentos** — reconhece dificuldades reais
- **Realista** — não promete enriquecimento rápido

### 1.5 Disclaimers Obrigatórios
```
"Este app oferece educação e organização financeira. 
Ele não substitui orientação profissional personalizada, 
consultoria financeira ou recomendação de investimento."
```

---

## 2. Modelo de Negócio

### 2.1 Freemium
| Recurso | Grátis | Premium |
|---------|--------|---------|
| Visualizar diagnóstico demo | ✓ | ✓ |
| Dados temporários (não salva) | ✓ | - |
| Entrada/edição de dados | - | ✓ |
| Mentor IA (chat) | - | ✓ |
| Histórico mensal | - | ✓ |
| Caixinhas (edição) | - | ✓ |
| Limite de perguntas ao mentor | - | 20/hora |

### 2.2 Autenticação
- **OAuth:** Google, GitHub (sem senha no banco)
- **Magic Link:** Email (sem senha)
- **NextAuth.js v4** gerencia sessões criptografadas

### 2.3 Conversão
- Demo grátis converte para Premium no onboarding
- Consentimento explícito antes de salvar dados
- Sem parede de pagamento inicial

---

## 3. Arquitetura

### 3.1 Stack
```
Frontend:     Next.js 14 (App Router) + TypeScript + Tailwind CSS
Backend:      Next.js API Routes
Banco:        PostgreSQL (Supabase ou Neon)
ORM:          Prisma 5
Autenticação: NextAuth.js v4
IA:           Claude API 3.5 Sonnet
Storage:      S3 ou MinIO (CSVs)
Gráficos:     Recharts
Deploy:       Vercel
```

### 3.2 Arquitetura em Camadas
```
┌─────────────────────────────────────┐
│   Vercel (Frontend + API Routes)    │
├──────────────┬──────────────────────┤
│ Next.js UI   │ API Routes           │
│ ├─ Pages     │ ├─ Auth (NextAuth)   │
│ ├─ Layouts   │ ├─ Diagnóstico       │
│ └─ Components│ ├─ Mentor (Claude)   │
│              │ ├─ Upload CSV        │
│              │ └─ Chat/Histórico    │
│              │                      │
│ CAMADA DE    │ (Serviços)           │
│ DOMÍNIO:     │ ├─ DiagnosticoService
│ ├─ Cálculos  │ ├─ PerfilService     │
│ ├─ Perfil    │ ├─ CaixinhasService  │
│ └─ Ações     │ └─ PlanoAcaoService  │
└──────────────┴──────────────────────┘
         ↓
┌──────────────────────────────────────┐
│    PostgreSQL (Supabase/Neon)        │
│    Prisma ORM (migrations versionadas)
└──────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Serviços Externos:                  │
│ ├─ Claude API (sanitized data)      │
│ ├─ S3/MinIO (encrypted CSVs)        │
│ └─ (Agregador financeiro - fase 2)  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Segurança & LGPD (transversal):     │
│ ├─ Criptografia AES-256             │
│ ├─ Rate limiting                    │
│ ├─ Consentimento explícito          │
│ ├─ Logs sem dados sensíveis         │
│ ├─ Soft delete (direito ao          │
│ │  esquecimento)                    │
│ └─ Auditoria                        │
└─────────────────────────────────────┘
```

### 3.3 Fluxo de Dados
```
1. Usuário preenche diagnóstico (modal/form)
   ↓
2. Dados são validados (Zod schema)
   ↓
3. DiagnosticoService calcula números
   ↓
4. PerfilService classifica perfil automático
   ↓
5. PlanoAcaoService (lógica + IA) gera ações
   ↓
6. Dados são salvos no PostgreSQL (se premium)
   ↓
7. Dashboard renderiza com Recharts
   ↓
8. Chat do mentor pode acessar dados sanitizados
```

---

## 4. Modelo de Dados (Prisma Schema)

### 4.1 Tabelas Principais

```prisma
// Autenticação & Usuário
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String
  plano           String    @default("free") // "free" | "premium"
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime? // soft delete
  deletedPermanentlyAt DateTime? // hard delete (após 90 dias)
  
  // Relações
  diagnosticos    Diagnostico[]
  chatSessions    ChatSession[]
  consentimentos  Consentimento[]
  historicoMensal HistoricoMensal[]
  
  @@map("usuarios")
}

// Diagnóstico Financeiro
model Diagnostico {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Renda
  rendaFixa       Float     @default(0)
  rendaVariavel   Float     @default(0)
  
  // Gastos
  gastosFixos     Float     @default(0)
  gastosVariaveis Float     @default(0)
  
  // Dívidas
  dividaTotal     Float     @default(0)
  parcelasMensais Float     @default(0)
  
  // Patrimônio
  valorPoupado    Float     @default(0)
  valorInvestido  Float     @default(0)
  
  // Objetivos
  objetivoCurto   String?
  objetivoLongo   String?
  
  // Metadata
  origem          String    @default("manual") // "manual" | "csv" | "api"
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relações
  historicoMensal HistoricoMensal[]
  transacoesCSV   TransacaoCSV[]
  
  @@map("diagnosticos")
}

// Histórico Mensal (snapshots)
model HistoricoMensal {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  diagnosticoId   String
  diagnostico     Diagnostico @relation(fields: [diagnosticoId], references: [id], onDelete: Cascade)
  
  mes             DateTime  // primeiro dia do mês
  
  // Snapshots de cálculos
  rendaTotal      Float
  gastosTotal     Float
  saldoMensal     Float
  percentualComprometido Float
  percentualDivida Float
  nivelRisco      String    // "critico" | "atencao" | "organizando" | "saudavel" | "crescimento"
  perfil          String    // classificação automática
  
  // Plano de ação
  problemaaPrincipal String?
  prioridadeMes   String?
  metaEconomia    Float?
  
  createdAt       DateTime  @default(now())
  
  @@unique([userId, mes])
  @@map("historico_mensal")
}

// Transações CSV
model TransacaoCSV {
  id              String    @id @default(cuid())
  diagnosticoId   String
  diagnostico     Diagnostico @relation(fields: [diagnosticoId], references: [id], onDelete: Cascade)
  
  arquivoHash     String    @unique // SHA256
  caminhoStorage  String    // "s3://bucket/user-id/arquivo.csv"
  quantidadeLinhas Int
  
  status          String    @default("processado")
  erroMsg         String?
  
  dataUpload      DateTime  @default(now())
  
  @@map("transacoes_csv")
}

// Chat Mentor IA
model ChatSession {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  titulo          String    @default("Conversa com Mentor")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  mensagens       ChatMessage[]
  
  @@map("chat_sessions")
}

model ChatMessage {
  id              String    @id @default(cuid())
  sessionId       String
  session         ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  role            String    // "user" | "assistant"
  conteudo        String    @db.Text
  
  createdAt       DateTime  @default(now())
  
  @@map("chat_messages")
}

// Consentimento LGPD
model Consentimento {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  tipo            String    // "dados_financeiros" | "marketing" | "termos"
  aceito          Boolean
  dataConsentimento DateTime @default(now())
  ipAddress       String?   // auditoria
  
  @@map("consentimentos")
}

// Auditoria
model AuditLog {
  id              String    @id @default(cuid())
  evento          String    // "user_accessed_diagnostico"
  userId          String?
  timestamp       DateTime  @default(now())
  ipAddress       String?
  userAgent       String?
  detalhes        String?   @db.Text // sem dados sensíveis
  
  @@map("audit_logs")
}
```

---

## 5. Lógica de Negócio

### 5.1 Cálculos Financeiros

```typescript
// lib/services/DiagnosticoService.ts

calcularRendaTotal(fixa, variavel) → fixa + variavel

calcularGastosTotais(fixos, variaveis) → fixos + variaveis

calcularSaldoMensal(renda, gastos, parcelas) → renda - gastos - parcelas

calcularPercentualComprometido(gastos + parcelas, renda) → %

calcularPercentualDivida(parcelas, renda) → %

calcularCapacidadePoupanca(saldo) → max(saldo, 0)

calcularPatrimonioLiquido(poupado + investido - divida) → $
```

### 5.2 Classificação Automática de Perfis

6 perfis baseados **apenas em dados financeiros** (sem questionário):

| Perfil | Critérios | Mensagem |
|--------|-----------|----------|
| **Sobrevivente** | Saldo < 0 OU % comprometido > 100% | "Você está vivendo apagando incêndios" |
| **Gastador Emocional** | Saldo 0-200 + % >80% + poupança <R$1k | "O dinheiro entra e desaparece rápido" |
| **Acumulador Ansioso** | Poupança >R$1k + saldo <500 + dívidas | "Você guarda, mas vive com medo" |
| **Organizador em Construção** | Saldo 500-2k + % <75% + patrimônio <R$10k | "Você tem método, precisa de direção" |
| **Potencial Travado** | Saldo >2k + % <60% + poupança <R$5k | "Você pode crescer, algo bloqueia" |
| **Construtor de Patrimônio** | Saldo >1k + % <60% + patrimônio >R$20k | "Você já está no caminho certo" |

### 5.3 Plano de Ação

**Lógica híbrida:** regras determinísticas + IA generativa

1. **Regras identificam:** problema principal, prioridade do mês
2. **IA redige:** 3 ações práticas, meta de economia, hábito semanal, alerta, mensagem motivacional

Exemplo:
```
Entrada: Usuario com saldo +450, % comprometido 88%, sem reserva
Regra identifica: "Dívida alta, sem reserva"
IA gera: "Seu saldo é bom. Prioridade é criar uma pequena reserva 
(R$ 200) enquanto reduz gastos variáveis em R$ 250. Isso libera 
margem para começar a respirar."
```

### 5.4 Caixinhas (Categorias de Alocação)

7 categorias recomendadas com percentuais variáveis por perfil:

1. **Essencial** — Moradia, mercado, transporte, contas (base obrigatória)
2. **Dívidas** — Parcelas, cartão, financiamentos
3. **Futuro** — Reserva de emergência + investimentos
4. **Prazer sem Culpa** — Lazer, restaurante, pequenos desejos
5. **Crescimento** — Cursos, livros, desenvolvimento pessoal
6. **Grandes Planos** — Viagens, carro, casa, casamento, filhos
7. **Generosidade** — Presentes, ajuda, doações

**Algoritmo de sugestão:** personalizado por perfil/situação

---

## 6. Integração com IA (Mentor)

### 6.1 Fluxo do Mentor

```
1. Usuário faz pergunta no chat
2. Sistema busca diagnóstico do usuário
3. SANITIZA: resume em linguagem alta (sem números exatos)
4. Busca histórico chat (últimas 5 mensagens)
5. Monta prompt com system instructions
6. Chama Claude API 3.5 Sonnet
7. Salva conversa no banco
8. Renderiza resposta no UI
```

### 6.2 Dados Enviados para Claude

**Nunca enviamos:**
- Números exatos de renda/gastos
- Dados de conta bancária
- Valores precisos de dívida

**Sempre enviamos:**
- Faixas de renda ("R$ 2-3 mil")
- Descrições de situação ("gastos altos", "dívidas presentes")
- Perfil do usuário
- Histórico da conversa (para contexto)
- Instruções de comportamento (system prompt)

### 6.3 System Prompts

4 prompts principais:

1. **MENTOR_SYSTEM_PROMPT**
   - Identidade: acolhedor, sem julgamentos
   - Sem promessas, sem produtos específicos
   - Linguagem simples, educacional

2. **DIAGNOSTICO_SYSTEM_PROMPT**
   - Gera diagnóstico em linguagem acessível
   - Estrutura: resumo 1 frase + 3 números + nível risco + próximo passo

3. **PLANO_ACAO_SYSTEM_PROMPT**
   - Gera plano mensal realizável
   - Estrutura: problema + prioridade + 3 ações + meta + hábito + alerta + motivação

4. **CAIXINHAS_SYSTEM_PROMPT**
   - Sugere divisão personalizada
   - Sempre prioriza: ESSENCIAL > DÍVIDAS > FUTURO

---

## 7. Segurança e LGPD

### 7.1 Proteção de Dados

| Camada | Implementação |
|--------|---------------|
| **Em Repouso** | AES-256 para CSV + dados sensíveis |
| **Em Trânsito** | HTTPS obrigatório + TLS 1.3 |
| **Validação** | Zod schema + sanitização de entrada |
| **Logs** | Nunca incluem números ou dados sensíveis |

### 7.2 Autenticação & Sessão

- NextAuth.js v4 com OAuth (sem senha)
- Sessões JWT criptografadas
- CSRF protection automática (Next.js)
- Rate limiting: 10 req/min por IP

### 7.3 LGPD Compliance

| Direito | Implementação |
|--------|---------------|
| **Consentimento** | Explícito antes de salvar (UI checkbox) |
| **Transparência** | Política clara no cadastro |
| **Acesso** | Usuário pode baixar seus dados |
| **Correção** | Pode editar dados quando quiser |
| **Apagamento** | Soft delete imediato + hard delete 90 dias |
| **Revogação** | Pode revogar consentimento (ativa modo "leitura" apenas) |
| **Portabilidade** | Pode exportar histórico como PDF |

### 7.4 Consentimento

Antes de salvar dados (premium):

```
"Você autoriza o app a armazenar e processar 
seus dados financeiros para gerar diagnóstico e 
recomendações personalizadas?"

☐ Sim, autorizo
☐ Não, modo demo apenas (dados não salvo)
```

Se usuário não autoriza: modo demo, sem salvar no banco.

### 7.5 Direito ao Esquecimento

```
Soft Delete (imediato):
- Email anonimizado
- Dados marcados como deleted=true
- Usuário não consegue fazer login

Hard Delete (90 dias depois):
- Exclusão permanente em cascata
- Diagnósticos → Chat → Histórico → User
- S3 folder deletado
```

### 7.6 Headers de Segurança

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### 7.7 Rate Limiting

```
- Mentor IA: 20 mensagens/hora por usuário
- Upload CSV: 5 uploads/dia
- Login: 10 tentativas/15min
- API geral: 100 req/min
```

---

## 8. MVP: 7 Telas

### 8.1 Landing Page
**Objetivo:** Vender proposta e levar ao cadastro

Seções:
- Hero com headline + CTA
- 3 benefícios principais
- Depoimentos/social proof
- Footer com links

### 8.2 Cadastro / Login
**Objetivo:** Rápida autenticação

Opções:
- Google OAuth
- GitHub OAuth
- Magic link (email)

### 8.3 Onboarding Financeiro
**Objetivo:** Coletar dados brutos + obter consentimento

3 passos:
1. Renda fixa + variável
2. Gastos fixos + variáveis
3. Dívidas + patrimônio

+ Consentimento LGPD ao final

### 8.4 Dashboard
**Objetivo:** Visão geral em uma tela

Componentes:
- Cartão: Saldo do mês
- Linha: Renda, gastos, dívidas, poupança
- Cartão: Situação (nível risco + perfil)
- Cartão: Próxima melhor ação
- Gráfico: Distribuição por caixinhas
- Alertas

### 8.5 Mentor IA (Chat)
**Objetivo:** Conversas personalizadas

Funcionalidades:
- Histórico de conversa
- Sugestões de perguntas
- Contexto automático (dados do usuário)
- Rate limiting visual (20/hora)

### 8.6 Histórico Mensal
**Objetivo:** Ver evolução ao longo do tempo

Componentes:
- Gráfico: Saldo mensal (últimos 6 meses)
- Tabela: Evolução mês a mês
- Insights automáticos
- Botão: Exportar como PDF

### 8.7 Caixinhas em Detalhe
**Objetivo:** Entender alocação e ajustar

Para cada caixinha:
- Nome + descrição
- Valor atual + %
- % recomendado
- Status (🟢 no alvo / 🟡 abaixo / 🔴 acima)
- Dica: como ajustar

---

## 9. User Stories (MVP)

```gherkin
# Free Plan
Feature: Demo Interativa
  As a potential user
  I want to fill sample data and see how the app works
  So that I can decide if it's worth upgrading

  Scenario: Fill demo data
    Given I'm on the onboarding page
    When I fill sample values
    And I choose "don't save"
    Then I see a read-only dashboard
    And I can use the mentor (limited)

# Premium Plan
Feature: Diagnóstico Financeiro
  As a premium user
  I want to fill my real financial data
  So that I can get a personalized diagnosis

  Scenario: Save diagnosis
    Given I'm authenticated as premium
    When I fill my income, expenses, and debts
    And I accept the consent
    Then my data is saved encrypted
    And my dashboard shows calculations

Feature: Mentor IA
  As a premium user
  I want to chat with a financial mentor
  So that I can get personalized answers

  Scenario: Ask a question
    Given I'm on the mentor page
    When I type "Como começar a guardar?"
    Then the AI responds with context about my situation
    And the message is saved in history
```

---

## 10. Métricas de Sucesso (MVP)

```
Adoção:
- 100+ cadastros (primeiras 2 semanas)
- 20% conversão grátis → premium (primeira semana)
- 5+ reviews (feedback qualitativo)

Engajamento:
- 30%+ voltam 7 dias após cadastro
- Mentor IA: média 3+ mensagens por sessão
- Dashboard: 60%+ usuários acessam 2+ vezes/semana

Qualidade:
- 0 crashes reportados
- Tempo de resposta da IA: < 3 segundos
- LGPD: 100% consentimento documentado
```

---

## 11. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Dados sensíveis expostos** | 🔴 Crítico | Criptografia AES-256, auditoria, testes de segurança |
| **IA gera recomendação errada** | 🟠 Alto | System prompts rigorosos, disclaimer claro, sem produtos específicos |
| **Taxa de churn alta** | 🟠 Alto | Onboarding claro, mentor IA contextualizado, feedback loop rápido |
| **LGPD não compliance** | 🟠 Alto | Consentimento explícito, soft/hard delete, logs auditados |
| **Escalabilidade do mentor** | 🟡 Médio | Rate limiting, filas assincronamente (fase 2) |

---

## 12. Roadmap (Fases)

### **Fase 1 (MVP) — 4 semanas**
- [x] Landing page
- [x] Auth (OAuth + Magic link)
- [x] Onboarding + diagnóstico
- [x] Dashboard
- [x] Mentor IA
- [x] Histórico mensal
- [x] Caixinhas
- [x] LGPD + segurança
- [ ] Deploy em produção

### **Fase 2 — 4 semanas**
- Upload de CSV com processamento assincronizado (BullMQ)
- Integração com agregador financeiro (Plaid/StoneCo)
- Notificações push/email
- Exportar relatórios
- Dashboard admin básico

### **Fase 3 — 4 semanas**
- Multiusuário (famílias/grupos)
- Integração de CRM (email marketing)
- Análise de comportamento (ML)
- Recomendações de economia

---

## 13. Definição de Pronto (MVP)

**Code:**
- [ ] Todas as telas implementadas e responsivas
- [ ] API routes testadas (unit + integration)
- [ ] Tratamento de erros completo
- [ ] Sem console.log, sem dados sensíveis em logs

**Segurança:**
- [ ] HTTPS obrigatório
- [ ] Rate limiting ativo
- [ ] Headers de segurança
- [ ] Consentimento LGPD funcionando
- [ ] Soft delete implementado

**UX:**
- [ ] Landing page convertendo
- [ ] Onboarding claro (não deixa dúvidas)
- [ ] Chat mentor respondendo corretamente
- [ ] Dashboard renderizando rápido (<2s)

**Dados:**
- [ ] Schema Prisma finalizado
- [ ] Migrations versionadas
- [ ] Backup automático configurado
- [ ] Auditoria funcionando

**Deploy:**
- [ ] Vercel configurado com domínio
- [ ] Variáveis de ambiente seguras
- [ ] Database em produção (Supabase/Neon)
- [ ] Claude API key segura

---

## 14. Decisões Arquiteturais Documentadas

| Decisão | Alternativa Descartada | Justificativa |
|---------|------------------------|---------------|
| Monolítica (Next.js) | Microserviços | MVP rápido, escalabilidade garantida depois |
| Prisma + PostgreSQL | Firebase/Supabase Auth | Controle total de dados, compliance LGPD melhor |
| Claude API | OpenAI GPT | Preferência por Claude, melhor contexto, menos tokens |
| Dados sanitizados | Dados brutos para IA | Segurança + privacidade, confiança do usuário |
| OAuth sem senha | Email + senha | Menos superfície de ataque, UX melhor |
| Soft delete | Hard delete imediato | LGPD: direito ao esquecimento em 90 dias |

---

## 15. Glossário

| Termo | Definição |
|-------|-----------|
| **Diagnóstico** | Cálculo dos números financeiros do usuário (renda, gastos, saldo, etc) |
| **Perfil** | Classificação automática (Sobrevivente, Organizador, etc) |
| **Caixinha** | Categoria de alocação de dinheiro (Essencial, Dívidas, Futuro, etc) |
| **Mentor IA** | Chat que responde perguntas com dados contextualizados |
| **Plano de Ação** | Recomendações práticas geradas por mês |
| **Soft Delete** | Marca como deleted, mas não apaga do banco |
| **Hard Delete** | Apagamento permanente (após 90 dias) |
| **System Prompt** | Instruções que a IA recebe para agir de forma específica |

---

## 16. Notas Finais

1. **Sem cópia do livro:** Inspirado em conceitos, mas sem transcrever conteúdo protegido
2. **Educação, não consultoria:** App claramente posicionado como ferramenta educacional
3. **Preparado para crescimento:** Arquitetura preparada para fase 2+ sem refatoração major
4. **LGPD desde dia 1:** Segurança e privacidade não são "depois"
5. **Teste com usuários reais:** MVP vai validar hipóteses, iterar rapidamente

---

**Versão:** 1.0  
**Aprovado por:** Usuário  
**Próximo passo:** Invocar skill `writing-plans` para implementação
