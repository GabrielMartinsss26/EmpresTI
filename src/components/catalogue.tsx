"use client";
import { useRef, useState } from "react";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { WorkspaceShell } from "./workspace-shell";
import { CatalogueCard } from "./catalogue-card";
import { RequestDialog } from "./request-dialog";
import {
  Empty,
  Loading,
  QueryError,
  queryErrorMessage,
} from "./domain-feedback";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Item = RouterOutputs["catalogue"]["list"]["items"][number];
export function Catalogue({ imageBase }: { imageBase: string }) {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategory] = useState("");
  const [onlyAvailable, setAvailable] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(
    null,
  );
  const submitting = useRef(false);
  const utils = trpc.useUtils();
  const catalogue = trpc.catalogue.list.useInfiniteQuery(
    {
      limit: 12,
      search: search || undefined,
      categoryId: categoryId || undefined,
      onlyAvailable,
    },
    { getNextPageParam: (last) => last.nextCursor ?? undefined },
  );
  const categories = trpc.catalogue.categories.useQuery();
  const summary = trpc.loans.summary.useQuery();
  const request = trpc.requests.create.useMutation();
  const items = catalogue.data?.pages.flatMap((page) => page.items) ?? [];
  const blocked = !summary.data
    ? "Aguarde o resumo dos seus empréstimos para solicitar."
    : summary.data.activeCount >= summary.data.maxActive
      ? "Você já está com 3 equipamentos. Aguarde uma devolução para solicitar outro."
      : summary.data.hasOverdue
        ? "Você tem equipamento em atraso. Regularize a devolução antes de solicitar outro."
        : null;
  const refresh = () =>
    Promise.allSettled([
      utils.catalogue.list.invalidate(),
      utils.loans.summary.invalidate(),
      utils.requests.mine.invalidate(),
      utils.loans.mine.invalidate(),
    ]);
  async function confirm() {
    if (!selected || submitting.current || blocked || summary.error) return;
    submitting.current = true;
    try {
      await request.mutateAsync({ equipmentId: selected.id });
      setSelected(null);
      setNotice({
        error: false,
        text: "Solicitação enviada. Aguarde a aprovação de Operações.",
      });
      await refresh();
    } catch (error) {
      const text =
        error instanceof Error
          ? queryErrorMessage(
              error,
              "Não foi possível confirmar o envio. Atualize a lista e tente novamente.",
            )
          : "Não foi possível concluir agora. Tente novamente.";
      setNotice({ error: true, text });
      setSelected(null);
      await refresh();
    } finally {
      submitting.current = false;
    }
  }
  return (
    <WorkspaceShell active="catalogue">
      <div className="flex items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-[-.01em]">Catálogo</h1>
          <p className="text-[13px] text-muted">
            Consulte os equipamentos e solicite o que precisa.
          </p>
        </div>
        <span className="text-xs text-dim">Retirada com Operações</span>
      </div>
      <div className="flex items-start gap-3 rounded-[10px] border border-accent-border bg-surface p-4">
        <i className="ph ph-info text-lg text-accent-icon" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold">
            Até 3 equipamentos · 14 dias úteis após aprovação
          </p>
          <p className="text-xs leading-5 text-muted">
            Solicitar cria um pedido pendente. Operações confirma a retirada e o
            empréstimo.
          </p>
        </div>
      </div>
      {summary.error && (
        <QueryError
          message={queryErrorMessage(summary.error)}
          retry={() => void summary.refetch()}
        />
      )}
      {blocked && summary.data && (
        <p role="status" className="text-[13px] text-[#E8B961]">
          {blocked}
        </p>
      )}
      {notice && (
        <p
          role={notice.error ? "alert" : "status"}
          className={`rounded-control border p-4 text-[13px] ${notice.error ? "border-error/40 text-error" : "border-[#3FB98C]/35 text-[#5FD3AA]"}`}
        >
          {notice.text}
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(draft.trim());
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="flex min-w-[240px] flex-1 flex-col gap-2 text-xs text-muted">
          Buscar equipamento
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={80}
            placeholder="Nome ou patrimônio"
          />
        </label>
        <Button type="submit">
          <i className="ph ph-magnifying-glass" aria-hidden="true" />
          Buscar
        </Button>
        <label className="flex flex-col gap-2 text-xs text-muted">
          Categoria
          <select
            value={categoryId}
            onChange={(event) => setCategory(event.target.value)}
            disabled={categories.isPending || !!categories.error}
            className="h-11 min-w-[180px] rounded-control border border-border bg-sunken px-3 text-[13px] text-foreground"
          >
            <option value="">Todas as categorias</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex h-11 items-center gap-2 text-[13px] text-muted">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(event) => setAvailable(event.target.checked)}
            className="size-4 accent-accent"
          />
          Somente disponíveis
        </label>
      </form>
      {categories.error && (
        <QueryError
          message={queryErrorMessage(categories.error)}
          retry={() => void categories.refetch()}
        />
      )}
      {catalogue.isPending && <Loading label="Carregando equipamentos…" />}
      {catalogue.error && (
        <QueryError
          message={queryErrorMessage(catalogue.error)}
          retry={() => void catalogue.refetch()}
        />
      )}
      {!catalogue.isPending && !catalogue.error && !items.length && (
        <Empty>
          <h2 className="font-semibold text-foreground">
            Nenhum equipamento encontrado
          </h2>
          <p>Altere a busca ou os filtros para consultar outros itens.</p>
        </Empty>
      )}
      <div aria-label="Equipamentos" className="grid grid-cols-3 gap-5">
        {items.map((item) => (
          <CatalogueCard
            key={item.id}
            item={item}
            imageBase={imageBase}
            disabled={!!blocked || !!summary.error || request.isPending}
            onSelect={() => {
              request.reset();
              setNotice(null);
              setSelected(item);
            }}
          />
        ))}
      </div>
      {catalogue.hasNextPage && (
        <Button
          className="self-center"
          disabled={catalogue.isFetchingNextPage}
          onClick={() => void catalogue.fetchNextPage()}
        >
          {catalogue.isFetchingNextPage
            ? "Carregando…"
            : "Carregar mais equipamentos"}
        </Button>
      )}
      {selected && (
        <RequestDialog
          name={selected.name}
          pickup={selected.pickup_location}
          pending={request.isPending}
          error={blocked ?? undefined}
          canConfirm={!blocked && !summary.error}
          onClose={() => {
            if (!submitting.current) setSelected(null);
          }}
          onConfirm={() => void confirm()}
        />
      )}
    </WorkspaceShell>
  );
}
