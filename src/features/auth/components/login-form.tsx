import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function LoginForm() {
  return (
    <form className="space-y-4">
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
      <Button className="w-full" type="submit">
        Entrar
      </Button>
    </form>
  );
}
