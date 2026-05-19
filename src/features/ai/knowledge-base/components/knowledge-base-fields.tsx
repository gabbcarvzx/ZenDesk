import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { KnowledgeBaseFieldError } from "@/features/ai/knowledge-base/components/knowledge-base-field-error";
import { knowledgeBaseStatusOptions } from "@/features/ai/knowledge-base/schema";

export function KnowledgeBaseFields({
  defaultValues,
  disabled,
  errors,
  idPrefix = "knowledge-base",
}: {
  defaultValues?: {
    category?: string | null;
    content?: string;
    priority?: number;
    status?: string;
    title?: string;
  };
  disabled: boolean;
  errors?: Record<string, string[] | undefined>;
  idPrefix?: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-title`}>Titulo</Label>
        <Input
          defaultValue={defaultValues?.title ?? ""}
          disabled={disabled}
          id={`${idPrefix}-title`}
          name="title"
          placeholder="Politica de entregas"
          required
        />
        <KnowledgeBaseFieldError error={errors?.title?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-category`}>Categoria</Label>
        <Input
          defaultValue={defaultValues?.category ?? ""}
          disabled={disabled}
          id={`${idPrefix}-category`}
          name="category"
          placeholder="FAQ, vendas, agenda"
        />
        <KnowledgeBaseFieldError error={errors?.category?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-priority`}>Prioridade</Label>
        <Input
          defaultValue={defaultValues?.priority ?? 3}
          disabled={disabled}
          id={`${idPrefix}-priority`}
          inputMode="numeric"
          max={10}
          min={1}
          name="priority"
          placeholder="3"
          required
          type="number"
        />
        <KnowledgeBaseFieldError error={errors?.priority?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-status`}>Status</Label>
        <Select
          defaultValue={defaultValues?.status ?? "active"}
          disabled={disabled}
          id={`${idPrefix}-status`}
          name="status"
        >
          {knowledgeBaseStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <KnowledgeBaseFieldError error={errors?.status?.[0]} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${idPrefix}-content`}>Conteudo</Label>
        <Textarea
          defaultValue={defaultValues?.content ?? ""}
          disabled={disabled}
          id={`${idPrefix}-content`}
          name="content"
          placeholder="Explique a regra como a IA deve entender e aplicar no atendimento."
          required
          rows={8}
        />
        <KnowledgeBaseFieldError error={errors?.content?.[0]} />
      </div>
    </>
  );
}
