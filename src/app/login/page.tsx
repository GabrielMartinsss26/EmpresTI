import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";
export default async function LoginPage() {
  const showcase = process.env.APP_MODE === "showcase";
  if (!showcase) {
    const { createAuthClient } = await import("@/server/auth");
    const { getActiveMembership } = await import("@/server/services/access");
    const auth = await createAuthClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (user && (await getActiveMembership(user.id))) redirect("/catalogo");
  }
  return (
    <main className="grid min-h-screen min-w-[1024px] grid-cols-[560px_1fr]">
      <section
        aria-label="Sobre o EmpresTI"
        className="flex min-h-[820px] flex-col justify-between gap-14 bg-(image:--gradient-login) p-14"
      >
        <Brand />
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-[18px]">
            <span className="text-[11px] tracking-[0.12em] text-accent-icon uppercase">
              Equipamentos internos
            </span>
            <h1 className="max-w-[20ch] text-[34px] leading-[1.15] font-semibold tracking-[-0.01em]">
              O equipamento certo.
              <br />
              Na hora de trabalhar.
            </h1>
            <p className="max-w-[38ch] text-sm leading-[1.8] text-accent-text/80">
              Consulte os equipamentos, solicite o que precisa e acompanhe seus
              empréstimos em um só lugar.
            </p>
          </div>
          <div
            className="h-px w-full bg-(image:--gradient-rule)"
            aria-hidden="true"
          />
          <dl className="flex gap-10">
            <div className="flex flex-col gap-[5px]">
              <dt className="order-2 text-xs text-muted">itens por pessoa</dt>
              <dd className="text-2xl font-semibold">3</dd>
            </div>
            <div className="flex flex-col gap-[5px]">
              <dt className="order-2 text-xs text-muted">dias de prazo</dt>
              <dd className="text-2xl font-semibold">14</dd>
            </div>
          </dl>
        </div>
        <p className="text-[11px] text-faint">Operações · v1</p>
      </section>
      <section
        aria-label="Acesso ao sistema"
        className="flex items-center justify-center p-14"
      >
        <div className="flex w-[372px] flex-col gap-8">
          <header className="flex flex-col gap-[10px]">
            <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
              Entrar
            </h2>
            <p className="text-[13px] leading-6 text-muted">
              Acesse com seu e-mail e senha para continuar.
            </p>
          </header>
          <LoginForm available={!showcase} />
          <div
            className="h-px w-full bg-(image:--gradient-divider)"
            aria-hidden="true"
          />
          <p className="text-center text-xs leading-[1.8] text-faint">
            Ainda não tem acesso ou precisa de ajuda?
            <br />
            <span className="text-muted">Fale com a equipe de Operações.</span>
          </p>
        </div>
      </section>
    </main>
  );
}
