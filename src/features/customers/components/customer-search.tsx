import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function CustomerSearch({ search }: { search: string }) {
  return (
    <form className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm md:grid-cols-[1fr_auto] md:items-end">
      <div className="space-y-2">
        <Label htmlFor="customer-search">Buscar cliente</Label>
        <Input
          defaultValue={search}
          id="customer-search"
          name="q"
          placeholder="Nome, telefone ou email"
        />
      </div>
      <Button className="gap-2" type="submit">
        <Search aria-hidden="true" className="size-4" />
        Buscar
      </Button>
    </form>
  );
}
