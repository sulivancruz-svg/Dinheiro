"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface Message {
  role: "USER" | "ASSISTANT";
  content: string;
  timestamp: Date;
}

interface Diagnostico {
  id: string;
  perfil: string;
  rendaTotal: number;
  saldoMensal: number;
  patrimonioLiquido: number;
}

const perfilLabels: Record<string, string> = {
  sobrevivente_financeiro: "Sobrevivente financeiro",
  gastador_emocional: "Gastador emocional",
  acumulador_ansioso: "Acumulador ansioso",
  organizador_em_construcao: "Organizador em construcao",
  potencial_travado: "Potencial travado",
  construtor_patrimonio: "Construtor de patrimonio",
};

const currency = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

export default function MentorPage() {
  const router = useRouter();
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingData, setFetchingData] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    async function fetchData() {
      try {
        const diagRes = await fetch("/api/diagnostico?latest=true");

        if (diagRes.status === 404) {
          setError("Nenhum diagnostico encontrado. Complete o onboarding primeiro.");
          setFetchingData(false);
          return;
        }

        if (!diagRes.ok) {
          throw new Error("Falha ao carregar diagnostico");
        }

        const diag = await diagRes.json();
        setDiagnostico(diag);
        setMessages([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      } finally {
        setFetchingData(false);
      }
    }

    void fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!question.trim()) return;
    if (!diagnostico) {
      setError("Diagnostico nao carregado");
      return;
    }

    const submittedQuestion = question;

    try {
      setError(null);
      setLoading(true);

      setMessages((prev) => [
        ...prev,
        {
          role: "USER",
          content: submittedQuestion,
          timestamp: new Date(),
        },
      ]);
      setQuestion("");

      const response = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: submittedQuestion }),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao obter resposta do mentor");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "ASSISTANT",
          content: data.resposta,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  if (fetchingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--color-ink)]" />
      </div>
    );
  }

  if (error && !diagnostico) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#fff8ec,#f2dcad)] px-5 py-8">
        <section className="mx-auto w-full max-w-2xl">
          <Alert tone="warning">{error}</Alert>
          <a
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-ink)] px-5 text-sm font-bold tracking-[-0.01em] text-[var(--color-paper)] shadow-[0_18px_40px_rgba(35,31,26,0.24)] transition hover:-translate-y-0.5"
            href="/onboarding"
          >
            Ir para onboarding
          </a>
        </section>
      </main>
    );
  }

  if (!diagnostico) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff8ec,#f2dcad)] px-5 py-8">
      <section className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--color-clay)]">
            Mentor Financeiro IA
          </p>
          <h1 className="font-display mt-2 text-5xl font-black leading-none tracking-[-0.06em] text-[var(--color-ink)]">
            Seu assistente financeiro
          </h1>
          <p className="mt-2 text-[var(--color-muted)]">
            Converse com seu assistente financeiro pessoal.
          </p>
        </div>

        <Card className="border-[var(--color-river)]/20 bg-[linear-gradient(135deg,rgba(82,164,188,0.08),rgba(242,220,173,0.08))]">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <CardDescription>Perfil</CardDescription>
              <p className="mt-2 text-lg font-black text-[var(--color-ink)]">
                {perfilLabels[diagnostico.perfil] ||
                  diagnostico.perfil.replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <CardDescription>Renda total</CardDescription>
              <p className="mt-2 text-lg font-black text-[var(--color-ink)]">
                {currency.format(diagnostico.rendaTotal)}
              </p>
            </div>
            <div>
              <CardDescription>Saldo mensal</CardDescription>
              <p
                className={`mt-2 text-lg font-black ${
                  diagnostico.saldoMensal >= 0
                    ? "text-[var(--color-leaf)]"
                    : "text-[var(--color-clay)]"
                }`}
              >
                {currency.format(diagnostico.saldoMensal)}
              </p>
            </div>
            <div>
              <CardDescription>Patrimonio</CardDescription>
              <p
                className={`mt-2 text-lg font-black ${
                  diagnostico.patrimonioLiquido >= 0
                    ? "text-[var(--color-leaf)]"
                    : "text-[var(--color-clay)]"
                }`}
              >
                {currency.format(diagnostico.patrimonioLiquido)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="flex min-h-96 flex-col">
          <div className="mb-4 max-h-96 flex-1 space-y-4 overflow-y-auto border-b border-[var(--color-ink)]/10 p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[var(--color-muted)]">
                <p className="text-center">
                  Comece a conversa perguntando algo sobre suas financas.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  className={`flex ${
                    msg.role === "USER" ? "justify-end" : "justify-start"
                  }`}
                  key={`${msg.role}-${msg.timestamp.toISOString()}-${idx}`}
                >
                  <div
                    className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-6 ${
                      msg.role === "USER"
                        ? "rounded-br-none bg-[var(--color-ink)] text-[var(--color-paper)]"
                        : "rounded-bl-none bg-[var(--color-sand)]/60 text-[var(--color-ink)]"
                    }`}
                  >
                    <p className="break-words">{msg.content}</p>
                    <p
                      className={`mt-2 text-xs ${
                        msg.role === "USER"
                          ? "text-[var(--color-paper)]/60"
                          : "text-[var(--color-muted)]"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-none bg-[var(--color-sand)]/60 px-4 py-3 text-[var(--color-ink)]">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-ink)]" />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-ink)]"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-ink)]"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          {error ? (
            <div className="px-4 pb-4 pt-0">
              <Alert tone="warning">{error}</Alert>
            </div>
          ) : null}

          <form className="flex gap-3 p-4" onSubmit={handleSubmit}>
            <Input
              disabled={loading}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Faca uma pergunta sobre suas financas..."
              type="text"
              value={question}
            />
            <Button
              className="flex-shrink-0 px-6"
              disabled={loading || !question.trim()}
              type="submit"
            >
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </form>
        </Card>

        <Card className="border-[var(--color-leaf)]/20 bg-[linear-gradient(135deg,rgba(130,184,121,0.08),rgba(242,220,173,0.08))]">
          <h3 className="mb-3 font-black text-[var(--color-ink)]">
            Dicas de perguntas
          </h3>
          <ul className="space-y-2 text-sm leading-6 text-[var(--color-ink)]">
            <li className="flex gap-2">
              <span className="flex-shrink-0">-</span>
              <span>Como posso aumentar minha renda?</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0">-</span>
              <span>Qual e a melhor estrategia para meu perfil?</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0">-</span>
              <span>Como devo alocar meu orcamento?</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0">-</span>
              <span>O que fazer para alcancar meus objetivos?</span>
            </li>
          </ul>
        </Card>
      </section>
    </main>
  );
}
