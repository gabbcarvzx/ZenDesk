import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function RegisterForm() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="organization">Nome da organizacao</Label>
        <Input id="organization" name="organization" placeholder="Clinica Exemplo" />
      </div>
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
          autoComplete="new-password"
          id="password"
          name="password"
          placeholder="Minimo de 8 caracteres"
          type="password"
        />
      </div>
      <Button className="w-full" type="submit">
        Criar conta
      </Button>
    </form>
  );
}
