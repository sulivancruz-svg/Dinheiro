# Deploy Checklist

Use este checklist antes de publicar o MVP em producao.

## Build e Testes

- [ ] Rodar `npm test -- --run`.
- [ ] Rodar `npm run build`.
- [ ] Confirmar que `next build` lista as rotas esperadas.

## Banco de Dados

- [ ] Configurar `DATABASE_URL` de producao.
- [ ] Rodar `npx prisma generate`.
- [ ] Aplicar schema com `npx prisma db push` ou fluxo de migrations definido para o ambiente.
- [ ] Rodar `npm run db:seed` apenas se dados demonstrativos forem desejados.
- [ ] Confirmar que o banco possui as tabelas de usuarios, diagnosticos, historico, consentimentos, chat e audit logs.

## Variaveis de Ambiente

- [ ] `DATABASE_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `GOOGLE_ID`
- [ ] `GOOGLE_SECRET`
- [ ] `GITHUB_ID`
- [ ] `GITHUB_SECRET`
- [ ] `CLAUDE_API_KEY`
- [ ] `EMAIL_SERVER_HOST`, se magic link estiver ativo.
- [ ] `EMAIL_SERVER_PORT`, se magic link estiver ativo.
- [ ] `EMAIL_SERVER_USER`, se magic link estiver ativo.
- [ ] `EMAIL_SERVER_PASSWORD`, se magic link estiver ativo.
- [ ] `EMAIL_FROM`, se magic link estiver ativo.

## Auth

- [ ] Configurar callback URL do Google para `/api/auth/callback/google`.
- [ ] Configurar callback URL do GitHub para `/api/auth/callback/github`.
- [ ] Confirmar `NEXTAUTH_URL` com o dominio final.
- [ ] Testar login, logout e acesso a rotas protegidas.

## LGPD

- [ ] Testar consentimentos em `/settings`.
- [ ] Testar exportacao em `/api/lgpd/export`.
- [ ] Testar solicitacao de exclusao em `/api/lgpd/delete-request`.
- [ ] Confirmar registros de auditoria para exportacao e exclusao.
- [ ] Documentar politica real de retencao antes de liberar hard delete.

## Pos-Deploy

- [ ] Criar diagnostico real em producao.
- [ ] Validar dashboard.
- [ ] Validar historico.
- [ ] Validar caixinhas.
- [ ] Validar mentor IA com `CLAUDE_API_KEY` configurada.
- [ ] Validar que `.env*` nao foi publicado.
