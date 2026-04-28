# Dinheiro com Direcao

MVP de educacao financeira com diagnostico, perfis, caixinhas, mentor IA e controles LGPD.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- PostgreSQL + Prisma 7
- NextAuth v4
- Claude API
- Tailwind CSS 4
- Vitest

## Funcionalidades

- Landing page
- Login com Google, GitHub e magic link
- Onboarding financeiro
- Dashboard com perfil, plano de acao e caixinhas
- Historico de diagnosticos
- Pagina detalhada de caixinhas
- Mentor financeiro com IA
- Settings com consentimentos LGPD
- Exportacao de dados LGPD
- Solicitacao de exclusao com soft delete

## Desenvolvimento

```bash
npm install
npm run db:seed
npm run dev
```

## Validacao

```bash
npm test -- --run
npm run build
```

## Variaveis de ambiente

Use `.env.example` como base. Em producao, configure as variaveis no provedor de deploy.

Obrigatorias:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_ID`
- `GOOGLE_SECRET`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `CLAUDE_API_KEY`

Obrigatorias se magic link por email estiver ativo:

- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`

## Deploy

Veja [docs/DEPLOY_CHECKLIST.md](docs/DEPLOY_CHECKLIST.md).

## Seguranca

Veja [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md).
