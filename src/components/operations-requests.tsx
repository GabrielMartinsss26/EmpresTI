"use client";
import { useEffect, useRef, useState } from "react";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { displayDate } from "@/lib/display-date";
import { WorkspaceShell } from "./workspace-shell";
import {
  Empty,
  Loading,
  QueryError,
  queryErrorMessage,
} from "./domain-feedback";
import { DecisionDialog } from "./decision-dialog";
import { Button } from "./ui/button";
type Item = RouterOutputs["requests"]["pending"]["items"][number];
export function OperationsRequests() {
  const pending = trpc.requests.pending.useInfiniteQuery(
    { limit: 12 },
    { getNextPageParam: (last) => last.nextCursor ?? undefined },
  );
  const approve = trpc.requests.approve.useMutation(),
    reject = trpc.requests.reject.useMutation();
  const [selection, setSelection] = useState<{
    mode: "approve" | "reject";
    item: Item;
  } | null>(null);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(
    null,
  );
  const message = useRef<HTMLParagraphElement>(null),
    sending = useRef(false);
  const utils = trpc.useUtils();
  const [saving, setSaving] = useState(false);
  const busy = saving || approve.isPending || reject.isPending;
  useEffect(() => {
    if (notice) message.current?.focus();
  }, [notice]);
  const items = pending.data?.pages.flatMap((page) => page.items) ?? [];
  async function confirm(reason: string) {
    if (!selection || sending.current) return;
    sending.current = true;
    setSaving(true);
    try {
      if (selection.mode === "approve") {
        const result = await approve.mutateAsync({
          requestId: selection.item.id,
        });
        setNotice({
          error: false,
          text: `Solicitação aprovada. Devolver até ${displayDate(result.loan.due_at)}.`,
        });
      } else {
        await reject.mutateAsync({ requestId: selection.item.id, reason });
        setNotice({ error: false, text: "Solicitação rejeitada." });
      }
    } catch (error) {
      setNotice({
        error: true,
        text:
          error instanceof Error
            ? queryErrorMessage(
                error,
                "Não foi possível confirmar a decisão. Atualize a lista antes de tentar novamente.",
              )
            : "Não foi possível concluir agora. Tente novamente.",
      });
    } finally {
      setSelection(null);
      await Promise.allSettled([
        utils.requests.pending.invalidate(),
        utils.catalogue.list.invalidate(),
        utils.loans.summary.invalidate(),
        utils.loans.mine.invalidate(),
        utils.requests.mine.invalidate(),
        utils.auth.me.invalidate(),
      ]);
      sending.current = false;
      setSaving(false);
    }
  }
  return (
    <WorkspaceShell active="operations">
      <div className="flex items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-[-.01em]">
            Solicitações pendentes
          </h1>
          <p className="text-[13px] text-muted">
            Confira o pedido antes de aprovar ou rejeitar.
          </p>
        </div>
        <Button
          onClick={() => void pending.refetch()}
          disabled={pending.isFetching || busy}
        >
          Atualizar lista
        </Button>
      </div>
      <p className="text-xs text-muted">
        Aprovar inicia um empréstimo de 14 dias úteis. Rejeitar exige um motivo
        e não cria empréstimo.
      </p>
      {notice && (
        <p
          ref={message}
          tabIndex={-1}
          role={notice.error ? "alert" : "status"}
          className={`rounded-control border p-4 text-[13px] ${notice.error ? "border-error/40 text-error" : "border-[#3FB98C]/35 text-[#5FD3AA]"}`}
        >
          {notice.text}
        </p>
      )}
      {pending.isPending && (
        <Loading label="Carregando solicitações pendentes…" />
      )}
      {pending.error && (
        <QueryError
          message={queryErrorMessage(pending.error)}
          retry={() => void pending.refetch()}
        />
      )}
      {!pending.isPending && !pending.error && !items.length && (
        <Empty>
          <h2 className="font-semibold text-foreground">
            Nenhuma solicitação pendente
          </h2>
          <p>Novos pedidos desta organização aparecerão aqui.</p>
        </Empty>
      )}
      {!pending.error && !!items.length && (
        <>
          <p className="text-xs text-dim">
            Solicitações {pending.hasNextPage ? "carregadas" : "pendentes"}:{" "}
            {items.length} · Horário de São Paulo
          </p>
          <div className="overflow-x-auto rounded-xl border border-border-soft">
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">
                Pedidos aguardando decisão de Operações
              </caption>
              <thead className="bg-sunken text-[11px] tracking-[.08em] text-muted uppercase">
                <tr>
                  {["Equipamento", "Solicitante", "Solicitado em", "Ações"].map(
                    (label) => (
                      <th
                        scope="col"
                        key={label}
                        className="px-4 py-3 font-normal"
                      >
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const inactive = !!(
                    item.equipment.deactivated_at ||
                    item.requester.deactivated_at ||
                    item.requester.profile.deactivated_at
                  );
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-[#161D33] bg-surface"
                    >
                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                          <span className="font-semibold">
                            {item.equipment.name}
                          </span>
                          <span className="text-xs text-dim">
                            {item.equipment.asset_tag} ·{" "}
                            {item.equipment.pickup_location}
                          </span>
                          {inactive ? (
                            <span className="text-xs text-error">
                              Cadastro desativado
                            </span>
                          ) : (
                            item.equipment.operational_status !==
                              "AVAILABLE" && (
                              <span className="text-xs text-[#E8B961]">
                                Equipamento indisponível para aprovação
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-muted">
                        {item.requester.profile.full_name}
                      </td>
                      <td className="p-4 text-xs whitespace-nowrap text-muted">
                        <time dateTime={item.requested_at.toISOString()}>
                          {displayDate(item.requested_at)}
                        </time>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {(["approve", "reject"] as const).map((mode) => (
                            <Button
                              key={mode}
                              disabled={
                                busy ||
                                inactive ||
                                (mode === "approve" &&
                                  item.equipment.operational_status !==
                                    "AVAILABLE")
                              }
                              onClick={() => {
                                setNotice(null);
                                setSelection({ mode, item });
                              }}
                            >
                              {mode === "approve" ? "Aprovar" : "Rejeitar"}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pending.hasNextPage && (
            <Button
              className="self-start"
              disabled={busy || pending.isFetchingNextPage}
              onClick={() => void pending.fetchNextPage()}
            >
              {pending.isFetchingNextPage
                ? "Carregando…"
                : "Carregar mais solicitações"}
            </Button>
          )}
        </>
      )}
      {selection && (
        <DecisionDialog
          key={`${selection.mode}-${selection.item.id}`}
          mode={selection.mode}
          name={selection.item.equipment.name}
          asset={selection.item.equipment.asset_tag}
          requester={selection.item.requester.profile.full_name}
          pending={busy}
          onClose={() => {
            if (!sending.current) setSelection(null);
          }}
          onConfirm={(reason) => void confirm(reason)}
        />
      )}
    </WorkspaceShell>
  );
}
