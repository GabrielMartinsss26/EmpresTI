/* eslint-disable @next/next/no-img-element -- WebP D03 já normalizado; img nativo evita estilos inline incompatíveis com a CSP. */
import type { RouterOutputs } from "@/lib/trpc";
import { useState } from "react";
import { equipmentImageUrl } from "@/lib/public-config";
import { Button } from "./ui/button";
type Item = RouterOutputs["catalogue"]["list"]["items"][number];
export const availabilityLabel = {
  AVAILABLE: "Disponível",
  MAINTENANCE: "Manutenção",
  OUT_OF_SERVICE: "Fora de uso",
  PENDING: "Pedido pendente",
  LOANED: "Emprestado",
};
export function CatalogueCard({
  item,
  imageBase,
  disabled,
  onSelect,
}: {
  item: Item;
  imageBase: string;
  disabled: boolean;
  onSelect: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const src = item.image
    ? equipmentImageUrl(
        imageBase,
        item.image.storage_bucket,
        item.image.object_path,
      )
    : null;
  return (
    <article
      aria-label={`${item.asset_tag} — ${item.name}`}
      className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#1F2949] bg-surface transition-colors hover:border-accent/60"
    >
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-border-soft bg-sunken">
        {src && !failed ? (
          <img
            src={src}
            alt={item.name}
            width={800}
            height={600}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
            onError={() => {
              setFailed(true);
            }}
          />
        ) : (
          <span className="flex flex-col items-center gap-3 text-xs text-muted">
            <i
              className="ph ph-package text-4xl text-accent-icon"
              aria-hidden="true"
            />
            Imagem indisponível
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-[18px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] tracking-[.06em] text-dim">
            {item.asset_tag}
          </span>
          <span
            className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${item.availability === "AVAILABLE" ? "border-[#3FB98C]/35 bg-[#3FB98C]/12 text-[#5FD3AA]" : item.availability === "MAINTENANCE" ? "border-[#E0A33F]/35 bg-[#E0A33F]/12 text-[#E8B961]" : "border-border bg-sunken text-muted"}`}
          >
            {availabilityLabel[item.availability]}
          </span>
        </div>
        <h2 className="text-[15px] font-semibold">{item.name}</h2>
        <p className="text-xs text-dim">{item.category.name}</p>
        <p className="text-xs text-muted">Retirada: {item.pickup_location}</p>
        {item.image && (
          <a
            href={item.image.source_page_url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-accent-icon hover:text-accent-text"
          >
            Foto: {item.image.source_author} · Pixabay
          </a>
        )}
        <div className="flex flex-1 items-end pt-2">
          <Button
            className="w-full"
            disabled={disabled || item.availability !== "AVAILABLE"}
            onClick={onSelect}
          >
            {item.availability === "AVAILABLE"
              ? "Solicitar"
              : availabilityLabel[item.availability]}
          </Button>
        </div>
      </div>
    </article>
  );
}
