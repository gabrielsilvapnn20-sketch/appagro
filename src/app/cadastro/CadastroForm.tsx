"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "@/app/auth/actions";

const initial: AuthState = {};

export function CadastroForm() {
  const [state, formAction, isPending] = useActionState(signup, initial);

  return (
    <>
      <h1 className="auth-title">Criar conta</h1>
      <p className="auth-sub">
        Comece agora — sua empresa é criada automaticamente.
      </p>

      <form action={formAction}>
        <label htmlFor="nome">Seu nome</label>
        <input
          className="input"
          id="nome"
          name="nome"
          type="text"
          autoComplete="name"
          placeholder="Como você se chama"
          required
        />

        <label htmlFor="org_nome">Nome da empresa</label>
        <input
          className="input"
          id="org_nome"
          name="org_nome"
          type="text"
          autoComplete="organization"
          placeholder="Ex: AgroTech Representações"
          required
        />

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
          autoComplete="new-password"
          placeholder="Mínimo de 6 caracteres"
          minLength={6}
          required
        />

        {state.error && <div className="auth-error">{state.error}</div>}
        {state.message && <div className="auth-msg">{state.message}</div>}

        <button
          className="btn btn-primary btn-block"
          type="submit"
          style={{ marginTop: 18 }}
          disabled={isPending}
        >
          {isPending ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <div className="auth-switch">
        Já tem conta? <Link href="/login">Entrar</Link>
      </div>
    </>
  );
}
