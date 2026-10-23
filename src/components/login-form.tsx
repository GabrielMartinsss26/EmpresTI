"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginInput } from "@/lib/auth-input";
import { trpc, type RouterInputs } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function LoginForm({ available = true }: { available?: boolean }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RouterInputs["auth"]["login"]>({
    resolver: zodResolver(loginInput),
  });
  const login = trpc.auth.login.useMutation({
    onSuccess: ({ destination }) => {
      window.location.assign(destination);
    },
  });
  return (
    <form
      noValidate
      onSubmit={handleSubmit((data) => {
        if (available) login.mutate(data);
      })}
      className="flex w-full flex-col gap-7"
    >
      <fieldset
        disabled={login.isPending || !available}
        className="flex min-w-0 flex-col gap-[18px] border-0 p-0"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-xs text-dim">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="voce@empresa.com.br"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-xs text-dim">
            Senha
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p id="password-error" className="text-xs text-error" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>
      </fieldset>
      {login.error && (
        <p role="alert" className="text-[13px] leading-5 text-error">
          {login.error.message}
        </p>
      )}
      <Button
        type="submit"
        className="w-full justify-between"
        disabled={login.isPending || !available}
        aria-busy={login.isPending}
      >
        <span>{login.isPending ? "Entrando…" : "Entrar"}</span>
        <i className="ph ph-arrow-right text-lg" aria-hidden="true" />
      </Button>
      {!available && (
        <p className="text-center text-xs leading-5 text-muted" role="status">
          Demonstração da interface. O login será habilitado em breve.
        </p>
      )}
    </form>
  );
}
