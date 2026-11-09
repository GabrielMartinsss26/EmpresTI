import Link from "next/link";
import { Button } from "./ui/button";
export function queryErrorMessage(
  error: { message: string; data?: unknown },
  fallback = "Não foi possível carregar agora. Tente novamente.",
) {
  return error.data ? error.message : fallback;
}

export function QueryError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-4 rounded-xl border border-error/40 bg-error/5 p-4 text-[13px]"
    >
      <p className="flex-1 text-error">{message}</p>
      <Button onClick={retry}>Tentar novamente</Button>
      <Link href="/login" className="text-accent-icon">
        Ir para login
      </Link>
    </div>
  );
}
export function Loading({ label }: { label: string }) {
  return (
    <p
      role="status"
      className="rounded-xl border border-border-soft bg-sunken p-6 text-[13px] text-muted"
    >
      {label}
    </p>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-border-soft bg-sunken p-7 text-[13px] text-muted">
      {children}
    </div>
  );
}
