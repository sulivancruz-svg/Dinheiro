"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="min-h-screen bg-[#fff8ec] px-5 py-8 text-[#25211b]">
          <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
            <div className="rounded-[2rem] border border-[#a94f2a]/20 bg-white p-8 shadow-[0_24px_80px_rgba(35,31,26,0.10)]">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#a94f2a]">
                Falha critica
              </p>
              <h1 className="mt-3 text-5xl font-black leading-none tracking-[-0.06em]">
                O app encontrou um erro.
              </h1>
              <p className="mt-4 text-sm leading-6 text-[#776f61]">
                Recarregue a pagina. Se continuar, tente novamente em alguns
                minutos.
              </p>
              <div className="mt-6">
                <Button onClick={reset}>Recarregar</Button>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
