"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { FormProvider, useController, useForm } from "react-hook-form";
import { toast } from "sonner";
import { TextField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPrazoAction } from "@/lib/prazos/actions";
import {
  type CreatePrazoInput,
  createPrazoSchema,
  prazoStatusLabels,
  prazoTipoLabels,
} from "@/lib/prazos/schemas";

const defaultValues: CreatePrazoInput = {
  orgSlug: "",
  titulo: "",
  tipo: "outro",
  status: "pendente",
  dataPrazo: "",
  diasUteisPrazo: null,
  processoId: null,
  responsavelId: null,
  observacoes: "",
};

function SelectField({
  name,
  label,
  options,
  control,
}: {
  name: keyof CreatePrazoInput;
  label: string;
  options: Record<string, string>;
  control: ReturnType<typeof useForm<CreatePrazoInput>>["control"];
}) {
  const { field, fieldState } = useController({ name, control });
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Select value={String(field.value ?? "")} onValueChange={field.onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(options).map(([val, lbl]) => (
              <SelectItem key={val} value={val}>
                {lbl}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
      {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
    </FormItem>
  );
}

export function NewPrazoDialog({
  orgSlug,
  processoId,
}: {
  orgSlug: string;
  processoId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<CreatePrazoInput>({
    resolver: zodResolver(createPrazoSchema),
    defaultValues: { ...defaultValues, orgSlug, processoId: processoId ?? null },
  });

  function onSubmit(values: CreatePrazoInput) {
    startTransition(async () => {
      const result = await createPrazoAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Prazo criado");
      form.reset({ ...defaultValues, orgSlug, processoId: processoId ?? null });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <PlusIcon className="h-3.5 w-3.5" />
            Novo prazo
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar prazo</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <TextField
              name="titulo"
              control={form.control}
              label="Título *"
              inputProps={{ placeholder: "Ex: Recurso ordinário — prazo 15du" }}
            />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                name="tipo"
                label="Tipo *"
                options={prazoTipoLabels}
                control={form.control}
              />
              <SelectField
                name="status"
                label="Status"
                options={prazoStatusLabels}
                control={form.control}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                name="dataPrazo"
                control={form.control}
                label="Data final *"
                inputProps={{ type: "date" }}
              />
              <TextField
                name="diasUteisPrazo"
                control={form.control}
                label="Prazo original (du)"
                inputProps={{ type: "number", min: 1, placeholder: "Ex: 15" }}
              />
            </div>
            <TextField
              name="observacoes"
              control={form.control}
              label="Observações"
              inputProps={{ placeholder: "Notas sobre o prazo..." }}
            />
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Salvando..." : "Criar prazo"}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
