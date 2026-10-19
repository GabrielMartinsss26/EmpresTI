"use client";
import { trpc } from "@/lib/trpc";
import { Brand } from "./brand";
import { Button } from "./ui/button";

export function Catalogue() {
  const me = trpc.auth.me.useQuery();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: ({ destination }) => window.location.assign(destination),
  });
  return (
    <main className="grid min-h-screen min-w-[1024px] grid-cols-[236px_1fr]">
      <aside className="flex flex-col justify-between gap-7 border-r border-border-soft bg-sunken/40 px-[22px] py-7">
        <div className="flex flex-col gap-10">
          <Brand />
          <div className="flex items-center gap-[10px] rounded-control border-l-2 border-accent bg-surface px-[10px] py-[9px] text-[13px]">
            <i
              className="ph ph-squares-four text-accent-icon"
              aria-hidden="true"
            />
            Catálogo
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-xs text-muted">
            {me.data?.name ?? "Carregando perfil…"}
          </span>
          <Button onClick={() => logout.mutate()} disabled={logout.isPending}>
            Sair
          </Button>
          {logout.error && (
            <p role="alert" className="text-xs text-error">
              Não foi possível sair. Tente novamente.
            </p>
          )}
        </div>
      </aside>
      <section className="flex flex-col">
        <header className="flex h-16 items-center border-b border-border-soft px-7 text-[13px] text-muted">
          Equipamentos internos
        </header>
        <div className="flex flex-col gap-7 px-7 py-8">
          <h1 className="text-2xl font-semibold tracking-[-0.01em]">
            Catálogo
          </h1>
          <div className="flex flex-col items-start gap-4 rounded-xl border border-border-soft bg-sunken p-8">
            <i
              className="ph ph-package text-[32px] text-accent-icon"
              aria-hidden="true"
            />
            <h2 className="text-[15px] font-semibold">
              Seu acesso está pronto.
            </h2>
            <p className="max-w-[56ch] text-[13px] leading-6 text-muted">
              A tela de catálogo será disponibilizada na próxima etapa. Os
              equipamentos e as solicitações aparecerão aqui quando esse fluxo
              estiver implementado.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
