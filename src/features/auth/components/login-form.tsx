"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { loginAction, type AuthActionState } from "@/features/auth/actions";

const initialState: AuthActionState = {
  message: null,
  status: "idle",
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          autoComplete="email"
          id="email"
          name="email"
          placeholder="voce@empresa.com"
          type="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          autoComplete="current-password"
          id="password"
          name="password"
          placeholder="Sua senha"
          type="password"
        />
      </div>
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm leading-6 text-danger"
              : "text-sm leading-6 text-primary"
          }
        >
          {state.message}
        </p>
      ) : null}
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
