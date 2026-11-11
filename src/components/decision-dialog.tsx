"use client";
import { useRef, useState } from "react";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
export function DecisionDialog({
  mode,
  name,
  asset,
  requester,
  pending,
  onClose,
  onConfirm,
}: {
  mode: "approve" | "reject";
  name: string;
  asset: string;
  requester: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [invalid, setInvalid] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const rejecting = mode === "reject";
  return (
    <Modal
      titleId="decision-title"
      descriptionId="decision-description"
      pending={pending}
      onClose={onClose}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (rejecting && (!reason.trim() || reason.trim().length > 500)) {
            setInvalid(true);
            textarea.current?.focus();
            return;
          }
          onConfirm(reason.trim());
        }}
        className="flex flex-col gap-[18px]"
      >
        <h2 id="decision-title" className="text-[19px] font-semibold">
          {rejecting ? "Rejeitar solicitação" : "Aprovar solicitação"}
        </h2>
        <p
          id="decision-description"
          className="text-[13px] leading-6 text-muted"
        >
          {requester} solicitou {name} ({asset}).
        </p>
        {rejecting ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="rejection-reason" className="text-xs text-muted">
              Motivo da rejeição
            </label>
            <textarea
              ref={textarea}
              id="rejection-reason"
              rows={4}
              required
              maxLength={500}
              disabled={pending}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setInvalid(false);
              }}
              aria-invalid={invalid}
              aria-describedby={
                invalid ? "reason-error reason-count" : "reason-count"
              }
              className="resize-y rounded-control border border-border bg-sunken p-3 text-[13px]"
            />
            <p id="reason-count" className="text-[11px] text-dim">
              {reason.length}/500 caracteres
            </p>
            {invalid && (
              <p
                id="reason-error"
                role="alert"
                className="text-[13px] text-error"
              >
                Informe o motivo da rejeição.
              </p>
            )}
            <p className="text-xs leading-5 text-muted">
              A rejeição encerra este pedido e não cria um empréstimo.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-[9px] border border-border-soft bg-sunken p-[14px] text-[13px] leading-6 text-muted">
            <p>A aprovação inicia o empréstimo e o prazo de 14 dias úteis.</p>
            <p>
              O limite de 3 equipamentos, atrasos e disponibilidade serão
              conferidos novamente.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-[10px]">
          <Button type="button" disabled={pending} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending
              ? "Registrando…"
              : rejecting
                ? "Confirmar rejeição"
                : "Confirmar aprovação"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
