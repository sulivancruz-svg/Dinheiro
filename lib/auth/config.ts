import { type NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
    };
  }
}

const enableTestLogin =
  process.env.ENABLE_TEST_LOGIN === "true" ||
  process.env.NODE_ENV === "development";

function normalizeTestEmail(email?: string | null) {
  const fallback = process.env.TEST_LOGIN_EMAIL || "teste@seed.dinheiro.local";
  const candidate = email?.trim().toLowerCase() || fallback;

  if (!candidate.includes("@") || candidate.length > 254) {
    return fallback;
  }

  return candidate;
}

async function ensureTestUser(emailInput?: string | null, nameInput?: string | null) {
  const email = normalizeTestEmail(emailInput);
  const name = nameInput?.trim() || "Usuario Teste";
  const useSeedData = email === (process.env.TEST_LOGIN_EMAIL || "teste@seed.dinheiro.local");
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: existingUser.name || name,
        deletedAt: null,
        deletedPermanentlyAt: null,
      },
    });
  }

  return prisma.user.create({
    data: {
      email,
      name,
      emailVerified: new Date(),
      consentimentos: {
        create: [
          {
            tipo: "WHATSAPP",
            aceito: true,
            origin: "test-login",
          },
          {
            tipo: "EMAIL_MARKETING",
            aceito: true,
            origin: "test-login",
          },
        ],
      },
      ...(useSeedData
        ? {
            diagnosticos: {
              create: {
                rendaFixa: 8500,
                rendaVariavel: 1200,
                gastosFixos: 3900,
                gastosVariaveis: 1800,
                parcelasMensais: 450,
                dividaTotal: 5500,
                valorPoupado: 12000,
                valorInvestido: 18000,
                objetivoCurto: "Aumentar reserva",
                objetivoLongo: "Construir patrimonio",
                origem: "test-login",
              },
            },
            chatSessions: {
              create: {
                titulo: "Conversa de teste com Mentor",
                mensagens: {
                  create: [
                    {
                      role: "user",
                      conteudo: "Como devo organizar minhas caixinhas?",
                    },
                    {
                      role: "assistant",
                      conteudo:
                        "Comece separando essencial, futuro e dividas assim que a renda entrar.",
                    },
                  ],
                },
              },
            },
          }
        : {}),
    },
  });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(enableTestLogin
      ? [
          CredentialsProvider({
            id: "test-login",
            name: "Modo de Teste Local",
            credentials: {
              email: {
                label: "Email",
                type: "email",
              },
              name: {
                label: "Nome",
                type: "text",
              },
            },
            async authorize(credentials) {
              const user = await ensureTestUser(
                credentials?.email,
                credentials?.name
              );

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
              };
            },
          }),
        ]
      : []),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587", 10) || 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "noreply@dinheirocomdirecao.com",
      type: "email",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id || (token.id as string);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login?error=true",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Validate critical environment variables at startup
function validateEnv() {
  const requiredVars = ["NEXTAUTH_SECRET"];
  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(
      `Missing critical environment variables: ${missing.join(", ")}`
    );
  }
}

// Call validation when config is loaded
validateEnv();
