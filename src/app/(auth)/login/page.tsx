import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Entrar na conta"
      description="Acesse sua organizacao para acompanhar conversas, contatos e uso da IA."
      footer={
        <span>
          Ainda nao tem conta?{" "}
          <Link className="font-semibold text-primary" href="/register">
            Criar conta
          </Link>
        </span>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
