"use client";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { QueryError, queryErrorMessage } from "./domain-feedback";

export function WorkspaceShell({
  active,
  children,
}: {
  active: "catalogue" | "loans" | "operations";
  children: React.ReactNode;
}) {
  const me = trpc.auth.me.useQuery();
  const summary = trpc.loans.summary.useQuery();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: ({ destination }) => window.location.assign(destination),
  });
  return (
    <div className="grid min-h-screen min-w-[1024px] grid-cols-[236px_minmax(0,1fr)]">
      <aside className="sticky top-0 flex h-screen flex-col justify-between gap-7 border-r border-border-soft bg-[#060A16] px-[22px] py-7">
        <div className="flex flex-col gap-10">
          <Link href="/catalogo" aria-label="EmpresTI — catálogo">
            <Brand />
          </Link>
          <nav aria-label="Navegação principal" className="flex flex-col gap-2">
            <p className="px-[10px] pb-2 text-[10px] tracking-[.12em] text-faint uppercase">
              Colaborador
            </p>
            {[
              {
                href: "/catalogo",
                label: "Catálogo",
                icon: "ph-squares-four",
                key: "catalogue",
              },
              {
                href: "/meus-emprestimos",
                label: "Meus empréstimos",
                icon: "ph-hand-arrow-down",
                key: "loans",
              },
            ].map((item) => (
              <Link
                key={item.key}
                href={item.href}
                aria-label={item.label}
                aria-current={active === item.key ? "page" : undefined}
                className={`flex items-center gap-2 rounded-control border-l-2 px-[9px] py-[10px] text-[13px] transition-colors hover:bg-sunken ${active === item.key ? "border-accent bg-surface text-foreground" : "border-transparent text-muted"}`}
              >
                <i
                  aria-hidden="true"
                  className={`ph ${item.icon} shrink-0 text-base text-accent-icon`}
                />
                <span className="flex-1 whitespace-nowrap">{item.label}</span>
                {item.key === "loans" && summary.data && (
                  <span className="shrink-0 rounded-full bg-accent-deep px-[5px] text-[11px] text-accent-text">
                    {summary.data.activeCount}
                  </span>
                )}
              </Link>
            ))}
            {!me.error &&
              (me.data?.role === "OPERATIONS" || me.data?.role === "ADMIN") && (
                <>
                  <p className="px-[10px] pt-5 pb-2 text-[10px] tracking-[.12em] text-faint uppercase">
                    Operações
                  </p>
                  <Link
                    href="/operacoes/solicitacoes"
                    aria-current={active === "operations" ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-control border-l-2 px-[9px] py-[10px] text-[13px] transition-colors hover:bg-sunken ${active === "operations" ? "border-accent bg-surface text-foreground" : "border-transparent text-muted"}`}
                  >
                    <i
                      className="ph ph-list-checks text-base text-accent-icon"
                      aria-hidden="true"
                    />
                    Solicitações
                  </Link>
                </>
              )}
          </nav>
        </div>
        <div className="flex flex-col gap-4">
          <p className="truncate text-xs text-muted">
            {me.data?.name ??
              (me.isPending ? "Carregando perfil…" : "Perfil indisponível")}
          </p>
          <Button onClick={() => logout.mutate()} disabled={logout.isPending}>
            {logout.isPending ? "Saindo…" : "Sair"}
          </Button>
          {logout.error && (
            <p role="alert" className="text-xs text-error">
              Não foi possível sair. Tente novamente.
            </p>
          )}
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex min-h-16 items-center justify-between gap-5 border-b border-border-soft px-7 text-[13px]">
          <span className="text-muted">Equipamentos internos</span>
          <div className="flex items-center gap-4">
            {summary.data ? (
              <>
                <span>
                  {summary.data.activeCount} de {summary.data.maxActive} itens
                  com você
                </span>
                <div
                  aria-label="Limite de três equipamentos"
                  className="flex w-[90px] gap-[5px]"
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`h-[5px] flex-1 rounded-full ${i < summary.data.activeCount ? "bg-accent" : "bg-border-frame"}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <span className="text-muted">
                {summary.isPending
                  ? "Carregando seus itens…"
                  : "Resumo indisponível"}
              </span>
            )}
          </div>
        </header>
        <main className="flex flex-col gap-6 p-7">
          {me.error && (
            <QueryError
              message={queryErrorMessage(me.error)}
              retry={() => void me.refetch()}
            />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
