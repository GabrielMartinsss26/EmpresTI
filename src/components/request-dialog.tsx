"use client";
import { useEffect, useRef } from "react";
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
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="request-title"
      aria-describedby="request-description"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          "button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)",
        );
        const first = controls[0],
          last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.target === event.currentTarget &&
          !pending &&
          (event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom)
        )
          onClose();
      }}
      className="m-auto w-[432px] max-w-[calc(100vw-48px)] rounded-[14px] border border-border bg-surface p-6 text-foreground shadow-lg backdrop:bg-[#04060E]/70"
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
    </dialog>
  );
}
