"use client";

import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginActions() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
          label="Ou receba um magic link"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@email.com"
          required
          type="email"
          value={email}
        />
        <Button className="w-full" disabled={isPending || !email} type="submit">
          Enviar link por email
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
