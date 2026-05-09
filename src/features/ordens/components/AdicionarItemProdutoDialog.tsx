import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatBRL } from '@/lib/format'
import { useListarProdutos } from '@/features/produtos/hooks/useListarProdutos'
import {
  adicionarItemProdutoSchema,
  type AdicionarItemProdutoFormValues,
} from '../helpers/ordemSchemas'
import { useAdicionarItemProduto } from '../hooks/useItensProduto'

interface Props {
  ordemId: number
}

type Modo = 'catalogado' | 'avulso'

export function AdicionarItemProdutoDialog({ ordemId }: Props) {
  const [open, setOpen] = useState(false)
  const [modo, setModo] = useState<Modo>('catalogado')

  const { data: produtos } = useListarProdutos({ pagina: 1, porPagina: 100 })
  const ativos = (produtos?.dados ?? []).filter((p) => p.ativo)

  const adicionar = useAdicionarItemProduto()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdicionarItemProdutoFormValues>({
    resolver: zodResolver(adicionarItemProdutoSchema),
    defaultValues: {
      quantidade: 1,
      produtoFornecidoPeloCliente: false,
    },
  })

  function reiniciar(novoModo: Modo) {
    setModo(novoModo)
    reset({
      quantidade: 1,
      produtoFornecidoPeloCliente: false,
      ...(novoModo === 'catalogado'
        ? { produtoId: undefined, nomeProduto: '', precoUnitario: undefined }
        : { produtoId: undefined, nomeProduto: '', precoUnitario: 0 }),
    })
  }

  async function onSubmit(values: AdicionarItemProdutoFormValues) {
    // Em modo catalogado, força nome/preço a null (back usa snapshot do produto)
    const payload =
      modo === 'catalogado'
        ? {
            ...values,
            nomeProduto: null,
            precoUnitario: undefined as unknown as number | undefined,
          }
        : { ...values, produtoId: undefined }

    try {
      await adicionar.mutateAsync({ ordemId, values: payload as AdicionarItemProdutoFormValues })
      toast.success('Produto adicionado à OS.')
      setOpen(false)
      reiniciar('catalogado')
    } catch (err) {
      const apiErr = err as { message?: string }
      toast.error(apiErr.message ?? 'Não foi possível adicionar o produto.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) reiniciar('catalogado')
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          Adicionar produto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar item de produto</DialogTitle>
          <DialogDescription>
            Use o catálogo para movimentar estoque automaticamente, ou item avulso quando o
            produto não está cadastrado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 rounded-md border bg-muted/40 p-1 text-sm">
          <button
            type="button"
            onClick={() => reiniciar('catalogado')}
            className={`flex-1 rounded px-3 py-1.5 transition ${
              modo === 'catalogado' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Do catálogo
          </button>
          <button
            type="button"
            onClick={() => reiniciar('avulso')}
            className={`flex-1 rounded px-3 py-1.5 transition ${
              modo === 'avulso' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Avulso
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {modo === 'catalogado' ? (
            <div className="space-y-2">
              <Label>Produto *</Label>
              <Controller
                control={control}
                name="produtoId"
                render={({ field }) => (
                  <Select
                    {...(field.value ? { value: String(field.value) } : {})}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      {ativos.length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Nenhum produto ativo no catálogo.
                        </div>
                      )}
                      {ativos.map((p) => (
                        <SelectItem key={p.id ?? `prd-${p.nome}`} value={String(p.id)}>
                          <span className="flex items-center justify-between gap-3">
                            <span>
                              {p.nome}
                              {p.referencia && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  Ref. {p.referencia}
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {formatBRL(p.precoVenda ?? 0)} · estoque {p.quantidadeEstoque}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.produtoId && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.produtoId.message}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nomeProduto">Nome do produto *</Label>
                <Input id="nomeProduto" aria-invalid={!!errors.nomeProduto} {...register('nomeProduto')} />
                {errors.nomeProduto && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.nomeProduto.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="precoUnitario">Preço (R$) *</Label>
                <Input
                  id="precoUnitario"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  aria-invalid={!!errors.precoUnitario}
                  {...register('precoUnitario')}
                />
                {errors.precoUnitario && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.precoUnitario.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                aria-invalid={!!errors.quantidade}
                {...register('quantidade')}
              />
              {errors.quantidade && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.quantidade.message}
                </p>
              )}
            </div>
            <div className="flex items-center pt-7">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  {...register('produtoFornecidoPeloCliente')}
                />
                Fornecido pelo cliente
              </label>
            </div>
          </div>

          <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Itens fornecidos pelo cliente não compõem o total da OS e não movimentam
            estoque (mesmo se vinculados a um produto cadastrado).
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
