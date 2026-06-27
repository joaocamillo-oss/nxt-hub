"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { createHonorarioAction } from "@/lib/financeiro/actions";
import {
  type CreateHonorarioInput,
  createHonorarioSchema,
  honorarioTipoLabels,
} from "@/lib/financeiro/schemas";

const defaultValues: CreateHonorarioInput = {
  orgSlug: "",
  processoId: null,
  contactId: null,
  tipo: "fixo",
  valorTotal: 0,
  valorExito: null,
  percentualExito: null,
  numParcelas: 1,
  primeiroVencimento: "",
  descricao: "",
};

export function NewHonorarioDialog({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<CreateHonorarioInput>({
    resolver: zodResolver(createHonorarioSchema),
    defaultValues: { ...defaultValues, orgSlug },
  });

  const tipo = form.watch("tipo");
  const { field: tipoField, fieldState: tipoState } = useController({
    name: "tipo",
    control: form.control,
  });

  function onSubmit(values: CreateHonorarioInput) {
    startTransition(async () => {
      const result = await createHonorarioAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Honorários cadastrados");
      form.reset({ ...defaultValues, orgSlug });
      setOpen(false);
      if (result.data?.id) {
        router.push(`/app/${orgSlug}/financeiro/${result.data.id}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <PlusIcon className="h-3.5 w-3.5" />
            Novo honorário
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cadastrar honorários</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Tipo *</FormLabel>
              <FormControl>
                <Select value={tipoField.value} onValueChange={tipoField.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(honorarioTipoLabels).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              {tipoState.error && <FormMessage>{tipoState.error.message}</FormMessage>}
            </FormItem>

            <TextField
              name="valorTotal"
              control={form.control}
              label="Valor total (R$) *"
              inputProps={{ type: "number", min: 0, step: "0.01", placeholder: "0.00" }}
            />

            {(tipo === "exito" || tipo === "misto") && (
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  name="valorExito"
                  control={form.control}
                  label="Valor êxito (R$)"
                  inputProps={{ type: "number", min: 0, step: "0.01" }}
                />
                <TextField
                  name="percentualExito"
                  control={form.control}
                  label="% êxito"
                  inputProps={{ type: "number", min: 0, max: 100, step: "0.01" }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <TextField
                name="numParcelas"
                control={form.control}
                label="Nº de parcelas *"
                inputProps={{ type: "number", min: 1, max: 120 }}
              />
              <TextField
                name="primeiroVencimento"
                control={form.control}
                label="1º vencimento *"
                inputProps={{ type: "date" }}
              />
            </div>

            <TextField
              name="descricao"
              control={form.control}
              label="Descrição"
              inputProps={{ placeholder: "Referência, observações..." }}
            />

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Salvando..." : "Cadastrar honorários"}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
