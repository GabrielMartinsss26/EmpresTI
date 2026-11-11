"use client";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
export function RequestDialog({
  name,
  pickup,
  pending,
  error,
  canConfirm,
  onClose,
  onConfirm,
}: {
  name: string;
  pickup: string;
  pending: boolean;
  error?: string;
  canConfirm: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      titleId="request-title"
      descriptionId="request-description"
      pending={pending}
      onClose={onClose}
    >
      <form
        className="flex flex-col gap-[18px]"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <h2 id="request-title" className="text-[19px] font-semibold">
          Solicitar equipamento
        </h2>
        <p
          id="request-description"
          className="text-[13px] leading-6 text-muted"
        >
          Solicitar {name}? A equipe de Operações precisa aprovar o pedido.
        </p>
        <div className="flex flex-col gap-3 rounded-[9px] border border-border-soft bg-sunken p-[14px] text-[13px] text-muted">
          <p>Retirada: {pickup}</p>
          <p>O prazo de 14 dias úteis começa após a aprovação.</p>
          <p>
            Limite: 3 equipamentos ativos. O pedido pendente não ocupa esse
            limite.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-[13px] text-error">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-[10px]">
          <Button type="button" disabled={pending} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending || !canConfirm}>
            {pending ? "Enviando…" : "Confirmar solicitação"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
