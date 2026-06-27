"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { FormProvider, useController, useForm } from "react-hook-form";
import { toast } from "sonner";
import { TextField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createMovimentacaoAction } from "@/lib/processos/actions";
import {
  type CreateMovimentacaoInput,
  createMovimentacaoSchema,
} from "@/lib/processos/schemas";

const tipoOptions = [
  { value: "andamento", label: "Andamento" },
  { value: "intimacao", label: "Intimação" },
  { value: "despacho", label: "Despacho" },
  { value: "sentenca", label: "Sentença" },
  { value: "acordao", label: "Acórdão" },
  { value: "peticao", label: "Petição" },
];

export function NewMovimentacaoDialog({
  orgSlug,
  processoId,
}: {
  orgSlug: string;
  processoId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<CreateMovimentacaoInput>({
    resolver: zodResolver(createMovimentacaoSchema),
    defaultValues: {
      orgSlug,
      processoId,
      dataMovimentacao: new Date().toISOString().split("T")[0],
      descricao: "",
      tipo: "andamento",
      isIntimacao: false,
      prazoDias: null,
    },
  });

  const isIntimacao = form.watch("isIntimacao");

  const { field: tipoField } = useController({ name: "tipo", control: form.control });

  function onSubmit(values: CreateMovimentacaoInput) {
    startTransition(async () => {
      const result = await createMovimentacaoAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Movimentação registrada");
      form.reset({
        orgSlug,
        processoId,
        dataMovimentacao: new Date().toISOString().split("T")[0],
        descricao: "",
        tipo: "andamento",
        isIntimacao: false,
        prazoDias: null,
      });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="gap-1.5">
            <PlusIcon className="h-3.5 w-3.5" />
            Nova movimentação
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar movimentação</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <TextField
              name="dataMovimentacao"
              control={form.control}
              label="Data *"
              inputProps={{ type: "date" }}
            />

            <FormItem>
              <FormLabel>Tipo *</FormLabel>
              <FormControl>
                <Select value={tipoField.value} onValueChange={tipoField.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>

            <TextField
              name="descricao"
              control={form.control}
              label="Descrição *"
              inputProps={{ placeholder: "Descreva o andamento processual..." }}
            />

            <div className="flex items-center gap-2">
              <Checkbox
                id="isIntimacao"
                checked={isIntimacao}
                onCheckedChange={(v) => form.setValue("isIntimacao", Boolean(v))}
              />
              <label htmlFor="isIntimacao" className="cursor-pointer text-sm">
                É uma intimação com prazo
              </label>
            </div>

            {isIntimacao && (
              <TextField
                name="prazoDias"
                control={form.control}
                label="Prazo (dias úteis)"
                inputProps={{ type: "number", min: 1, placeholder: "Ex: 15" }}
              />
            )}

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Salvando..." : "Registrar movimentação"}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
