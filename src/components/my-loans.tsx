"use client";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { displayDate } from "@/lib/display-date";
import { WorkspaceShell } from "./workspace-shell";
import {
  Empty,
  Loading,
  QueryError,
  queryErrorMessage,
} from "./domain-feedback";
import { Button } from "./ui/button";

export function MyLoans() {
  const loans = trpc.loans.mine.useInfiniteQuery(
    { limit: 12 },
    { getNextPageParam: (last) => last.nextCursor ?? undefined },
  );
  const requests = trpc.requests.mine.useInfiniteQuery(
    { limit: 12 },
    { getNextPageParam: (last) => last.nextCursor ?? undefined },
  );
  const active = loans.data?.pages.flatMap((page) => page.items) ?? [];
  const own = requests.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <WorkspaceShell active="loans">
      <div className="flex items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-[-.01em]">
            Meus empréstimos
          </h1>
          <p className="text-[13px] text-muted">
            Pedidos e equipamentos com você, em listas separadas.
          </p>
        </div>
        <Link
          href="/catalogo"
          className="rounded-control border border-accent px-5 py-3 text-[13px] font-semibold text-accent-text hover:bg-accent/12"
        >
          Consultar catálogo
        </Link>
      </div>
      <section aria-labelledby="active-title" className="flex flex-col gap-4">
        <h2 id="active-title" className="text-[17px] font-semibold">
          Comigo agora
        </h2>
        <p className="text-xs text-muted">
          Vencimentos no horário de São Paulo. Pedidos pendentes não entram
          nesta lista.
        </p>
        {loans.isPending && <Loading label="Carregando empréstimos…" />}
        {loans.error && (
          <QueryError
            message={queryErrorMessage(loans.error)}
            retry={() => void loans.refetch()}
          />
        )}
        {!loans.isPending && !loans.error && !active.length && (
          <Empty>
            <p>Você não tem equipamentos emprestados.</p>
          </Empty>
        )}
        {active.map((loan) => (
          <article
            key={loan.id}
            className="flex items-center justify-between gap-5 rounded-xl border border-border-soft bg-surface p-5"
          >
            <div className="flex items-center gap-4">
              <span className="flex size-11 items-center justify-center rounded-[10px] border border-border bg-sunken text-accent-icon">
                <i className="ph ph-package text-xl" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-[15px] font-semibold">
                  {loan.equipment.name}
                </h3>
                <p className="text-xs text-dim">
                  {loan.equipment.asset_tag} · {loan.equipment.pickup_location}
                </p>
                {loan.return_requested_at && (
                  <p className="text-xs text-muted">
                    Devolução aguardando confirmação
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 text-right">
              <p className="text-xs text-muted">Devolver até</p>
              <time
                dateTime={loan.due_at.toISOString()}
                className={`text-[13px] font-semibold ${loan.due_at.getTime() < loans.dataUpdatedAt ? "text-error" : "text-accent-text"}`}
              >
                {displayDate(loan.due_at)}
              </time>
              <p className="text-[11px] text-dim">
                Retirado em {displayDate(loan.checked_out_at)}
              </p>
            </div>
          </article>
        ))}
        {loans.hasNextPage && (
          <Button
            className="self-start"
            disabled={loans.isFetchingNextPage}
            onClick={() => void loans.fetchNextPage()}
          >
            {loans.isFetchingNextPage
              ? "Carregando…"
              : "Carregar mais empréstimos"}
          </Button>
        )}
      </section>
      <section
        aria-labelledby="requests-title"
        className="flex flex-col gap-4 border-t border-border-soft pt-6"
      >
        <h2 id="requests-title" className="text-[17px] font-semibold">
          Minhas solicitações
        </h2>
        <p className="text-xs text-muted">
          O prazo começa somente quando Operações aprova o pedido.
        </p>
        {requests.isPending && <Loading label="Carregando solicitações…" />}
        {requests.error && (
          <QueryError
            message={queryErrorMessage(requests.error)}
            retry={() => void requests.refetch()}
          />
        )}
        {!requests.isPending && !requests.error && !own.length && (
          <Empty>
            <p>Você ainda não fez solicitações.</p>
            <Link href="/catalogo" className="text-accent-icon">
              Ver equipamentos disponíveis
            </Link>
          </Empty>
        )}
        {own.map((request) => (
          <article
            key={request.id}
            className="flex flex-col gap-3 rounded-xl border border-border-soft bg-sunken p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-[15px] font-semibold">
                  {request.equipment.name}
                </h3>
                <p className="text-xs text-dim">
                  {request.equipment.asset_tag} · Solicitado em{" "}
                  {displayDate(request.requested_at)}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${request.status === "REJECTED" ? "border-error/40 text-error" : "border-accent-border text-accent-text"}`}
              >
                {request.status === "PENDING"
                  ? "Em análise"
                  : request.status === "APPROVED"
                    ? "Aprovada"
                    : "Rejeitada"}
              </span>
            </div>
            {request.status === "PENDING" && (
              <p className="text-xs text-muted">
                Aguardando aprovação. Ainda não há vencimento.
              </p>
            )}
            {request.decided_at && (
              <p className="text-xs text-muted">
                Decisão em {displayDate(request.decided_at)}
              </p>
            )}
            {request.rejection_reason && (
              <p className="text-[13px] text-muted">
                Motivo: {request.rejection_reason}
              </p>
            )}
          </article>
        ))}
        {requests.hasNextPage && (
          <Button
            className="self-start"
            disabled={requests.isFetchingNextPage}
            onClick={() => void requests.fetchNextPage()}
          >
            {requests.isFetchingNextPage
              ? "Carregando…"
              : "Carregar mais solicitações"}
          </Button>
        )}
      </section>
    </WorkspaceShell>
  );
}
