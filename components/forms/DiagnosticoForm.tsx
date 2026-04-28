"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type FieldName =
  | "rendaFixa"
  | "rendaVariavel"
  | "gastosFixos"
  | "gastosVariaveis"
  | "parcelasMensais"
  | "valorPoupado"
  | "valorInvestido"
  | "dividaTotal";

const fields: Array<{
  name: FieldName;
  label: string;
  hint: string;
}> = [
  {
    name: "rendaFixa",
    label: "Renda fixa mensal",
    hint: "Salario, pro-labore ou renda recorrente.",
  },
  {
    name: "rendaVariavel",
    label: "Renda variavel mensal",
    hint: "Comissoes, freelas e extras em media.",
  },
  {
    name: "gastosFixos",
    label: "Gastos fixos",
    hint: "Aluguel, contas, escola, planos e assinaturas.",
  },
  {
    name: "gastosVariaveis",
    label: "Gastos variaveis",
    hint: "Mercado, lazer, transporte e compras do mes.",
  },
  {
    name: "parcelasMensais",
    label: "Parcelas mensais de dividas",
    hint: "Cartao parcelado, emprestimos, financiamentos.",
  },
  {
    name: "dividaTotal",
    label: "Divida total",
    hint: "Soma aproximada do que ainda falta pagar.",
  },
  {
    name: "valorPoupado",
    label: "Valor poupado",
    hint: "Reserva em conta, poupanca ou caixa.",
  },
  {
    name: "valorInvestido",
    label: "Valor investido",
    hint: "Tesouro, CDB, fundos, acoes ou previdencia.",
  },
];

const initialValues: Record<FieldName, string> = {
  rendaFixa: "",
  rendaVariavel: "",
  gastosFixos: "",
  gastosVariaveis: "",
  parcelasMensais: "",
  valorPoupado: "",
  valorInvestido: "",
  dividaTotal: "",
};

export function DiagnosticoForm() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateValue(name: FieldName, value: string) {
    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, Number(value || 0)])
    );

    startTransition(() => {
      void fetch("/api/diagnostico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then(async (response) => {
          const data = await response.json();

          if (!response.ok) {
            if (response.status === 401) {
              router.push("/login");
              return;
            }

            const details = Array.isArray(data.details)
              ? data.details.map((item: { message: string }) => item.message).join(" ")
              : data.error;

            throw new Error(details || "Nao foi possivel salvar o diagnostico.");
          }

          router.push(`/dashboard?diagnostico=${data.id}`);
          router.refresh();
        })
        .catch((requestError: unknown) => {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Nao foi possivel salvar o diagnostico."
          );
        });
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <Input
            hint={field.hint}
            inputMode="decimal"
            key={field.name}
            label={field.label}
            min="0"
            name={field.name}
            onChange={(event) => updateValue(field.name, event.target.value)}
            placeholder="0"
            required
            step="0.01"
            type="number"
            value={values[field.name]}
          />
        ))}
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-900/20 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button disabled={isPending} type="submit">
          {isPending ? "Calculando..." : "Gerar meu diagnostico"}
        </Button>
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          Use valores aproximados. O objetivo e clareza, nao perfeicao contábil.
        </p>
      </div>
    </form>
  );
}
