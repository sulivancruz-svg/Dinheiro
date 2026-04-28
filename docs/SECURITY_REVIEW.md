# Security Review

Revisao rapida realizada antes do deploy.

## Resultado

- Build passa com `npm run build`.
- Testes passam com `npm test -- --run`.
- `.env*` esta ignorado por `.gitignore`.
- `.env.example` contem apenas placeholders.
- Varredura local nao encontrou padroes obvios de segredo fora de `.env*`.
- `prisma.config.js` usa `process.env.DATABASE_URL`, sem URL hardcoded.

## Rotas Protegidas

O `proxy.ts` protege:

- `/dashboard`
- `/onboarding`
- `/mentor`
- `/historico`
- `/caixinhas`
- `/settings`
- `/api/lgpd/*`

Os endpoints de API sensiveis tambem checam sessao no handler.

## LGPD

- Exportacao de dados: `GET /api/lgpd/export`.
- Solicitacao de exclusao: `POST /api/lgpd/delete-request`.
- Consentimentos: `POST /api/consent`.
- Auditoria: eventos `lgpd_export_requested`, `lgpd_delete_requested`, `consent_created`, `consent_updated`.

## Dados Sensíveis

- Tokens OAuth e `sessionToken` nao sao exportados pela rota LGPD.
- Logs estruturados passam por sanitizacao basica em `logSecureEvent`.
- Dados financeiros nao devem ser enviados a logs.

## Riscos Pendentes

- Rate limiting atual e em memoria; em producao multi-instancia, trocar por Redis ou storage compartilhado.
- `prisma db push` e pratico para MVP, mas migrations formais devem ser definidas antes de producao madura.
- Soft delete marca `deletedAt`, mas ainda falta job/processo de exclusao permanente apos janela de retencao.
- Magic link depende de SMTP real e deve ser testado no dominio final.
- A chave antiga do Supabase apareceu no historico local anterior e deve permanecer rotacionada.
