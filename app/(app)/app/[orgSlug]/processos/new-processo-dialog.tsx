"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
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
import { createProcessoAction } from "@/lib/processos/actions";
import {
  type CreateProcessoInput,
  createProcessoSchema,
  processoFaseLabels,
  processoStatusLabels,
  processoTipoLabels,
} from "@/lib/processos/schemas";
import { useController } from "react-hook-form";

function SelectField({
  name,
  label,
  options,
  control,
}: {
  name: keyof CreateProcessoInput;
  label: string;
  options: Record<string, string>;
  control: ReturnType<typeof useForm<CreateProcessoInput>>["control"];
}) {
  const { field, fieldState } = useController({ name, control });
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Select
          value={String(field.value ?? "")}
          onValueChange={field.onChange}
        >
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

const defaultValues: CreateProcessoInput = {
  orgSlug: "",
  numeroCnj: "",
  tribunal: "",
  vara: "",
  comarca: "",
  tipo: "civel",
  fase: "conhecimento",
  status: "ativo",
  poloAtivo: "",
  poloPassivo: "",
  valorCausa: null,
  dataDistribuicao: null,
  contactId: null,
  responsavelId: null,
  observacoes: "",
};

export function NewProcessoDialog({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<CreateProcessoInput>({
    resolver: zodResolver(createProcessoSchema),
    defaultValues: { ...defaultValues, orgSlug },
  });

  function onSubmit(values: CreateProcessoInput) {
    startTransition(async () => {
      const result = await createProcessoAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Processo cadastrado");
      form.reset({ ...defaultValues, orgSlug });
      setOpen(false);
      if (result.data?.id) {
        router.push(`/app/${orgSlug}/processos/${result.data.id}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <PlusIcon className="h-3.5 w-3.5" />
            Novo processo
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cadastrar processo</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <TextField
              name="numeroCnj"
              control={form.control}
              label="Número CNJ *"
              inputProps={{ placeholder: "0000000-00.0000.0.00.0000" }}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                name="tribunal"
                control={form.control}
                label="Tribunal *"
                inputProps={{ placeholder: "Ex: TJSP, TRT2, STJ" }}
              />
              <TextField
                name="vara"
                control={form.control}
                label="Vara"
                inputProps={{ placeholder: "Ex: 3ª Vara Cível" }}
              />
            </div>
            <TextField
              name="comarca"
              control={form.control}
              label="Comarca"
              inputProps={{ placeholder: "Ex: São Paulo" }}
            />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                name="tipo"
                label="Tipo *"
                options={processoTipoLabels}
                control={form.control}
              />
              <SelectField
                name="fase"
                label="Fase *"
                options={processoFaseLabels}
                control={form.control}
              />
            </div>
            <SelectField
              name="status"
              label="Status *"
              options={processoStatusLabels}
              control={form.control}
            />
            <TextField
              name="poloAtivo"
              control={form.control}
              label="Polo ativo *"
              inputProps={{ placeholder: "Nome do requerente/autor" }}
            />
            <TextField
              name="poloPassivo"
              control={form.control}
              label="Polo passivo *"
              inputProps={{ placeholder: "Nome do requerido/réu" }}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                name="valorCausa"
                control={form.control}
                label="Valor da causa (R$)"
                inputProps={{ type: "number", placeholder: "0.00" }}
              />
              <TextField
                name="dataDistribuicao"
                control={form.control}
                label="Data distribuição"
                inputProps={{ type: "date" }}
              />
            </div>
            <TextField
              name="observacoes"
              control={form.control}
              label="Observações"
              inputProps={{ placeholder: "Notas internas sobre o processo..." }}
            />
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Cadastrando..." : "Cadastrar processo"}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
