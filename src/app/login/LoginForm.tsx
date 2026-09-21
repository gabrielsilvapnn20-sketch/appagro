"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "@/app/auth/actions";

const initial: AuthState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initial);

  return (
    <>
      <h1 className="auth-title">Entrar</h1>
      <p className="auth-sub">Acesse sua conta para continuar.</p>

      <form action={formAction}>
        <label htmlFor="email">Email</label>
        <input
          className="input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@empresa.com.br"
          required
        />

        <label htmlFor="password">Senha</label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          required
        />

        {state.error && <div className="auth-error">{state.error}</div>}

        <button
          className="btn btn-primary btn-block"
          type="submit"
          style={{ marginTop: 18 }}
          disabled={isPending}
        >
          {isPending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="auth-switch">
        Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
      </div>
    </>
  );
}
