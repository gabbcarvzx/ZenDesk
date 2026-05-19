import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Criar organizacao"
      description="Configure o primeiro acesso para iniciar o onboarding do seu negocio."
      footer={
        <span>
          Ja possui conta?{" "}
          <Link className="font-semibold text-primary" href="/login">
            Entrar
          </Link>
        </span>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
