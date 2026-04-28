"use client";

import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginActions() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const showTestLogin =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_TEST_LOGIN === "true";

  function handleProvider(provider: "google" | "github") {
    startTransition(() => {
      void signIn(provider, { callbackUrl: "/onboarding" });
    });
  }

  function handleEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(() => {
      void signIn("email", {
        email,
        callbackUrl: "/onboarding",
        redirect: false,
      }).then((result) => {
        if (result?.error) {
          setMessage("Nao foi possivel enviar o link. Confira a configuracao de email.");
          return;
        }

        setMessage("Se o email estiver configurado, o link de acesso foi enviado.");
      });
    });
  }

  return (
    <div className="space-y-4">
      {showTestLogin ? (
        <div className="rounded-3xl border border-[var(--color-clay)]/20 bg-[var(--color-gold)]/10 p-4">
          <p className="text-sm font-bold text-[var(--color-ink)]">
            Modo de teste local
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
            Informe seu email abaixo e entre sem OAuth para preencher seus dados
            reais no onboarding.
          </p>
          <Button
            className="mt-3 w-full"
            disabled={isPending}
            onClick={() => {
              startTransition(() => {
                void signIn("test-login", {
                  email: email || undefined,
                  callbackUrl: "/onboarding",
                });
              });
            }}
            variant="secondary"
          >
            Entrar com meu email em modo teste
          </Button>
        </div>
      ) : null}

      <Button
        className="w-full"
        disabled={isPending}
        onClick={() => handleProvider("google")}
      >
        Entrar com Google
      </Button>
      <Button
        className="w-full"
        disabled={isPending}
        onClick={() => handleProvider("github")}
        variant="secondary"
      >
        Entrar com GitHub
      </Button>

      <form className="space-y-3 pt-3" onSubmit={handleEmail}>
        <Input
          label="Email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@email.com"
          required
          type="email"
          value={email}
        />
        <Button className="w-full" disabled={isPending || !email} type="submit">
          Enviar magic link por email
        </Button>
      </form>

      {message ? (
        <p className="rounded-2xl bg-[var(--color-sand)]/55 px-4 py-3 text-sm leading-6 text-[var(--color-ink)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
