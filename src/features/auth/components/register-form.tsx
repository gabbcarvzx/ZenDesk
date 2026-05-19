"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { registerAction, type AuthActionState } from "@/features/auth/actions";

const initialState: AuthActionState = {
  message: null,
  status: "idle",
};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="organization">Nome da organização</Label>
        <Input id="organization" name="organization" placeholder="Clinica Exemplo" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          autoComplete="email"
          id="email"
          name="email"
          placeholder="voce@empresa.com"
          required
          type="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          autoComplete="new-password"
          id="password"
          name="password"
          placeholder="Minimo de 8 caracteres"
          required
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
        {isPending ? "Criando..." : "Criar conta"}
      </Button>
    </form>
  );
}
