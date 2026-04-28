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
  items: Array<{
    amount: number;
    date?: string;
    description: string;
    line: string;
  }>;
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
  const [includedItems, setIncludedItems] = useState<Set<number>>(new Set());
  const [values, setValues] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function buildSuggestion(data: AnalysisResult, indexes: Set<number>) {
    const selectedItems = data.items.filter((_, index) => indexes.has(index));
    const income =
      data.sourceType === "cartao"
        ? 0
        : selectedItems
            .filter((item) => item.amount > 0)
            .reduce((sum, item) => sum + item.amount, 0);
    const expenses =
      data.sourceType === "cartao"
        ? selectedItems.reduce((sum, item) => sum + Math.abs(item.amount), 0)
        : selectedItems
            .filter((item) => item.amount < 0)
            .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    return {
      rendaFixa: 0,
      rendaVariavel: Math.round(income * 100) / 100,
      gastosFixos: 0,
      gastosVariaveis: Math.round(expenses * 100) / 100,
      parcelasMensais: 0,
      valorPoupado: 0,
      valorInvestido: 0,
      dividaTotal: 0,
    };
  }

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

          const initialIncludedItems = new Set<number>(
            data.items.map((_: unknown, index: number) => index)
          );

          setResult(data);
          setIncludedItems(initialIncludedItems);
          setValues(buildSuggestion(data, initialIncludedItems));
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

  function toggleTransaction(index: number) {
    if (!result) return;

    setIncludedItems((current) => {
      const next = new Set(current);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      setValues(buildSuggestion(result, next));
      return next;
    });
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
            {includedItems.size} de {result.transactions} transacoes selecionadas
            em {result.fileName}. Revise a lista antes de salvar.
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
              <p className="mt-1 text-2xl font-black">{includedItems.size}</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-ink)]/10 bg-white/75">
            <div className="flex flex-col gap-1 border-b border-[var(--color-ink)]/10 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black text-[var(--color-ink)]">
                  Transacoes extraidas
                </p>
                <p className="text-xs leading-5 text-[var(--color-muted)]">
                  Desmarque linhas que forem total, limite, resumo ou leitura
                  errada do PDF.
                </p>
              </div>
              <p className="text-xs font-bold text-[var(--color-muted)]">
                Total selecionado:{" "}
                {currency.format(values.gastosVariaveis + values.rendaVariavel)}
              </p>
            </div>

            <div className="max-h-96 overflow-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="sticky top-0 bg-[var(--color-sand)] text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  <tr>
                    <th className="px-4 py-3">Usar</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Descricao</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item, index) => (
                    <tr
                      className="border-t border-[var(--color-ink)]/8"
                      key={`${item.line}-${index}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          checked={includedItems.has(index)}
                          onChange={() => toggleTransaction(index)}
                          type="checkbox"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {item.date || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-[var(--color-ink)]">
                          {item.description}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs text-[var(--color-muted)]">
                          {item.line}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-black">
                        {currency.format(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
