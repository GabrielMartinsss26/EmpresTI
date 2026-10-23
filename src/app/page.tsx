import Link from "next/link";
import { Brand } from "@/components/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EmpresTI · Equipamentos em ordem. Trabalho em movimento.",
  description:
    "Conheça o EmpresTI: empréstimo de equipamentos internos, com solicitação, aprovação de Operações e acompanhamento de devoluções.",
};

const action =
  "inline-flex h-11 items-center justify-center gap-3 rounded-control border border-accent px-5 text-[13px] font-semibold text-accent-text transition-colors hover:bg-accent/12 hover:text-accent-hover";
const steps = [
  {
    number: "01",
    icon: "ph-squares-four",
    title: "Encontre o que precisa.",
    description:
      "Consulte o catálogo e veja quais equipamentos estão disponíveis para o seu trabalho.",
  },
  {
    number: "02",
    icon: "ph-hand-arrow-down",
    title: "Solicite. Aguarde a aprovação.",
    description:
      "Envie sua solicitação. A equipe de Operações aprova o empréstimo e orienta a retirada.",
  },
  {
    number: "03",
    icon: "ph-arrow-u-up-left",
    title: "Use e devolva no prazo.",
    description:
      "Acompanhe seus itens e solicite a devolução. Operações confirma o recebimento no balcão.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only z-20 bg-surface p-4 text-accent-text focus:not-sr-only focus:absolute"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-border-soft">
        <div className="mx-auto flex min-h-[88px] max-w-[1232px] flex-wrap items-center justify-between gap-5 px-6 py-5 sm:px-10">
          <Link href="/" aria-label="EmpresTI — início">
            <Brand />
          </Link>
          <nav
            aria-label="Navegação principal"
            className="flex items-center gap-6 text-xs text-muted sm:gap-8"
          >
            <a
              href="#como-funciona"
              className="hidden transition-colors hover:text-foreground sm:block"
            >
              Como funciona
            </a>
            <a
              href="#regras"
              className="hidden transition-colors hover:text-foreground sm:block"
            >
              Regras de uso
            </a>
            <Link
              href="/login"
              className="flex items-center gap-2 text-accent-text hover:text-accent-hover"
            >
              Entrar{" "}
              <i
                className="ph ph-arrow-up-right text-base"
                aria-hidden="true"
              />
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo">
        <section
          className="mx-auto grid max-w-[1232px] items-center gap-14 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-24"
          aria-labelledby="hero-title"
        >
          <div className="flex flex-col items-start gap-8">
            <div className="flex items-center gap-3 text-[11px] tracking-[0.12em] text-accent-icon uppercase">
              <span className="h-px w-7 bg-accent" />
              Equipamentos internos, em um só lugar
            </div>
            <div className="flex flex-col gap-6">
              <h1
                id="hero-title"
                className="max-w-[14ch] text-[40px] leading-[1.12] font-semibold tracking-[-0.035em] sm:text-[52px] lg:text-[56px]"
              >
                Equipamentos em ordem.
                <br />
                <span className="text-accent-icon">Trabalho em movimento.</span>
              </h1>
              <p className="max-w-[44ch] text-[15px] leading-[1.85] text-muted">
                Do equipamento que você precisa à devolução no balcão. O
                EmpresTI reúne cada etapa do empréstimo para você focar no que
                tem para fazer.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4">
              <Link href="/login" className={action}>
                Acessar sistema{" "}
                <i className="ph ph-arrow-right text-lg" aria-hidden="true" />
              </Link>
              <p className="flex items-center gap-2 text-[11px] text-dim">
                <i className="ph ph-lock-simple text-sm" aria-hidden="true" />
                Acesso interno, por convite de administrador.
              </p>
            </div>
          </div>

          <div
            className="relative flex flex-col overflow-hidden rounded-[14px] border border-border-frame bg-sunken"
            aria-label="Ilustração do processo de empréstimo"
          >
            <div className="flex items-center justify-between border-b border-border-soft px-6 py-[18px]">
              <span className="text-[11px] tracking-[0.1em] text-muted uppercase">
                Um fluxo. Do início ao fim.
              </span>
              <i
                className="ph ph-circles-three text-xl text-accent-icon"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col items-center gap-6 px-6 py-10 sm:px-8">
              <div
                className="relative flex h-[172px] w-full items-center justify-center"
                aria-hidden="true"
              >
                <div className="absolute size-[168px] rotate-45 rounded-[32px] border border-accent-border/60 bg-accent-deep/30" />
                <div className="absolute size-[126px] rotate-45 rounded-[24px] border border-accent-border bg-accent-deep/60" />
                <i className="ph ph-package relative text-[88px] text-accent-icon" />
                <span className="absolute right-[calc(50%-94px)] bottom-1 flex size-10 items-center justify-center rounded-xl border border-accent bg-sunken">
                  <i className="ph ph-check text-xl text-accent-text" />
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-[18px] font-semibold tracking-[-0.01em]">
                  Cada item, no seu lugar.
                </span>
                <p className="max-w-[30ch] text-xs leading-6 text-muted">
                  Disponibilidade para quem solicita.
                  <br />
                  Controle para quem cuida.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-border-soft bg-background/50">
              {[
                { label: "Solicitação", icon: "ph-cursor-click" },
                { label: "Aprovação", icon: "ph-check-circle" },
                { label: "Devolução", icon: "ph-arrow-u-up-left" },
              ].map(({ label, icon }, index) => (
                <div
                  key={label}
                  className={`flex flex-col items-center gap-[10px] px-2 py-5 ${index ? "border-l border-border-soft" : ""}`}
                >
                  <i
                    className={`ph ${icon} text-xl text-accent-icon`}
                    aria-hidden="true"
                  />
                  <span className="text-[11px] text-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div
          className="mx-auto h-px max-w-[1232px] bg-(image:--gradient-divider)"
          aria-hidden="true"
        />

        <section
          id="como-funciona"
          aria-labelledby="how-title"
          className="mx-auto flex max-w-[1232px] scroll-mt-8 flex-col gap-10 px-6 py-16 sm:px-10 sm:py-20"
        >
          <div className="flex flex-col gap-3">
            <p className="text-[11px] tracking-[0.12em] text-accent-icon uppercase">
              Como funciona
            </p>
            <h2
              id="how-title"
              className="text-[28px] leading-tight font-semibold tracking-[-0.02em] sm:text-[32px]"
            >
              Menos procura. Mais clareza.
            </h2>
            <p className="max-w-[58ch] text-[13px] leading-6 text-muted">
              Você acompanha o empréstimo. Operações acompanha o equipamento.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="flex flex-col items-start gap-6 rounded-xl border border-border-soft p-6"
              >
                <div className="flex w-full items-center justify-between">
                  <i
                    className={`ph ${step.icon} text-[28px] text-accent-icon`}
                    aria-hidden="true"
                  />
                  <span className="text-[11px] tracking-[0.1em] text-faint">
                    {step.number}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-[15px] font-semibold">{step.title}</h3>
                  <p className="text-[13px] leading-6 text-muted">
                    {step.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="regras"
          aria-labelledby="rules-title"
          className="border-y border-border-soft bg-sunken/50"
        >
          <div className="mx-auto grid max-w-[1232px] gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
            <div className="flex flex-col items-start gap-4">
              <p className="text-[11px] tracking-[0.12em] text-accent-icon uppercase">
                Combinados de uso
              </p>
              <h2
                id="rules-title"
                className="max-w-[19ch] text-[28px] leading-tight font-semibold tracking-[-0.02em]"
              >
                Para funcionar bem para todo mundo.
              </h2>
              <p className="max-w-[40ch] text-[13px] leading-6 text-muted">
                Regras claras ajudam a manter os equipamentos circulando e
                disponíveis para a equipe.
              </p>
            </div>
            <div className="flex flex-col gap-7">
              <dl className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <dd className="text-[40px] leading-none font-semibold tracking-[-0.03em] text-accent-text">
                    03
                  </dd>
                  <dt className="text-[13px] text-foreground">
                    itens por pessoa
                  </dt>
                  <p className="text-xs leading-5 text-muted">
                    Limite de empréstimos ativos.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <dd className="text-[40px] leading-none font-semibold tracking-[-0.03em] text-accent-text">
                    14
                  </dd>
                  <dt className="text-[13px] text-foreground">
                    dias corridos de prazo
                  </dt>
                  <p className="text-xs leading-5 text-muted">
                    Contados a partir da aprovação.
                  </p>
                </div>
              </dl>
              <div className="flex flex-col gap-3 border-t border-border-soft pt-6">
                {[
                  "Um item em atraso bloqueia novos empréstimos.",
                  "Equipamentos em manutenção não podem ser solicitados.",
                ].map((rule) => (
                  <p
                    key={rule}
                    className="flex items-start gap-3 text-xs leading-5 text-muted"
                  >
                    <i
                      className="ph ph-info pt-0.5 text-base text-accent-icon"
                      aria-hidden="true"
                    />
                    {rule}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="mx-auto flex max-w-[1232px] flex-col items-start justify-between gap-7 px-6 py-16 sm:px-10 md:flex-row md:items-center"
          aria-label="Acesso ao EmpresTI"
        >
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">
              Seu próximo passo começa aqui.
            </h2>
            <p className="text-[13px] text-muted">
              Já recebeu seu convite? Acesse com seu e-mail e senha.
            </p>
          </div>
          <Link href="/login" className={`${action} shrink-0`}>
            Acessar sistema{" "}
            <i className="ph ph-arrow-right text-lg" aria-hidden="true" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-border-soft">
        <div className="mx-auto flex max-w-[1232px] flex-wrap items-center justify-between gap-6 px-6 py-7 sm:px-10">
          <Brand />
          <p className="text-[11px] text-faint">
            Empréstimo de equipamentos internos · Operações · v1
          </p>
        </div>
      </footer>
    </div>
  );
}
