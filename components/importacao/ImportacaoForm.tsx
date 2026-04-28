"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type Suggestion = {
  rendaFixa: number;
  rendaVariavel: number;
  gastosFixos: number;
  gastosVariaveis: number;
  parcelasMensais: number;
  valorPoupado: number;
  valorInvestido: number;
  dividaTotal: number;
};

type AnalysisResult = {
  fileName: string;
  sourceType: string;
  transactions: number;
  summary: {
    income: number;
    expenses: number;
    positiveCount: number;
    negativeCount: number;
  };
  suggestion: Suggestion;
};

const fields: Array<{ name: keyof Suggestion; label: string }> = [
  { name: "rendaFixa", label: "Renda fixa" },
  { name: "rendaVariavel", label: "Renda variavel detectada" },
  { name: "gastosFixos", label: "Gastos fixos" },
  { name: "gastosVariaveis", label: "Gastos variaveis detectados" },
  { name: "parcelasMensais", label: "Parcelas mensais" },
  { name: "dividaTotal", label: "Divida total" },
  { name: "valorPoupado", label: "Valor poupado" },
  { name: "valorInvestido", label: "Valor investido" },
];

const currency = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

export function ImportacaoForm() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState("extrato");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [values, setValues] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function analyzeFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("sourceType", sourceType);

    startTransition(() => {
      void fetch("/api/importacao/analisar", {
        method: "POST",
        body: formData,
      })
        .then(async (response) => {
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Nao foi possivel analisar o arquivo.");
          }

          setResult(data);
          setValues(data.suggestion);
        })
        .catch((requestError: unknown) => {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Nao foi possivel analisar o arquivo."
          );
        });
    });
  }

  function saveDiagnostico() {
    if (!values) return;
    setError(null);

    startTransition(() => {
      void fetch("/api/diagnostico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })
        .then(async (response) => {
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Nao foi possivel salvar diagnostico.");
          }

          router.push(`/dashboard?diagnostico=${data.id}`);
          router.refresh();
        })
        .catch((requestError: unknown) => {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Nao foi possivel salvar diagnostico."
          );
        });
    });
  }

  function updateValue(name: keyof Suggestion, value: string) {
    setValues((current) => ({
      ...(current || {
        rendaFixa: 0,
        rendaVariavel: 0,
        gastosFixos: 0,
        gastosVariaveis: 0,
        parcelasMensais: 0,
        valorPoupado: 0,
        valorInvestido: 0,
        dividaTotal: 0,
      }),
      [name]: Number(value || 0),
    }));
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle>Upload de extrato ou fatura</CardTitle>
        <CardDescription>
          Envie CSV, OFX, TXT ou PDF exportado pelo banco/cartao. PDF precisa
          ter texto selecionavel; PDF escaneado como imagem pode falhar.
        </CardDescription>

        <form className="mt-6 space-y-4" onSubmit={analyzeFile}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="rounded-2xl border border-[var(--color-ink)]/10 bg-white/65 p-4">
              <span className="text-sm font-bold text-[var(--color-ink)]">
                Tipo de arquivo
              </span>
              <select
                className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--color-ink)]/12 bg-white px-4"
                onChange={(event) => setSourceType(event.target.value)}
                value={sourceType}
              >
                <option value="extrato">Extrato bancario</option>
                <option value="cartao">Fatura de cartao</option>
              </select>
            </label>

            <label className="rounded-2xl border border-[var(--color-ink)]/10 bg-white/65 p-4">
              <span className="text-sm font-bold text-[var(--color-ink)]">
                Arquivo
              </span>
              <input
                accept=".csv,.ofx,.txt,.pdf,text/csv,text/plain,application/pdf"
                className="mt-3 block w-full text-sm"
                name="file"
                required
                type="file"
              />
            </label>
          </div>

          <Button disabled={isPending} type="submit">
            {isPending ? "Analisando..." : "Analisar arquivo"}
          </Button>
        </form>
      </Card>

      {error ? (
        <p className="rounded-2xl border border-red-900/20 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      {result && values ? (
        <Card>
          <CardTitle>Resultado da analise</CardTitle>
          <CardDescription>
            {result.transactions} transacoes encontradas em {result.fileName}.
            Ajuste os campos antes de salvar.
          </CardDescription>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--color-sand)]/45 p-4">
              <p className="text-sm text-[var(--color-muted)]">Entradas</p>
              <p className="mt-1 text-2xl font-black">
                {currency.format(result.summary.income)}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-sand)]/45 p-4">
              <p className="text-sm text-[var(--color-muted)]">Saidas</p>
              <p className="mt-1 text-2xl font-black">
                {currency.format(result.summary.expenses)}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-sand)]/45 p-4">
              <p className="text-sm text-[var(--color-muted)]">Transacoes</p>
              <p className="mt-1 text-2xl font-black">{result.transactions}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <Input
                key={field.name}
                label={field.label}
                min="0"
                onChange={(event) => updateValue(field.name, event.target.value)}
                step="0.01"
                type="number"
                value={values[field.name]}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button disabled={isPending} onClick={saveDiagnostico}>
              {isPending ? "Salvando..." : "Salvar diagnostico"}
            </Button>
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              O arquivo nao e armazenado; apenas o diagnostico final e salvo.
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
