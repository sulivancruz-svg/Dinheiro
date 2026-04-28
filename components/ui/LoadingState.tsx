import clsx from "clsx";

type LoadingStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function LoadingState({
  title = "Carregando",
  description = "Preparando seus dados com seguranca.",
  className,
}: LoadingStateProps) {
  return (
    <main
      className={clsx(
        "min-h-screen bg-[linear-gradient(135deg,#fff8ec,#f2dcad)] px-5 py-8",
        className
      )}
    >
      <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-[var(--color-ink)]/10 bg-[var(--color-paper)]/85 p-8 text-center shadow-[0_24px_80px_rgba(35,31,26,0.10)]">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-sand)] border-t-[var(--color-clay)]" />
          <h1 className="font-display mt-6 text-4xl font-black tracking-[-0.06em] text-[var(--color-ink)]">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--color-muted)]">
            {description}
          </p>
        </div>
      </section>
    </main>
  );
}
